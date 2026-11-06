/* Application entry point: wiring, navigation, PWA install, keyboard
   accessibility, boot sequence, and the window globals that the inline
   onclick/onchange handlers in index.html rely on. */

import { applyLanguage, setLanguage, i18nText, currentLang, setAfterApply } from './i18n.js';
import { setOnPersist } from './store.js';
import { getSession, setSession, setOnSessionChange } from './api.js';
import { scheduleSync, updateSyncIndicator, fetchStateSilently } from './sync.js';
import {
  gateMode, setGateMode, gateLogin, gateRegister, unlockApp, doLogout,
  focusGateInputs, startGateRefreshLoop, attachGateRefreshListeners,
  openSettingsPanel, openDeleteAccountConfirm, closeDeleteAccountConfirm,
  confirmDeleteAccount, initGateAutofill
} from './gate.js';
import { renderToday } from './today.js';
import { renderCalendar, calShift, calToday, openDayPanel, saveDayNotes } from './calendar.js';
import { renderAnalytics, setAnalyticsPeriod, setHeatmapTimeframe, toggleYearDropdown, selectYear } from './analytics.js';
import {
  openTaskPanel, openTaskPanelForDay, onRepeatChange, saveTask, deleteCurrentTask,
  openCategoryPanel, saveCategory, deleteCurrentCategory,
  openDeleteScopeModal, closeDeleteScopeModal, deleteOccurrence
} from './taskpanel.js';
import { closeAllPanels, openAboutPanel, openHelpPanel } from './panels.js';

/* ---------- Dependency wiring ----------
   store.js, api.js and i18n.js can't import the UI/sync modules without
   creating cycles, so they expose registration hooks that we satisfy here. */
setOnPersist(scheduleSync);
setOnSessionChange(updateSyncIndicator);
setAfterApply(() => {
  setGateMode(gateMode);
  if(document.getElementById('view-today').classList.contains('active')) renderToday();
  if(document.getElementById('view-calendar').classList.contains('active')) renderCalendar();
  if(document.getElementById('view-analytics').classList.contains('active')) renderAnalytics();
  updateSyncIndicator();
  const s = getSession();
  if(document.getElementById('panel-settings').classList.contains('show') && s){
    document.getElementById('account-sub').textContent = i18nText('account.signedinas', {u:s.username});
  }
});

/* ---------- Window globals for inline handlers ---------- */
Object.assign(window, {
  setLanguage, setGateMode, gateLogin, gateRegister,
  openAboutPanel, openHelpPanel, openSettingsPanel,
  calShift, calToday, openDayPanel, saveDayNotes,
  setAnalyticsPeriod, setHeatmapTimeframe, toggleYearDropdown, selectYear,
  openTaskPanel, openTaskPanelForDay, onRepeatChange, saveTask, deleteCurrentTask,
  openCategoryPanel, saveCategory, deleteCurrentCategory,
  openDeleteScopeModal, closeDeleteScopeModal, deleteOccurrence,
  doLogout, openDeleteAccountConfirm, closeDeleteAccountConfirm, confirmDeleteAccount,
  closeAllPanels, toggleSidebar, closeSidebar, switchView
});

function switchView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.navitem').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  closeSidebar();
  if(name==='calendar') renderCalendar();
  if(name==='analytics') renderAnalytics();
  if(name==='today') renderToday();
}
document.querySelectorAll('.navitem').forEach(btn=> {
  btn.addEventListener('click', () => {
    if (!btn.dataset.view || btn.id === 'install-btn') return;
    switchView(btn.dataset.view);
  });
  
  // Add keyboard support for navigation
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!btn.dataset.view || btn.id === 'install-btn') return;
      switchView(btn.dataset.view);
    }
  });
});

// PWA Install Handler
let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');

function showInstallFallback(){
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  // Already installed as app
  if (isStandalone) {
    return;
  }

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const fallbackMessage = isIOS
    ? 'To install this app on iPhone:\n\n1. Tap the Share button (arrow up from bottom)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nThe app will then appear on your home screen.'
    : 'To install this app:\n\n1. Tap the browser menu (three dots)\n2. Select "Install app" or "Add to Home Screen"\n3. Confirm the installation';
  
  alert(fallbackMessage);
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

if (installBtn) {
  installBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;

        if (outcome === 'accepted') {
          if (installBtn) installBtn.style.display = 'none';
        }
      } catch (err) {
        console.error(err);
        showInstallFallback();
      }
      return;
    }

    showInstallFallback();
  });
}

// Keep install button hidden until the user explicitly taps it.
if (installBtn) {
  installBtn.style.display = 'none';
}

window.addEventListener('appinstalled', () => {
  if (installBtn) installBtn.style.display = 'none';
});

function toggleSidebar(){
  const open = document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-backdrop').classList.toggle('show', open);
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('show');
}

/* ---------- Boot: gate first, always ---------- */
(async function boot(){
  document.querySelectorAll('.lang-btn').forEach(b=> b.classList.toggle('active', b.id.endsWith('-'+currentLang)));
  applyLanguage();
  setGateMode('login');
  initGateAutofill();
  focusGateInputs();
  startGateRefreshLoop();
  attachGateRefreshListeners();
  const s = getSession();
  if(!s) return;
  
  // Auto-login: hide login form, show loading message only
  document.getElementById('gate-step-auth').style.display = 'none';
  document.getElementById('gate-auth-status').innerHTML = '<span class="loading-spinner"></span>' + i18nText('gate.checking');
  document.getElementById('gate-auth-status').style.display = 'block';
  
  try{
    await fetchStateSilently();
    unlockApp();
  }catch(e){
    // stale/invalid token — fall back to a clean login prompt, never to local data
    setSession(null);
    document.getElementById('gate-step-auth').style.display = 'flex';
    document.getElementById('gate-auth-status').textContent = i18nText('gate.expired');
    document.getElementById('gate-username').value = '';
    document.getElementById('gate-password').value = '';
    document.getElementById('gate-auth-status').style.display = 'block';
  }
})();

// Force keyboard to show in iOS PWA
document.addEventListener('touchstart', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    e.target.focus();
  }
}, { passive: true });

// Keyboard accessibility
document.addEventListener('keydown', function(e) {
  // Enter key for login buttons
  if (e.key === 'Enter') {
    if (e.target.id === 'gate-username') {
      e.preventDefault();
      document.getElementById('gate-password').focus();
    } else if (e.target.id === 'gate-password') {
      e.preventDefault();
      document.getElementById('gate-submit-btn').click();
    } else if (e.target.classList.contains('btn-primary') || e.target.classList.contains('btn')) {
      e.preventDefault();
      e.target.click();
    }
  }
  
  // Spacebar for checkboxes
  if (e.key === ' ' || e.key === 'Space') {
    if (e.target.classList.contains('chk')) {
      e.preventDefault();
      e.target.click();
    }
  }
  
  // Arrow keys for task navigation
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const taskRows = document.querySelectorAll('.task-row');
    if (taskRows.length === 0) return;
    
    const currentIndex = Array.from(taskRows).findIndex(row => row.contains(document.activeElement));
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < taskRows.length - 1 ? currentIndex + 1 : 0;
      const nextRow = taskRows[nextIndex];
      const nextCheckbox = nextRow.querySelector('.chk');
      if (nextCheckbox) nextCheckbox.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : taskRows.length - 1;
      const prevRow = taskRows[prevIndex];
      const prevCheckbox = prevRow.querySelector('.chk');
      if (prevCheckbox) prevCheckbox.focus();
    }
  }
  
  // Escape to close panels
  if (e.key === 'Escape') {
    closeAllPanels();
  }
  
  // Tab navigation for task lists
  if (e.key === 'Tab' && e.target.classList.contains('chk')) {
    const taskRows = document.querySelectorAll('.task-row');
    const currentIndex = Array.from(taskRows).findIndex(row => row.contains(document.activeElement));
    
    if (e.shiftKey && currentIndex > 0) {
      e.preventDefault();
      const prevRow = taskRows[currentIndex - 1];
      const prevCheckbox = prevRow.querySelector('.chk');
      if (prevCheckbox) prevCheckbox.focus();
    } else if (!e.shiftKey && currentIndex < taskRows.length - 1) {
      e.preventDefault();
      const nextRow = taskRows[currentIndex + 1];
      const nextCheckbox = nextRow.querySelector('.chk');
      if (nextCheckbox) nextCheckbox.focus();
    }
  }
});
