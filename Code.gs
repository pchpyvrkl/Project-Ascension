/**
 * ASCEND — Google Apps Script backend
 * ------------------------------------
 * This is the entire API layer. It stores data in the Google Sheet
 * it's bound to (Users / Sessions / Tasks / Logs / Notes / Categories / UserMeta tabs — created
 * automatically on first run) and never exposes any credentials
 * to the frontend.
 *
 * SETUP: see SETUP.md. Short version:
 *   1. Create a Google Sheet.
 *   2. Extensions > Apps Script, paste this whole file in as Code.gs.
 *   3. Deploy > New deployment > Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *   4. Copy the /exec URL it gives you.
 *   5. Paste that URL into Ascend's "Cloud Sync" panel.
 *
 * DATA STRUCTURE:
 *   - Logs sheet now uses ONE ROW PER TASK PER DAY (not JSON)
 *   - Columns: UserId, Date, TaskId, Completed, CompletedAt, XP
 *   - This prevents cell size limit issues
 */

const SHEET_USERS = 'Users';
const SHEET_SESSIONS = 'Sessions';
const SHEET_TASKS = 'Tasks';
const SHEET_LOGS = 'Logs';
const SHEET_NOTES = 'Notes';
const SHEET_CATEGORIES = 'Categories';
const SHEET_USERMETA = 'UserMeta';

/* ---------------- HTTP entry points ---------------- */

function doGet(e) {
  // Allow creating sheets via GET for easy setup
  if (e && e.parameter && e.parameter.action === 'createAllSheets') {
    return ContentService.createTextOutput(JSON.stringify(createAllSheets()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Ascend API is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    switch (action) {
      case 'register':
        result = registerUser(body.username, body.password);
        break;
      case 'login':
        result = loginUser(body.username, body.password);
        break;
      case 'getState':
        result = { ok: true, state: getState(requireUser(body.token)) };
        break;
      case 'saveState':
        saveState(requireUser(body.token), body.state);
        result = { ok: true };
        break;
      case 'logout':
        logoutUser(body.token);
        result = { ok: true };
        break;
      case 'deleteAccount':
        deleteAccount(requireUser(body.token), body.token);
        result = { ok: true };
        break;
      case 'migrateLogs':
        result = migrateLogsFromJson();
        break;
      case 'checkLogsStructure':
        result = checkLogsStructure();
        break;
      case 'createAllSheets':
        result = createAllSheets();
        break;
      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { ok: false, error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Sheet helpers ---------------- */

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId_());
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  } else {
    // Verify headers exist, recreate if missing
    const lastCol = sh.getLastColumn();
    if (lastCol > 0) {
      const existingHeaders = sh.getRange(1, 1, 1, lastCol).getValues()[0];
      const headerStr = existingHeaders.join(',');
      const expectedHeaderStr = headers.join(',');
      if (headerStr !== expectedHeaderStr) {
        // Headers don't match, recreate the sheet
        const tempName = name + '_temp_' + new Date().getTime();
        ss.insertSheet(tempName).appendRow(headers);
        const tempSh = ss.getSheetByName(tempName);
        sh.delete();
        tempSh.setName(name);
        sh = tempSh;
      }
    } else {
      // Sheet exists but has no data, add headers
      sh.appendRow(headers);
    }
  }
  return sh;
}

function getSpreadsheetId_(){
  const id = PropertiesService.getScriptProperties().getProperty('ASCEND_SPREADSHEET_ID');
  if(!id) throw new Error('Spreadsheet not bound and no ASCEND_SPREADSHEET_ID script property is set. Bind this Apps Script to a sheet, or set ASCEND_SPREADSHEET_ID in Script Properties.');
  return id;
}

function usersSheet_() { return getSheet_(SHEET_USERS, ['UserId', 'Username', 'PasswordHash', 'Salt', 'CreatedAt']); }
function sessionsSheet_() { return getSheet_(SHEET_SESSIONS, ['Token', 'UserId', 'CreatedAt']); }
function tasksSheet_() {
  // One row per task
  return getSheet_(SHEET_TASKS, ['UserId', 'TaskId', 'Name', 'XP', 'Color', 'Repeat', 'Weekdays', 'EveryX', 'StartDate', 'EndDate', 'CategoryId', 'Active', 'Deleted', 'Order', 'CreatedAt', 'UpdatedAt', 'Exceptions']);
}
function logsSheet_() {
  // One row per task per day per user - individual task completions
  return getSheet_(SHEET_LOGS, ['UserId', 'Date', 'TaskId', 'Completed', 'CompletedAt', 'XP']);
}
function notesSheet_() {
  // One row per note per day
  return getSheet_(SHEET_NOTES, ['UserId', 'Date', 'Text', 'UpdatedAt']);
}
function categoriesSheet_() {
  // One row per category
  return getSheet_(SHEET_CATEGORIES, ['UserId', 'CategoryId', 'Name', 'Color', 'UpdatedAt']);
}
function userMetaSheet_() {
  // Store user metadata like createdAt
  return getSheet_(SHEET_USERMETA, ['UserId', 'CreatedAt']);
}

/* ---------------- Auth ---------------- */

function hashPassword_(password, salt) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return digest.map(function (b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}

function registerUser(username, password) {
  if (!username || !password) throw new Error('Username and password required');
  const sh = usersSheet_();
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toLowerCase() === String(username).toLowerCase()) {
      throw new Error('That username is already taken');
    }
  }
  const userId = Utilities.getUuid();
  const salt = Utilities.getUuid();
  const hash = hashPassword_(password, salt);
  sh.appendRow([userId, username, hash, salt, new Date().toISOString()]);
  // No need to create a row in data sheet - data is stored per-day
  const token = createSession_(userId);
  return { ok: true, token: token, userId: userId };
}

function loginUser(username, password) {
  const sh = usersSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) throw new Error('No account with that username');
  
  // Only read the necessary columns for better performance
  const rows = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  const usernameLower = String(username).toLowerCase();
  
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]).toLowerCase() === usernameLower) {
      const hash = hashPassword_(password, rows[i][3]);
      if (hash === rows[i][2]) {
        const token = createSession_(rows[i][0]);
        return { ok: true, token: token, userId: rows[i][0] };
      }
      throw new Error('Incorrect password');
    }
  }
  throw new Error('No account with that username');
}

function createSession_(userId) {
  const token = Utilities.getUuid();
  sessionsSheet_().appendRow([token, userId, new Date().toISOString()]);
  // Clean up old sessions less frequently (only 10% of the time) to improve performance
  if (Math.random() < 0.1) {
    cleanupOldSessions_();
  }
  return token;
}

function cleanupOldSessions_() {
  const sh = sessionsSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return; // Only header row exists
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Only check the last 100 rows for performance
  const startRow = Math.max(2, lastRow - 100);
  const rows = sh.getRange(startRow, 1, lastRow - startRow + 1, 3).getValues();
  
  // Delete rows older than 30 days (iterate backwards to avoid index issues)
  for (let i = rows.length - 1; i >= 0; i--) {
    const createdAt = new Date(rows[i][2]);
    if (createdAt < thirtyDaysAgo) {
      sh.deleteRow(startRow + i);
    }
  }
}

function requireUser(token) {
  if (!token) throw new Error('Missing session token');
  const sh = sessionsSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) throw new Error('Session expired — please log in again');
  
  // Only check the last 50 rows for performance (recent sessions)
  const startRow = Math.max(2, lastRow - 50);
  const rows = sh.getRange(startRow, 1, lastRow - startRow + 1, 3).getValues();
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === token) return rows[i][1];
  }
  throw new Error('Session expired — please log in again');
}

function logoutUser(token) {
  const sh = sessionsSheet_();
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) { sh.deleteRow(i + 1); return; }
  }
}

function deleteAccount(userId, token) {
  // Remove the user's row from Users
  const ush = usersSheet_();
  const urows = ush.getDataRange().getValues();
  for (let i = urows.length - 1; i >= 1; i--) {
    if (urows[i][0] === userId) ush.deleteRow(i + 1);
  }
  // Remove all tasks
  const tsh = tasksSheet_();
  const trows = tsh.getDataRange().getValues();
  for (let i = trows.length - 1; i >= 1; i--) {
    if (trows[i][0] === userId) tsh.deleteRow(i + 1);
  }
  // Remove all logs (one row per task per day)
  const lsh = logsSheet_();
  const lrows = lsh.getDataRange().getValues();
  for (let i = lrows.length - 1; i >= 1; i--) {
    if (lrows[i][0] === userId) lsh.deleteRow(i + 1);
  }
  // Remove all notes
  const nsh = notesSheet_();
  const nrows = nsh.getDataRange().getValues();
  for (let i = nrows.length - 1; i >= 1; i--) {
    if (nrows[i][0] === userId) nsh.deleteRow(i + 1);
  }
  // Remove all categories
  const csh = categoriesSheet_();
  const crows = csh.getDataRange().getValues();
  for (let i = crows.length - 1; i >= 1; i--) {
    if (crows[i][0] === userId) csh.deleteRow(i + 1);
  }
  // Remove user metadata
  const msh = userMetaSheet_();
  const mrows = msh.getDataRange().getValues();
  for (let i = mrows.length - 1; i >= 1; i--) {
    if (mrows[i][0] === userId) msh.deleteRow(i + 1);
  }
  // Remove every session for this user (not just the current token — logs
  // them out everywhere, since the account no longer exists)
  const ssh = sessionsSheet_();
  const srows = ssh.getDataRange().getValues();
  for (let i = srows.length - 1; i >= 1; i--) {
    if (srows[i][1] === userId) ssh.deleteRow(i + 1);
  }
}

function todayIso_() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function emptyState_() {
  return { tasks: [], logs: {}, notes: {}, categories: [], collapsedCategories: {}, createdAt: todayIso_() };
}

/* ---------------- Per-user app state ---------------- */

function getState(userId) {
  // Get user metadata
  const msh = userMetaSheet_();
  const mrows = msh.getDataRange().getValues();
  let createdAt = todayIso_();
  for (let i = 1; i < mrows.length; i++) {
    if (mrows[i][0] === userId && mrows[i][1]) {
      createdAt = mrows[i][1];
      break;
    }
  }

  // Get all tasks for this user
  const tsh = tasksSheet_();
  const trows = tsh.getDataRange().getValues();
  const tasks = [];
  for (let i = 1; i < trows.length; i++) {
    if (trows[i][0] === userId) {
      const row = trows[i];
      tasks.push({
        id: row[1],
        name: row[2],
        xp: row[3],
        color: row[4],
        repeat: row[5],
        weekdays: row[6] ? JSON.parse(row[6]) : [],
        everyx: row[7],
        startDate: row[8],
        endDate: row[9],
        categoryId: row[10],
        active: row[11],
        deleted: row[12],
        order: row[13],
        createdAt: row[14],
        updatedAt: row[15],
        exceptions: row[16] ? JSON.parse(row[16]) : []
      });
    }
  }

  // Get all logs for this user (one row per task per day)
  const lsh = logsSheet_();
  const lrows = lsh.getDataRange().getValues();
  const logs = {};
  for (let i = 1; i < lrows.length; i++) {
    if (lrows[i][0] === userId) {
      const row = lrows[i];
      const date = row[1];
      const taskId = row[2];
      const completed = row[3];
      const completedAt = row[4];
      const xp = row[5] || 0;

      // Group by date, then by taskId
      if (!logs[date]) {
        logs[date] = {};
      }
      logs[date][taskId] = {
        completed: !!completed,
        completedAt: completedAt,
        xp: completed ? xp : 0
      };
    }
  }

  // Get all notes for this user
  const nsh = notesSheet_();
  const nrows = nsh.getDataRange().getValues();
  const notes = {};
  for (let i = 1; i < nrows.length; i++) {
    if (nrows[i][0] === userId) {
      const row = nrows[i];
      notes[row[1]] = {
        text: row[2],
        updatedAt: row[3]
      };
    }
  }

  // Get all categories for this user
  const csh = categoriesSheet_();
  const crows = csh.getDataRange().getValues();
  const categories = [];
  for (let i = 1; i < crows.length; i++) {
    if (crows[i][0] === userId) {
      const row = crows[i];
      categories.push({
        id: row[1],
        name: row[2],
        color: row[3],
        updatedAt: row[4]
      });
    }
  }

  // If no data found, return empty state
  if (tasks.length === 0 &&
      Object.keys(logs).length === 0 &&
      Object.keys(notes).length === 0 &&
      categories.length === 0) {
    return emptyState_();
  }

  return {
    tasks,
    logs,
    notes,
    categories,
    collapsedCategories: {},
    createdAt
  };
}

function saveState(userId, stateObj) {
  // Ensure user metadata exists
  const msh = userMetaSheet_();
  const mrows = msh.getDataRange().getValues();
  let metaRow = null;
  for (let i = 1; i < mrows.length; i++) {
    if (mrows[i][0] === userId) {
      metaRow = i + 1;
      break;
    }
  }
  if (metaRow) {
    msh.getRange(metaRow, 2).setValue(stateObj.createdAt || todayIso_());
  } else {
    msh.appendRow([userId, stateObj.createdAt || todayIso_()]);
  }

  // Save tasks - update existing, add new, delete removed
  const tsh = tasksSheet_();
  const trows = tsh.getDataRange().getValues();
  const existingTaskIds = new Set();
  const tasksToDelete = [];

  for (let i = 1; i < trows.length; i++) {
    if (trows[i][0] === userId) {
      const taskId = trows[i][1];
      existingTaskIds.add(taskId);
      const taskInState = stateObj.tasks.find(t => t.id === taskId);
      if (taskInState) {
        // Update existing task
        tsh.getRange(i + 1, 3, 1, 14).setValues([[
          taskInState.name,
          taskInState.xp,
          taskInState.color,
          taskInState.repeat,
          JSON.stringify(taskInState.weekdays || []),
          taskInState.everyx,
          taskInState.startDate,
          taskInState.endDate,
          taskInState.categoryId,
          taskInState.active,
          taskInState.deleted,
          taskInState.order,
          taskInState.updatedAt,
          JSON.stringify(taskInState.exceptions || [])
        ]]);
      } else {
        // Task no longer in state, mark for deletion
        tasksToDelete.push(i + 1);
      }
    }
  }

  // Delete removed tasks (iterate backwards)
  for (let i = tasksToDelete.length - 1; i >= 0; i--) {
    tsh.deleteRow(tasksToDelete[i]);
  }

  // Add new tasks
  for (const task of stateObj.tasks) {
    if (!existingTaskIds.has(task.id)) {
      tsh.appendRow([
        userId,
        task.id,
        task.name,
        task.xp,
        task.color,
        task.repeat,
        JSON.stringify(task.weekdays || []),
        task.everyx,
        task.startDate,
        task.endDate,
        task.categoryId,
        task.active,
        task.deleted,
        task.order,
        task.createdAt,
        task.updatedAt,
        JSON.stringify(task.exceptions || [])
      ]);
    }
  }

  // Save logs - one row per task per day per user
  const lsh = logsSheet_();
  
  // Check if Logs sheet has correct structure (6 columns)
  const headerRow = lsh.getRange(1, 1, 1, 6).getValues()[0];
  if (!headerRow || headerRow.length !== 6 || 
      headerRow[0] !== 'UserId' || 
      headerRow[1] !== 'Date' || 
      headerRow[2] !== 'TaskId' || 
      headerRow[3] !== 'Completed' || 
      headerRow[4] !== 'CompletedAt' || 
      headerRow[5] !== 'XP') {
    // Sheet has wrong structure - recreate it
    ss.deleteSheet(lsh);
    lsh = ss.insertSheet('Logs');
    lsh.appendRow(['UserId', 'Date', 'TaskId', 'Completed', 'CompletedAt', 'XP']);
  }
  
  const lrows = lsh.getDataRange().getValues();

  // Build map of existing logs: key = "UserId-Date-TaskId", value = {rowIndex, data}
  const existingLogsMap = new Map();
  for (let i = 1; i < lrows.length; i++) {
    if (lrows[i][0] === userId) {
      const key = `${userId}-${lrows[i][1]}-${lrows[i][2]}`;
      existingLogsMap.set(key, {
        rowIndex: i + 1,
        completed: lrows[i][3],
        completedAt: lrows[i][4],
        xp: lrows[i][5] || 0
      });
    }
  }

  // Track which task-date combinations exist in the new state
  const stateLogKeys = new Set();
  const logsToUpdate = [];
  const logsToAdd = [];

  // Process logs from state (iterate through each date, then each task)
  for (const [date, dayLogs] of Object.entries(stateObj.logs || {})) {
    for (const [taskId, logEntry] of Object.entries(dayLogs)) {
      const key = `${userId}-${date}-${taskId}`;
      stateLogKeys.add(key);

      const existing = existingLogsMap.get(key);
      const completed = !!logEntry.completed;
      const completedAt = logEntry.completedAt || new Date().toISOString();
      const xp = completed ? (logEntry.xp || 0) : 0;

      if (existing) {
        // Check if data changed
        if (existing.completed !== completed ||
            existing.completedAt !== completedAt ||
            existing.xp !== xp) {
          logsToUpdate.push({
            rowIndex: existing.rowIndex,
            data: [completed, completedAt, xp]
          });
        }
      } else {
        // New task log entry
        logsToAdd.push([userId, date, taskId, completed, completedAt, xp]);
      }
    }
  }

  // Delete logs for task-date combinations that no longer exist in state (iterate backwards)
  const logRowsToDelete = [];
  for (const [key, existing] of existingLogsMap) {
    if (!stateLogKeys.has(key)) {
      logRowsToDelete.push(existing.rowIndex);
    }
  }
  for (let i = logRowsToDelete.length - 1; i >= 0; i--) {
    lsh.deleteRow(logRowsToDelete[i]);
  }

  // Update changed logs (row indices may shift after deletions)
  for (const update of logsToUpdate) {
    lsh.getRange(update.rowIndex, 4, 1, 3).setValues([update.data]);
  }

  // Add new logs
  for (const newLog of logsToAdd) {
    lsh.appendRow(newLog);
  }

  // Save notes - incremental update: update changed, delete removed, add new
  const nsh = notesSheet_();
  const nrows = nsh.getDataRange().getValues();
  
  // Build map of existing notes: key = "UserId-Date", value = {rowIndex, data}
  const existingNotesMap = new Map();
  for (let i = 1; i < nrows.length; i++) {
    if (nrows[i][0] === userId) {
      const key = `${userId}-${nrows[i][1]}`;
      existingNotesMap.set(key, {
        rowIndex: i + 1,
        text: nrows[i][2],
        updatedAt: nrows[i][3]
      });
    }
  }
  
  // Track which keys exist in the new state
  const stateNoteKeys = new Set();
  const notesToUpdate = [];
  const notesToAdd = [];
  
  // Process notes from state
  for (const [date, noteEntry] of Object.entries(stateObj.notes || {})) {
    const normalizedNote = typeof noteEntry === 'string' 
      ? { text: noteEntry, updatedAt: '1970-01-01T00:00:00.000Z' }
      : noteEntry;
    
    const key = `${userId}-${date}`;
    stateNoteKeys.add(key);
    
    const existing = existingNotesMap.get(key);
    if (existing) {
      // Check if data changed (compare text and updatedAt)
      if (existing.text !== normalizedNote.text ||
          existing.updatedAt !== normalizedNote.updatedAt) {
        notesToUpdate.push({
          rowIndex: existing.rowIndex,
          data: [normalizedNote.text, normalizedNote.updatedAt]
        });
      }
    } else {
      // New note entry
      notesToAdd.push([userId, date, normalizedNote.text, normalizedNote.updatedAt]);
    }
  }
  
  // Delete notes that no longer exist in state (iterate backwards to avoid index issues)
  const noteRowsToDelete = [];
  for (const [key, existing] of existingNotesMap) {
    if (!stateNoteKeys.has(key)) {
      noteRowsToDelete.push(existing.rowIndex);
    }
  }
  for (let i = noteRowsToDelete.length - 1; i >= 0; i--) {
    nsh.deleteRow(noteRowsToDelete[i]);
  }
  
  // Update changed notes (note: row indices may shift after deletions)
  for (const update of notesToUpdate) {
    nsh.getRange(update.rowIndex, 3, 1, 2).setValues([update.data]);
  }
  
  // Add new notes
  for (const newNote of notesToAdd) {
    nsh.appendRow(newNote);
  }

  // Save categories - update existing, add new, delete removed
  const csh = categoriesSheet_();
  const crows = csh.getDataRange().getValues();
  const existingCategoryIds = new Set();
  const categoriesToDelete = [];

  for (let i = 1; i < crows.length; i++) {
    if (crows[i][0] === userId) {
      const categoryId = crows[i][1];
      existingCategoryIds.add(categoryId);
      const categoryInState = (stateObj.categories || []).find(c => c.id === categoryId);
      if (categoryInState) {
        // Update existing category
        csh.getRange(i + 1, 3, 1, 2).setValues([[
          categoryInState.name,
          categoryInState.color,
          categoryInState.updatedAt
        ]]);
      } else {
        // Category no longer in state, mark for deletion
        categoriesToDelete.push(i + 1);
      }
    }
  }

  // Delete removed categories (iterate backwards)
  for (let i = categoriesToDelete.length - 1; i >= 0; i--) {
    csh.deleteRow(categoriesToDelete[i]);
  }

  // Add new categories
  for (const category of (stateObj.categories || [])) {
    if (!existingCategoryIds.has(category.id)) {
      csh.appendRow([
        userId,
        category.id,
        category.name,
        category.color,
        category.updatedAt
      ]);
    }
  }
}

/* ---------------- Migration helper for existing data ---------------- */

function migrateLogsFromJson() {
  // This function migrates existing JSON-based logs to the new row-per-task format
  // Run this once after deploying the updated code
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId_());
  const lsh = ss.getSheetByName(SHEET_LOGS);
  
  if (!lsh) {
    console.log('No Logs sheet found, nothing to migrate');
    return;
  }
  
  const lrows = lsh.getDataRange().getValues();
  
  // Check if already in new format (has 6 columns)
  if (lrows.length > 0 && lrows[0].length === 6) {
    console.log('Logs sheet already in new format, nothing to migrate');
    return;
  }
  
  // Check if in old format (has 3 columns: UserId, Date, Logs)
  if (lrows.length > 0 && lrows[0].length === 3) {
    console.log('Migrating logs from JSON format to row-per-task format...');
    
    // Create backup sheet
    const backupName = SHEET_LOGS + '_backup_' + new Date().getTime();
    lsh.copyTo(ss).setName(backupName);
    console.log('Created backup: ' + backupName);
    
    // Clear the sheet and add new headers
    lsh.clear();
    lsh.appendRow(['UserId', 'Date', 'TaskId', 'Completed', 'CompletedAt', 'XP']);
    
    // Migrate data
    let migratedCount = 0;
    for (let i = 1; i < lrows.length; i++) {
      const userId = lrows[i][0];
      const date = lrows[i][1];
      const logsJson = lrows[i][2];
      
      if (logsJson) {
        try {
          const dayLogs = JSON.parse(logsJson);
          for (const [taskId, logEntry] of Object.entries(dayLogs)) {
            const completed = !!logEntry.completed;
            const completedAt = logEntry.completedAt || new Date().toISOString();
            const xp = completed ? (logEntry.xp || 0) : 0;
            
            lsh.appendRow([userId, date, taskId, completed, completedAt, xp]);
            migratedCount++;
          }
        } catch (e) {
          console.error('Failed to parse logs JSON for row ' + i + ': ' + e.message);
        }
      }
    }
    
    console.log('Migration complete. Migrated ' + migratedCount + ' task log entries');
    return { success: true, migratedCount: migratedCount };
  }
  
  console.log('Logs sheet is in an unknown format');
  return { success: false, error: 'Unknown format' };
}

/* ---------------- Debug helper to check logs structure ---------------- */

function checkLogsStructure() {
  // This function checks the current structure of the Logs sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId_());
  const lsh = ss.getSheetByName(SHEET_LOGS);
  
  if (!lsh) {
    return { 
      ok: true, 
      exists: false, 
      message: 'Logs sheet does not exist yet (will be created on first use)' 
    };
  }
  
  const lastRow = lsh.getLastRow();
  const lastCol = lsh.getLastColumn();
  const headers = lastRow > 0 ? lsh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  
  const info = {
    ok: true,
    exists: true,
    totalRows: lastRow,
    totalColumns: lastCol,
    headers: headers,
    format: 'unknown'
  };
  
  // Determine format based on column count
  if (headers.length === 3) {
    info.format = 'old_json';
    info.message = 'Old format: JSON-based (one row per day with all task logs)';
  } else if (headers.length === 6) {
    info.format = 'new_row_per_task';
    info.message = 'New format: Row-per-task (one row per task per day)';
    
    // Sample some data if available
    if (lastRow > 1) {
      const sampleRows = Math.min(5, lastRow - 1);
      const sampleData = lsh.getRange(2, 1, sampleRows, 6).getValues();
      info.sampleData = sampleData.map(row => ({
        userId: row[0],
        date: row[1],
        taskId: row[2],
        completed: row[3],
        completedAt: row[4],
        xp: row[5]
      }));
    }
  } else {
    info.message = 'Unknown format with ' + headers.length + ' columns';
  }
  
  return info;
}

/* ---------------- Helper to create all sheets manually ---------------- */

function createAllSheets() {
  // This function creates all required sheets with the correct structure
  // Run this to manually set up the spreadsheet before using the app
  console.log('Starting createAllSheets...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId_());
  console.log('Spreadsheet obtained: ' + ss.getUrl());
  
  const results = [];
  
  try {
    // Create Users sheet
    console.log('Checking Users sheet...');
    let ush = ss.getSheetByName(SHEET_USERS);
    if (!ush) {
      console.log('Creating Users sheet...');
      ush = ss.insertSheet(SHEET_USERS);
      ush.appendRow(['UserId', 'Username', 'PasswordHash', 'Salt', 'CreatedAt']);
      results.push({ sheet: SHEET_USERS, status: 'created' });
      console.log('Users sheet created');
    } else {
      results.push({ sheet: SHEET_USERS, status: 'exists' });
      console.log('Users sheet already exists');
    }
    
    // Create Sessions sheet
    console.log('Checking Sessions sheet...');
    let ssh = ss.getSheetByName(SHEET_SESSIONS);
    if (!ssh) {
      console.log('Creating Sessions sheet...');
      ssh = ss.insertSheet(SHEET_SESSIONS);
      ssh.appendRow(['Token', 'UserId', 'CreatedAt']);
      results.push({ sheet: SHEET_SESSIONS, status: 'created' });
      console.log('Sessions sheet created');
    } else {
      results.push({ sheet: SHEET_SESSIONS, status: 'exists' });
      console.log('Sessions sheet already exists');
    }
    
    // Create Tasks sheet
    console.log('Checking Tasks sheet...');
    let tsh = ss.getSheetByName(SHEET_TASKS);
    if (!tsh) {
      console.log('Creating Tasks sheet...');
      tsh = ss.insertSheet(SHEET_TASKS);
      tsh.appendRow(['UserId', 'TaskId', 'Name', 'XP', 'Color', 'Repeat', 'Weekdays', 'EveryX', 'StartDate', 'EndDate', 'CategoryId', 'Active', 'Deleted', 'Order', 'CreatedAt', 'UpdatedAt', 'Exceptions']);
      results.push({ sheet: SHEET_TASKS, status: 'created' });
      console.log('Tasks sheet created');
    } else {
      results.push({ sheet: SHEET_TASKS, status: 'exists' });
      console.log('Tasks sheet already exists');
    }
    
    // Create Logs sheet (NEW STRUCTURE)
    console.log('Checking Logs sheet...');
    let lsh = ss.getSheetByName(SHEET_LOGS);
    if (!lsh) {
      console.log('Creating Logs sheet...');
      lsh = ss.insertSheet(SHEET_LOGS);
      lsh.appendRow(['UserId', 'Date', 'TaskId', 'Completed', 'CompletedAt', 'XP']);
      results.push({ sheet: SHEET_LOGS, status: 'created' });
      console.log('Logs sheet created');
    } else {
      results.push({ sheet: SHEET_LOGS, status: 'exists' });
      console.log('Logs sheet already exists');
    }
    
    // Create Notes sheet
    console.log('Checking Notes sheet...');
    let nsh = ss.getSheetByName(SHEET_NOTES);
    if (!nsh) {
      console.log('Creating Notes sheet...');
      nsh = ss.insertSheet(SHEET_NOTES);
      nsh.appendRow(['UserId', 'Date', 'Text', 'UpdatedAt']);
      results.push({ sheet: SHEET_NOTES, status: 'created' });
      console.log('Notes sheet created');
    } else {
      results.push({ sheet: SHEET_NOTES, status: 'exists' });
      console.log('Notes sheet already exists');
    }
    
    // Create Categories sheet
    console.log('Checking Categories sheet...');
    let csh = ss.getSheetByName(SHEET_CATEGORIES);
    if (!csh) {
      console.log('Creating Categories sheet...');
      csh = ss.insertSheet(SHEET_CATEGORIES);
      csh.appendRow(['UserId', 'CategoryId', 'Name', 'Color', 'UpdatedAt']);
      results.push({ sheet: SHEET_CATEGORIES, status: 'created' });
      console.log('Categories sheet created');
    } else {
      results.push({ sheet: SHEET_CATEGORIES, status: 'exists' });
      console.log('Categories sheet already exists');
    }
    
    // Create UserMeta sheet
    console.log('Checking UserMeta sheet...');
    let msh = ss.getSheetByName(SHEET_USERMETA);
    if (!msh) {
      console.log('Creating UserMeta sheet...');
      msh = ss.insertSheet(SHEET_USERMETA);
      msh.appendRow(['UserId', 'CreatedAt']);
      results.push({ sheet: SHEET_USERMETA, status: 'created' });
      console.log('UserMeta sheet created');
    } else {
      results.push({ sheet: SHEET_USERMETA, status: 'exists' });
      console.log('UserMeta sheet already exists');
    }
    
    console.log('Sheet creation results:', JSON.stringify(results, null, 2));
    return { ok: true, results: results };
    
  } catch (error) {
    console.error('Error in createAllSheets:', error);
    return { ok: false, error: error.message, results: results };
  }
}
