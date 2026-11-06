import { ui } from './ui-state.js';

/* ---------- Panels ---------- */
export function showPanel(id){
  document.getElementById('overlay').classList.add('show');
  document.getElementById(id).classList.add('show');
}
export function closeAllPanels(){
  document.getElementById('overlay').classList.remove('show');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('show'));
  document.getElementById('modal-delete-scope').classList.remove('show');
  ui.activeTaskId = null;
  // Don't clear activeDayStr as it might be needed when opening task panel from day panel
}

export function openAboutPanel(){
  showPanel('panel-about');
}

export function openHelpPanel(){
  showPanel('panel-help');
}
