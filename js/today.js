import { state, saveState } from './store.js';
import { dayStats, tasksForDate, isCompleted, setCompleted, computeBestRecords } from './domain.js';
import { todayStr, parseDate, escapeHtml } from './utils.js';
import { i18nText, currentLang } from './i18n.js';
import { updateAccentColor } from './theme.js';
import { openTaskPanel, openDeleteScopeModal } from './taskpanel.js';

export function renderSidebarXP(){
  let totalTasks = 0;
  let completedTasks = 0;
  
  // Calculate overall completion rate across all days
  Object.keys(state.logs).forEach(dateStr => {
    const s = dayStats(dateStr);
    totalTasks += s.total;
    completedTasks += s.done;
  });
  
  const successRate = totalTasks > 0 ? Math.round(100 * completedTasks / totalTasks) : 0;
  document.getElementById('sb-success').textContent = successRate + '%';
  document.getElementById('sb-successtext').textContent = i18nText('analytics.overallsuccess');
  document.getElementById('sb-successfill').style.width = successRate + '%';
}

export function renderToday(){
  const ds = todayStr();
  document.getElementById('today-title').textContent = i18nText('today.title');
  document.getElementById('today-sub').textContent = new Date().toLocaleDateString(currentLang==='th' ? 'th-TH' : undefined,{weekday:'long', month:'long', day:'numeric'});
  const s = dayStats(ds);
  document.getElementById('stat-todayxp').textContent = s.xp;
  document.getElementById('stat-todaypct').textContent = s.pct+'%';
  const records = computeBestRecords();
  document.getElementById('stat-bestpct').textContent = records.bestPct.pct + '%';
  document.getElementById('stat-bestxp').textContent = records.bestXP.xp;
  
  // Format dates for display
  if(records.bestPct.date){
    const bestPctDate = parseDate(records.bestPct.date);
    document.getElementById('stat-bestpct-date').textContent = bestPctDate.toLocaleDateString(currentLang==='th' ? 'th-TH' : undefined,{month:'short', day:'numeric'});
  } else {
    document.getElementById('stat-bestpct-date').textContent = '';
  }
  
  if(records.bestXP.date){
    const bestXPDate = parseDate(records.bestXP.date);
    document.getElementById('stat-bestxp-date').textContent = bestXPDate.toLocaleDateString(currentLang==='th' ? 'th-TH' : undefined,{month:'short', day:'numeric'});
  } else {
    document.getElementById('stat-bestxp-date').textContent = '';
  }
  
  updateAccentColor(s.pct);

  const list = document.getElementById('today-list');
  list.innerHTML = '';
  const applicable = tasksForDate(ds);
  if(applicable.length===0){
    list.innerHTML = `<div class="empty-note">${i18nText('today.empty')}</div>`;
    renderSidebarXP();
    return;
  }
  
  // Group tasks by category
  const grouped = {};
  const uncategorized = [];
  applicable.forEach(t=>{
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
      renderToday();
    };
    list.appendChild(header);
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'category-tasks' + (isCollapsed ? ' collapsed' : '');
    
    grouped[catId].forEach(t=>{
      const done = isCompleted(ds, t.id);
      const row = document.createElement('div');
      row.className = 'task-row'+(done?' done':'');
      row.dataset.tid = t.id;
      row.innerHTML = `
        <span class="drag-handle">⠿</span>
        <button class="chk ${done?'checked':''}" data-tid="${t.id}" tabindex="0" aria-label="${done ? 'Mark as incomplete' : 'Mark as complete'}">${done?'✓':''}</button>
        <span class="task-color-dot" style="background:${t.color}"></span>
        <span class="task-name ${done?'strike':''}">${escapeHtml(t.name)}</span>
        <span class="task-xp">+${t.xp} XP</span>
        <div class="task-actions">
          <button class="icon-btn" data-edit="${t.id}" tabindex="0" aria-label="Edit task">✎</button>
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
      renderToday();
    };
    list.appendChild(header);
    
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'category-tasks' + (isCollapsed ? ' collapsed' : '');
    
    uncategorized.forEach(t=>{
      const done = isCompleted(ds, t.id);
      const row = document.createElement('div');
      row.className = 'task-row'+(done?' done':'');
      row.dataset.tid = t.id;
      row.innerHTML = `
        <span class="drag-handle">⠿</span>
        <button class="chk ${done?'checked':''}" data-tid="${t.id}" tabindex="0" aria-label="${done ? 'Mark as incomplete' : 'Mark as complete'}">${done?'✓':''}</button>
        <span class="task-color-dot" style="background:${t.color}"></span>
        <span class="task-name ${done?'strike':''}">${escapeHtml(t.name)}</span>
        <span class="task-xp">+${t.xp} XP</span>
        <div class="task-actions">
          <button class="icon-btn" data-edit="${t.id}" tabindex="0" aria-label="Edit task">✎</button>
          <button class="icon-btn" data-del="${t.id}" tabindex="0" aria-label="Delete task">🗑</button>
        </div>`;
      tasksContainer.appendChild(row);
    });
    
    list.appendChild(tasksContainer);
  }
  
  list.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=>openDeleteScopeModal(b.dataset.del, ds)));
  list.querySelectorAll('.chk').forEach(chk=>{
    chk.addEventListener('click', (e)=>{
      const tid = chk.dataset.tid;
      const t = state.tasks.find(x=>x.id===tid);
      const wasDone = isCompleted(ds, tid);
      setCompleted(ds, tid, !wasDone, t.xp);
      if(!wasDone) popXP(e.clientX, e.clientY, t.xp);
      renderToday();
    });
  });
  list.querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=>openTaskPanel(b.dataset.edit)));
  initTodaySortable();
  renderSidebarXP();
}

export let todaySortable = null;
export function initTodaySortable(){
  const list = document.getElementById('today-list');
  if(todaySortable){ todaySortable.destroy(); todaySortable = null; }
  if(typeof Sortable === 'undefined' || !list.children.length) return;
  
  // Initialize sortable for each category container
  const containers = list.querySelectorAll('.category-tasks');
  containers.forEach(container => {
    if(container.children.length > 0){
      Sortable.create(container, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'drag-ghost',
        onEnd: function(){
          const now = new Date().toISOString();
          // Re-calculate orders for all tasks
          let order = 0;
          containers.forEach(c => {
            Array.from(c.children).forEach(row => {
              const t = state.tasks.find(x=>x.id===row.dataset.tid);
              if(t && t.order !== order){ t.order = order; t.updatedAt = now; }
              order++;
            });
          });
          saveState();
        }
      });
    }
  });
}

export function popXP(x,y,amount){
  const el = document.createElement('div');
  el.className = 'xp-pop';
  el.textContent = '+'+amount+' XP';
  el.style.left = (x-20)+'px'; el.style.top = (y-10)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 850);
}

