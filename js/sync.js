import { apiCall, getSession, getApiUrl } from './api.js';
import { state, setState, normalizeStateShape, writeState } from './store.js';
import { normalizeNote, todayStr } from './utils.js';
import { i18nText } from './i18n.js';
import { renderToday } from './today.js';
import { renderCalendar, openDayPanel } from './calendar.js';
import { renderAnalytics } from './analytics.js';
import { ui } from './ui-state.js';
import { POLL_INTERVAL_MS } from './config.js';

/* fetch + set `state` without touching the DOM — used only during boot,
   before #app is ever unlocked, so no data gets rendered pre-auth */
export async function fetchStateSilently(){
  const s = getSession(); if(!s) throw new Error('No session');
  const data = await apiCall('getState', {token:s.token});
  setState(data.state || { tasks:[], logs:{}, notes:{}, createdAt: todayStr() });
  writeState();
}

export async function pushStateToBackend(){
  const s = getSession(); if(!s) return;
  await apiCall('saveState', {token:s.token, state});
}

/* ============================================================
   MULTI-DEVICE MERGE — field-level, timestamp-based.
   Google Sheets/Apps Script can't push updates to open browsers,
   so two devices open at once each poll for the other's changes.
   A naive "whichever device saves last wins" would silently drop
   the other device's edits, so instead of overwriting the whole
   blob we merge entity-by-entity using updatedAt / completedAt,
   with tombstones (deleted:true) so deletions survive the merge
   instead of being resurrected by a device that hasn't seen them.
   ============================================================ */
export function mergeState(local, remote){
  if(!remote) return normalizeStateShape(local);

  // Tasks: union by id, newer updatedAt wins (including deletions, since a
  // delete just sets deleted:true with a fresh updatedAt).
  const taskMap = {};
  (remote.tasks||[]).forEach(t=> taskMap[t.id] = t);
  (local.tasks||[]).forEach(t=>{
    const r = taskMap[t.id];
    if(!r || (t.updatedAt||'') > (r.updatedAt||'')) taskMap[t.id] = t;
  });
  const mergedTasks = Object.values(taskMap);

  // Logs: merge per day, per task — newer completedAt wins for each entry.
  const mergedLogs = {};
  new Set([...Object.keys(local.logs||{}), ...Object.keys(remote.logs||{})]).forEach(ds=>{
    const l = (local.logs||{})[ds] || {}, r = (remote.logs||{})[ds] || {};
    const merged = {};
    new Set([...Object.keys(l), ...Object.keys(r)]).forEach(tid=>{
      const le = l[tid], re = r[tid];
      merged[tid] = (le && re) ? ((le.completedAt||'') >= (re.completedAt||'') ? le : re) : (le || re);
    });
    if(Object.keys(merged).length) mergedLogs[ds] = merged;
  });

  // Notes: per day, newer updatedAt wins (legacy string notes normalize to epoch 0).
  const mergedNotes = {};
  new Set([...Object.keys(local.notes||{}), ...Object.keys(remote.notes||{})]).forEach(ds=>{
    const l = normalizeNote(local.notes?.[ds]), r = normalizeNote(remote.notes?.[ds]);
    mergedNotes[ds] = (l.updatedAt||'') >= (r.updatedAt||'') ? l : r;
  });

  // Categories and collapsed state should survive sync as well.
  const categoryMap = {};
  (remote.categories||[]).forEach(c=> categoryMap[c.id] = c);
  (local.categories||[]).forEach(c=>{
    const r = categoryMap[c.id];
    if(!r || (c.updatedAt||'') > (r.updatedAt||'')) categoryMap[c.id] = c;
  });
  const mergedCategories = Object.values(categoryMap);
  const mergedCollapsedCategories = { ...(remote.collapsedCategories||{}), ...(local.collapsedCategories||{}) };

  return normalizeStateShape({
    tasks: mergedTasks,
    logs: mergedLogs,
    notes: mergedNotes,
    categories: mergedCategories,
    collapsedCategories: mergedCollapsedCategories,
    createdAt: local.createdAt || remote.createdAt,
  });
}

export let pollTimer = null;
export function startPolling(){
  stopPolling();
  pollTimer = setInterval(pollForRemoteChanges, POLL_INTERVAL_MS);
  document.addEventListener('visibilitychange', pollOnVisible);
}
export function stopPolling(){
  if(pollTimer){ clearInterval(pollTimer); pollTimer = null; }
  document.removeEventListener('visibilitychange', pollOnVisible);
}
export function pollOnVisible(){ if(!document.hidden) pollForRemoteChanges(); }
export async function pollForRemoteChanges(){
  const s = getSession();
  if(!s || document.hidden || !document.getElementById('app').classList.contains('unlocked')) return;
  try{
    const data = await apiCall('getState', {token:s.token});
    const remote = data.state;
    if(!remote) return;
    const before = JSON.stringify(state);
    const merged = mergeState(state, remote);
    const after = JSON.stringify(merged);
    if(after === before) return; // nothing changed on either side, skip a wasted re-render
    setState(merged);
    writeState();
    // don't clobber the notes textarea while someone's actively typing in it
    const notesFocused = document.activeElement && document.activeElement.id === 'day-notes';
    if(document.getElementById('view-today').classList.contains('active')) renderToday();
    if(document.getElementById('view-calendar').classList.contains('active')) renderCalendar();
      if(document.getElementById('view-analytics').classList.contains('active')) renderAnalytics();
    if(ui.activeDayStr && !notesFocused) openDayPanel(ui.activeDayStr);
    // reconcile: push the merged result back so the OTHER device picks up
    // anything it was missing too, next time it polls.
    if(after !== JSON.stringify(remote)) await pushStateToBackend();
    updateSyncIndicator('synced');
  }catch(e){
    // silent — a transient network hiccup shouldn't interrupt the user;
    // the debounced save-on-edit path will still report real errors
  }
}

export let syncTimer=null;
export function scheduleSync(){
  const s = getSession();
  if(!s || !getApiUrl()){ updateSyncIndicator(); return; }
  updateSyncIndicator('syncing');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async ()=>{
    try{ await pushStateToBackend(); updateSyncIndicator('synced'); }
    catch(e){ updateSyncIndicator('error'); }
  }, 900);
}
export function updateSyncIndicator(status){
  const s = getSession();
  const dot = document.getElementById('sync-dot');
  const label = document.getElementById('sync-label');
  if(!dot || !label) return;
  if(!s){ dot.style.background='var(--danger)'; label.textContent=i18nText('sync.local'); return; }
  if(status==='syncing'){ dot.style.background='var(--accent)'; label.textContent=i18nText('sync.syncing'); }
  else if(status==='error'){ dot.style.background='var(--danger)'; label.textContent=i18nText('sync.error'); }
  else{ dot.style.background='var(--accent)'; label.textContent=i18nText('sync.as', {u:s.username}); }
}
