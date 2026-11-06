import { ui } from './ui-state.js';
import { state, saveState } from './store.js';
import { uid, todayStr, fmtDate, parseDate, escapeHtml } from './utils.js';
import { i18nText, WEEKDAY_LABELS } from './i18n.js';
import { COLORS } from './config.js';
import { showPanel, closeAllPanels } from './panels.js';
import { renderToday } from './today.js';
import { renderCalendar, openDayPanel } from './calendar.js';

export function openTaskPanelForDay(){
  console.log('openTaskPanelForDay called, ui.activeDayStr:', ui.activeDayStr);
  closeAllPanels();
  ui.activeTaskId = null;
  document.getElementById('task-panel-title').textContent = i18nText('taskform.newtitle');
  document.getElementById('tf-delete').style.display = 'none';
  document.getElementById('tf-name').value = '';
  document.getElementById('tf-xp').value = 0;
  document.getElementById('tf-repeat').value = 'daily'; // Default to 'daily' for day-specific tasks
  document.getElementById('tf-everyx').value = 2;
  document.getElementById('tf-startdate').value = ui.activeDayStr || '';
  document.getElementById('tf-enddate').value = ''; // Leave endDate empty for repeating tasks
  
  // Populate category dropdown
  const catSelect = document.getElementById('tf-category');
  catSelect.innerHTML = '<option value="">No Category</option>' + 
    (state.categories ? state.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('') : '');
  catSelect.value = '';
  
  onRepeatChange();
  
  // Build color swatches after onRepeatChange to ensure they exist
  setTimeout(() => {
    buildColorSwatches();
    document.querySelectorAll('#tf-colors .swatch').forEach(s=> s.classList.toggle('sel', s.dataset.color===COLORS[0]));
    document.querySelectorAll('#tf-weekdays .swatch').forEach(s=>{
      s.classList.remove('sel');
      s.style.color = 'var(--text-dim)';
      s.style.background = 'var(--bg-elev-2)';
    });
    showPanel('panel-task');
  }, 50);
}

/* ---------- Task panel ---------- */
export function buildColorSwatches(){
  const wrap = document.getElementById('tf-colors');
  wrap.innerHTML = COLORS.map(c=>`<span class="swatch" data-color="${c}" style="background:${c}"></span>`).join('');
  wrap.querySelectorAll('.swatch').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      wrap.querySelectorAll('.swatch').forEach(s=>s.classList.remove('sel'));
      sw.classList.add('sel');
    });
  });
  const wdWrap = document.getElementById('tf-weekdays');
  wdWrap.innerHTML = WEEKDAY_LABELS.map((d,i)=>`<span class="swatch" data-day="${i}" style="border-radius:6px; width:auto; padding:4px 7px; background:var(--bg-elev-2); font-size:11px; color:var(--text-dim);">${d}</span>`).join('');
  wdWrap.querySelectorAll('.swatch').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      sw.classList.toggle('sel');
      sw.style.color = sw.classList.contains('sel') ? '#04211b' : 'var(--text-dim)';
      sw.style.background = sw.classList.contains('sel') ? 'var(--accent)' : 'var(--bg-elev-2)';
    });
  });
}
export function onRepeatChange(){
  const r = document.getElementById('tf-repeat').value;
  document.getElementById('tf-weekly-wrap').style.display = r==='weekly' ? 'block':'none';
  document.getElementById('tf-everyx-wrap').style.display = r==='everyx' ? 'block':'none';
  document.getElementById('tf-dates-wrap').style.display = r==='once' ? 'block':'none';

  // If 'once' is selected and we have an active day, pre-fill the dates
  if(r === 'once' && ui.activeDayStr){
    document.getElementById('tf-startdate').value = ui.activeDayStr;
    document.getElementById('tf-enddate').value = ui.activeDayStr;
  }
  // If switching to a repeating task (not 'once'), always clear endDate
  // so the task continues indefinitely
  else if(r !== 'once'){
    document.getElementById('tf-enddate').value = '';
  }
}
export function openTaskPanel(taskId){
  ui.activeTaskId = taskId || null;
  document.getElementById('task-panel-title').textContent = taskId ? i18nText('taskform.edittitle') : i18nText('taskform.newtitle');
  document.getElementById('tf-delete').style.display = taskId ? 'block' : 'none';
  const t = taskId ? state.tasks.find(x=>x.id===taskId) : null;
  document.getElementById('tf-name').value = t ? t.name : '';
  document.getElementById('tf-xp').value = t ? t.xp : 0;
  document.getElementById('tf-repeat').value = t ? t.repeat : 'daily'; // Default to 'daily' for new tasks
  document.getElementById('tf-everyx').value = t && t.everyx ? t.everyx : 2;
  document.getElementById('tf-startdate').value = t && t.startDate ? t.startDate : '';
  document.getElementById('tf-enddate').value = t && t.endDate ? t.endDate : '';
  
  // Populate category dropdown
  const catSelect = document.getElementById('tf-category');
  catSelect.innerHTML = '<option value="">No Category</option>' + 
    (state.categories ? state.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('') : '');
  catSelect.value = t && t.categoryId ? t.categoryId : '';
  
  onRepeatChange();
  
  // For new tasks (not editing), default to today's date if no dates are set
  // Only set startDate, not endDate - endDate should be empty for repeating tasks
  if(!taskId && !document.getElementById('tf-startdate').value){
    const today = todayStr();
    document.getElementById('tf-startdate').value = today;
  }
  
  buildColorSwatches(); // Make sure color swatches are built
  document.querySelectorAll('#tf-colors .swatch').forEach(s=> s.classList.toggle('sel', t ? s.dataset.color===t.color : s.dataset.color===COLORS[0]));
  document.querySelectorAll('#tf-weekdays .swatch').forEach(s=>{
    const sel = t && t.weekdays && t.weekdays.includes(Number(s.dataset.day));
    s.classList.toggle('sel', !!sel);
    s.style.color = sel ? '#04211b' : 'var(--text-dim)';
    s.style.background = sel ? 'var(--accent)' : 'var(--bg-elev-2)';
  });
  showPanel('panel-task');
}
export function saveTask(){
  const name = document.getElementById('tf-name').value.trim();
  if(!name){ document.getElementById('tf-name').focus(); return; }
  const color = (document.querySelector('#tf-colors .swatch.sel')||{}).dataset?.color || COLORS[0];
  const weekdays = Array.from(document.querySelectorAll('#tf-weekdays .swatch.sel')).map(s=>Number(s.dataset.day));
  const repeat = document.getElementById('tf-repeat').value;
  const categoryId = document.getElementById('tf-category').value || null;
  const data = {
    name,
    xp: Number(document.getElementById('tf-xp').value)||0,
    color, repeat: repeat,
    weekdays, everyx: Number(document.getElementById('tf-everyx').value)||2,
    categoryId,
    updatedAt: new Date().toISOString(),
  };

  // Handle date range for all tasks
  const startDate = document.getElementById('tf-startdate').value;
  const endDate = document.getElementById('tf-enddate').value;
  if(startDate) data.startDate = startDate;
  // Only set endDate if it's explicitly set AND it's a one-time task
  // For all repeating tasks, ensure endDate is never set
  if(repeat === 'once' && endDate){
    data.endDate = endDate;
  } else if(repeat !== 'once'){
    // Clear endDate for all repeating tasks
    data.endDate = undefined;
  } else if(endDate){
    data.endDate = endDate;
  }

  // If no startDate specified, use today
  if(!data.startDate){
    data.startDate = todayStr();
  }

  console.log('saveTask - data to save:', data);
  console.log('saveTask - startDate:', startDate, 'endDate:', endDate, 'repeat:', repeat);

  if(ui.activeTaskId){
    Object.assign(state.tasks.find(t=>t.id===ui.activeTaskId), data);
  } else {
    const maxOrder = state.tasks.reduce((m,t)=>Math.max(m, t.order||0), -1);
    const newTask = { id: uid(), active:true, deleted:false, order: maxOrder+1, createdAt: todayStr(), ...data };
    console.log('saveTask - new task created:', newTask);
    state.tasks.push(newTask);
  }
  saveState();
  closeAllPanels();
  renderToday(); renderCalendar();
  if(ui.activeDayStr) openDayPanel(ui.activeDayStr);
}
export function deleteCurrentTask(){
  if(!ui.activeTaskId) return;
  const t = state.tasks.find(x=>x.id===ui.activeTaskId);
  if(t){ t.deleted = true; t.updatedAt = new Date().toISOString(); }
  saveState();
  closeAllPanels();
  renderToday(); renderCalendar();
}

/* ---------- Category management ---------- */
export let activeCategoryId = null;
export function openCategoryPanel(categoryId){
  activeCategoryId = categoryId || null;
  document.getElementById('category-panel-title').textContent = categoryId ? 'Edit Category' : 'New Category';
  document.getElementById('cat-delete').style.display = categoryId ? 'block' : 'none';
  const cat = categoryId ? state.categories.find(x=>x.id===categoryId) : null;
  document.getElementById('cat-name').value = cat ? cat.name : '';
  buildCategoryColorSwatches();
  document.querySelectorAll('#cat-colors .swatch').forEach(s=> s.classList.toggle('sel', cat ? s.dataset.color===cat.color : s.dataset.color===COLORS[0]));
  renderCategoryList();
  showPanel('panel-category');
}
export function buildCategoryColorSwatches(){
  const wrap = document.getElementById('cat-colors');
  wrap.innerHTML = COLORS.map(c=>`<span class="swatch" data-color="${c}" style="background:${c}"></span>`).join('');
  wrap.querySelectorAll('.swatch').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      wrap.querySelectorAll('.swatch').forEach(s=>s.classList.remove('sel'));
      sw.classList.add('sel');
    });
  });
}
export function saveCategory(){
  console.log('saveCategory called');
  const name = document.getElementById('cat-name').value.trim();
  console.log('Category name:', name);
  if(!name){ document.getElementById('cat-name').focus(); return; }
  const color = (document.querySelector('#cat-colors .swatch.sel')||{}).dataset?.color || COLORS[0];
  console.log('Category color:', color);
  const data = {
    name,
    color,
    updatedAt: new Date().toISOString(),
  };
  if(!state.categories) state.categories = [];
  console.log('Categories before save:', state.categories);
  if(activeCategoryId){
    Object.assign(state.categories.find(c=>c.id===activeCategoryId), data);
  } else {
    state.categories.push({ id: uid(), ...data });
  }
  console.log('Categories after save:', state.categories);
  saveState();
  console.log('State saved to localStorage');
  closeAllPanels();
  renderToday(); renderCalendar();
}
export function deleteCurrentCategory(){
  if(!activeCategoryId) return;
  if(!state.categories) state.categories = [];
  state.categories = state.categories.filter(c=>c.id!==activeCategoryId);
  // Remove category reference from tasks
  state.tasks.forEach(t=> {
    if(t.categoryId === activeCategoryId) delete t.categoryId;
  });
  saveState();
  closeAllPanels();
  renderToday(); renderCalendar();
}
export function renderCategoryList(){
  const list = document.getElementById('category-list');
  if(!state.categories || !state.categories.length){
    list.innerHTML = '<div style="font-size:12px; color:var(--text-faint);">No categories yet</div>';
    return;
  }
  list.innerHTML = state.categories.map(cat=>`
    <div class="category-item" style="display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid var(--border);">
      <button type="button" style="display:flex; align-items:center; gap:8px; flex:1; background:none; border:none; padding:0; text-align:left; color:inherit; cursor:pointer;" onclick="openCategoryPanel('${cat.id}')">
        <span class="category-dot" style="width:12px; height:12px; border-radius:50%; background:${cat.color}; flex-shrink:0;"></span>
        <span style="flex:1; font-size:13px;">${escapeHtml(cat.name)}</span>
      </button>
      <button type="button" class="icon-btn" onclick="event.stopPropagation(); openCategoryPanel('${cat.id}')" title="Edit category">✏️</button>
    </div>
  `).join('');
}

/* ---------- Apple-Calendar-style occurrence delete ---------- */
export let dsmTaskId=null, dsmDateStr=null;
export function openDeleteScopeModal(taskId, dateStr){
  const t = state.tasks.find(x=>x.id===taskId);
  if(!t) return;
  if(t.repeat==='once'){ deleteOccurrence(taskId, dateStr, 'all'); return; }
  dsmTaskId = taskId; dsmDateStr = dateStr;
  document.getElementById('dsm-title').textContent = `Delete "${t.name}"`;
  document.getElementById('overlay').classList.add('show');
  document.getElementById('modal-delete-scope').classList.add('show');
}
export function closeDeleteScopeModal(){
  document.getElementById('modal-delete-scope').classList.remove('show');
  if(!document.querySelector('.panel.show')) document.getElementById('overlay').classList.remove('show');
  dsmTaskId = null; dsmDateStr = null;
}
export function deleteOccurrence(taskId, dateStr, scope){
  const t = state.tasks.find(x=>x.id===taskId);
  if(!t) return;
  if(scope==='all'){
    t.deleted = true;
  } else if(scope==='future'){
    const prevDay = parseDate(dateStr); prevDay.setDate(prevDay.getDate()-1);
    t.endDate = fmtDate(prevDay);
  } else { // 'only'
    t.exceptions = t.exceptions || [];
    if(!t.exceptions.includes(dateStr)) t.exceptions.push(dateStr);
  }
  t.updatedAt = new Date().toISOString();
  saveState();
  closeDeleteScopeModal();
  renderToday(); renderCalendar();
  if(ui.activeDayStr) openDayPanel(ui.activeDayStr);
}

