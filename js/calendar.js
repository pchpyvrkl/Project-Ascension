import { ui } from './ui-state.js';
import { state, saveState } from './store.js';
import { dayStats, isCompleted, setCompleted, lifetimeXP, xpToLevel } from './domain.js';
import { fmtDate, parseDate, todayStr, escapeHtml, normalizeNote } from './utils.js';
import { i18nText, currentLang, WEEKDAY_LABELS } from './i18n.js';
import { showPanel, closeAllPanels } from './panels.js';
import { openTaskPanel, openDeleteScopeModal } from './taskpanel.js';
import { renderToday } from './today.js';

export function renderCalendar(){
  const y = ui.calCursor.getFullYear(), m = ui.calCursor.getMonth();
  document.getElementById('cal-monthlabel').textContent = ui.calCursor.toLocaleDateString(currentLang==='th' ? 'th-TH' : undefined,{month:'long', year:'numeric'});
  const dowRow = document.getElementById('cal-dows');
  dowRow.innerHTML = WEEKDAY_LABELS.map(d=>`<div class="cal-dow">${d}</div>`).join('');

  const first = new Date(y,m,1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  const totalCells = Math.ceil((startOffset+daysInMonth)/7)*7;
  const cursor = new Date(y,m,1 - startOffset);
  const todayDs = todayStr();
  const totalXP = lifetimeXP();

  for(let i=0;i<totalCells;i++){
    const ds = fmtDate(cursor);
    const inMonth = cursor.getMonth()===m;
    const s = dayStats(ds);
    const cell = document.createElement('div');
    const xpLevel = xpToLevel(s.xp, totalXP);
    cell.className = 'cal-cell'+(inMonth?'':' out')+(ds===todayDs?' today':'');
    cell.dataset.xp = xpLevel;
    
    let dotsHtml = '';
    const cats = {};
    s.applicable.forEach(t=>{ cats[t.color] = (cats[t.color]||0)+1; });
    Object.keys(cats).slice(0,8).forEach(c=> dotsHtml += `<span class="cal-dot" style="background:${c}"></span>`);
    
    cell.innerHTML = `<div class="cal-daynum">${cursor.getDate()}</div><div class="cal-dots">${dotsHtml}</div>${s.total?`<div class="cal-pct ${s.pct===100?'full':''}">${s.pct}%</div>`:''}${s.xp>0?`<div class="cal-xp">${s.xp} XP</div>`:''}`;
    cell.addEventListener('click', ()=>openDayPanel(ds));
    grid.appendChild(cell);
    cursor.setDate(cursor.getDate()+1);
  }
}
export function calShift(dir){ ui.calCursor.setMonth(ui.calCursor.getMonth()+dir); renderCalendar(); }
export function calToday(){ ui.calCursor = new Date(); renderCalendar(); }

/* ---------- Day panel ---------- */
export function openDayPanel(ds){
  ui.activeDayStr = ds;
  const s = dayStats(ds);
  document.getElementById('day-panel-title').textContent = parseDate(ds).toLocaleDateString(currentLang==='th' ? 'th-TH' : undefined,{weekday:'long', month:'long', day:'numeric', year:'numeric'});
  document.getElementById('day-panel-sub').textContent = i18nText('daypanel.completed', {done:s.done, total:s.total});
  document.getElementById('day-xp').textContent = s.xp;
  document.getElementById('day-pct').textContent = s.pct+'%';
  const list = document.getElementById('day-tasklist');
  list.innerHTML = '';
  
  // Group tasks by category
  const grouped = {};
  const uncategorized = [];
  s.applicable.forEach(t=>{
    if(t.categoryId && state.categories && state.categories.find(c=>c.id===t.categoryId)){
      if(!grouped[t.categoryId]) grouped[t.categoryId] = [];
      grouped[t.categoryId].push(t);
    } else {
      uncategorized.push(t);
    }
  });
  
  // Render categorized tasks
  Object.keys(grouped).forEach(catId => {
    const category = state.categories ? state.categories.find(c=>c.id===catId) : null;
    if(!category) return;
    
    const isCollapsed = state.collapsedCategories && state.collapsedCategories[catId];
    
    const header = document.createElement('div');
    header.className = 'category-header' + (isCollapsed ? ' collapsed' : '');
    header.innerHTML = `
      <span class="collapse-icon">▼</span>
      <span class="category-dot" style="background:${category.color}"></span>
      <span>${category.name}</span>
    `;
    header.onclick = () => {
      if(!state.collapsedCategories) state.collapsedCategories = {};
      state.collapsedCategories[catId] = !state.collapsedCategories[catId];
      saveState();
      openDayPanel(ds);
    };
    list.appendChild(header);
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'category-tasks' + (isCollapsed ? ' collapsed' : '');
    
    grouped[catId].forEach(t=>{
      const done = isCompleted(ds, t.id);
      const row = document.createElement('div');
      row.className = 'task-row'+(done?' done':'');
      row.innerHTML = `<button class="chk ${done?'checked':''}" data-tid="${t.id}" tabindex="0" aria-label="${done ? 'Mark as incomplete' : 'Mark as complete'}">${done?'✓':''}</button>
        <span class="task-color-dot" style="background:${t.color}"></span><span class="task-name ${done?'strike':''}">${escapeHtml(t.name)}</span>
        <span class="task-xp">+${t.xp} XP</span>
        <div class="task-actions" style="opacity:1;">
          <button class="icon-btn" data-edit="${t.id}" tabindex="0" aria-label="Edit task">✏️</button>
          <button class="icon-btn" data-del="${t.id}" tabindex="0" aria-label="Delete task">🗑</button>
        </div>`;
      tasksContainer.appendChild(row);
    });
    
    list.appendChild(tasksContainer);
  });
  
  // Render uncategorized tasks
  if(uncategorized.length > 0){
    const isCollapsed = state.collapsedCategories && state.collapsedCategories['uncategorized'];
    
    const header = document.createElement('div');
    header.className = 'category-header' + (isCollapsed ? ' collapsed' : '');
    header.innerHTML = `
      <span class="collapse-icon">▼</span>
      <span>Uncategorized</span>
    `;
    header.onclick = () => {
      if(!state.collapsedCategories) state.collapsedCategories = {};
      state.collapsedCategories['uncategorized'] = !state.collapsedCategories['uncategorized'];
      saveState();
      openDayPanel(ds);
    };
    list.appendChild(header);
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'category-tasks' + (isCollapsed ? ' collapsed' : '');
    
    uncategorized.forEach(t=>{
      const done = isCompleted(ds, t.id);
      const row = document.createElement('div');
      row.className = 'task-row'+(done?' done':'');
      row.innerHTML = `<button class="chk ${done?'checked':''}" data-tid="${t.id}" tabindex="0" aria-label="${done ? 'Mark as incomplete' : 'Mark as complete'}">${done?'✓':''}</button>
        <span class="task-color-dot" style="background:${t.color}"></span><span class="task-name ${done?'strike':''}">${escapeHtml(t.name)}</span>
        <span class="task-xp">+${t.xp} XP</span>
        <div class="task-actions" style="opacity:1;">
          <button class="icon-btn" data-edit="${t.id}" tabindex="0" aria-label="Edit task">✏️</button>
          <button class="icon-btn" data-del="${t.id}" tabindex="0" aria-label="Delete task">🗑</button>
        </div>`;
      tasksContainer.appendChild(row);
    });
    
    list.appendChild(tasksContainer);
  }
  
  list.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=>openDeleteScopeModal(b.dataset.del, ds)));
  list.querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=>{
    closeAllPanels();
    openTaskPanel(b.dataset.edit);
  }));
  list.querySelectorAll('.chk').forEach(chk=>{
    chk.addEventListener('click', ()=>{
      const tid = chk.dataset.tid;
      const t = state.tasks.find(x=>x.id===tid);
      setCompleted(ds, tid, !isCompleted(ds,tid), t.xp);
      openDayPanel(ds); renderCalendar(); renderToday();
    });
  });
  document.getElementById('day-notes').value = normalizeNote(state.notes[ds]).text;
  showPanel('panel-day');
}

export function saveDayNotes(){
  if(!ui.activeDayStr) return;
  state.notes[ui.activeDayStr] = { text: document.getElementById('day-notes').value, updatedAt: new Date().toISOString() };
  saveState();
}
