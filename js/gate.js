import { apiCall, getSession, setSession } from './api.js';
import { fetchStateSilently, pushStateToBackend, startPolling, stopPolling, updateSyncIndicator } from './sync.js';
import { setState, writeState } from './store.js';
import { seedTasks } from './domain.js';
import { todayStr } from './utils.js';
import { i18nText } from './i18n.js';
import { closeAllPanels, showPanel } from './panels.js';
import { buildColorSwatches } from './taskpanel.js';
import { renderToday } from './today.js';
import { STORE_KEY } from './config.js';

export let gateMode = 'login';

export function setGateMode(mode){
  gateMode = mode;
  document.getElementById('gate-tab-login').classList.toggle('active', mode==='login');
  document.getElementById('gate-tab-register').classList.toggle('active', mode==='register');
  document.getElementById('gate-submit-btn').textContent = mode==='login' ? i18nText('gate.login') : i18nText('gate.createbtn');
  document.getElementById('gate-submit-btn').onclick = mode==='login' ? gateLogin : gateRegister;
  document.getElementById('gate-auth-status').textContent = '';
}
export async function gateLogin(){
  const status = document.getElementById('gate-auth-status');
  const username = document.getElementById('gate-username').value.trim();
  const password = document.getElementById('gate-password').value;
  if(!username || !password){ status.textContent = i18nText('gate.enterboth'); return; }
  status.innerHTML = '<span class="loading-spinner"></span>' + i18nText('gate.signing');
  try{
    const data = await apiCall('login', {username, password});
    setSession({ token:data.token, userId:data.userId, username });
    await fetchStateSilently();
    unlockApp();
  }catch(e){ status.textContent = 'Error: '+e.message; }
}
export async function gateRegister(){
  const status = document.getElementById('gate-auth-status');
  const username = document.getElementById('gate-username').value.trim();
  const password = document.getElementById('gate-password').value;
  if(!username || !password){ status.textContent = i18nText('gate.enterboth'); return; }
  status.innerHTML = '<span class="loading-spinner"></span>' + i18nText('gate.creating');
  try{
    const data = await apiCall('register', {username, password});
    setSession({ token:data.token, userId:data.userId, username });
    setState({ tasks: seedTasks(), logs:{}, notes:{}, createdAt: todayStr() });
    writeState();
    await pushStateToBackend();
    unlockApp();
  }catch(e){ status.textContent = 'Error: '+e.message; }
}
export let sessionRefreshTimer = null;
export let sessionRefreshTriggered = false;
export let gateRefreshTimer = null;
export let gateRefreshTriggered = false;
export function clearSessionRefreshTimer(){ if(sessionRefreshTimer){ clearTimeout(sessionRefreshTimer); sessionRefreshTimer = null; } }
export function clearGateRefreshTimer(){ if(gateRefreshTimer){ clearInterval(gateRefreshTimer); gateRefreshTimer = null; } }
export function scheduleSessionRefreshCheck(){
  clearSessionRefreshTimer();
  const s = getSession();
  if(!s){ sessionRefreshTriggered = false; return; }
  sessionRefreshTriggered = false;
  sessionRefreshTimer = setTimeout(async ()=>{
    const activeSession = getSession();
    if(!activeSession) return;
    try{
      await apiCall('getState', {token:activeSession.token});
    }catch(err){
      if(!sessionRefreshTriggered){
        sessionRefreshTriggered = true;
        setSession(null);
        lockApp();
        setTimeout(()=>window.location.reload(), 400);
      }
    }
  }, 300000);
}
export function startGateRefreshLoop(){
  clearGateRefreshTimer();
  if(document.getElementById('gate').classList.contains('hidden')) return;
  gateRefreshTriggered = false;
  gateRefreshTimer = setInterval(() => {
    if(document.getElementById('gate').classList.contains('hidden')){
      clearGateRefreshTimer();
      return;
    }
    if(!gateRefreshTriggered){
      gateRefreshTriggered = true;
      window.location.reload();
    }
  }, 60000);
}
export function handleGateFocus(){
  if(document.getElementById('gate').classList.contains('hidden')) return;
  if(!gateRefreshTriggered){
    gateRefreshTriggered = true;
    window.location.reload();
  }
}
export function lockApp(){
  clearSessionRefreshTimer();
  setSession(null);
  stopPolling();
  localStorage.removeItem(STORE_KEY);
  setState({ tasks:[], logs:{}, notes:{}, createdAt: todayStr() });
  closeAllPanels();
  document.getElementById('app').classList.remove('unlocked');
  document.getElementById('gate').classList.remove('hidden');
  document.getElementById('gate-username').value = '';
  document.getElementById('gate-password').value = '';
  setGateMode('login');
  focusGateInputs();
  startGateRefreshLoop();
}
export function focusGateInputs(){
  const username = document.getElementById('gate-username');
  const password = document.getElementById('gate-password');
  if(username && document.getElementById('gate').classList.contains('hidden')) return;
  setTimeout(() => {
    if(username){ username.focus({ preventScroll: true }); }
    if(password && document.activeElement !== username){ password.blur(); }
  }, 120);
}
export function unlockApp(){
  clearGateRefreshTimer();
  gateRefreshTriggered = false;
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('app').classList.add('unlocked');
  buildColorSwatches();
  renderToday();
  updateSyncIndicator('synced');
  startPolling();
  scheduleSessionRefreshCheck();
  
  // Initialize task panel color swatches
  setTimeout(() => {
    buildColorSwatches();
  }, 100);
}
export function attachGateRefreshListeners(){
  window.addEventListener('focus', ()=>{
    if(document.getElementById('gate') && !document.getElementById('gate').classList.contains('hidden')){
      handleGateFocus();
    }
  });
}
export function doLogout(){
  const s = getSession();
  if(s){ apiCall('logout', {token:s.token}).catch(()=>{}); }
  lockApp();
}

/* Auto-login on password autofill (moved here from an inline <script> so all
   gate behavior lives in one module). */
export function initGateAutofill(){
  const passwordInput = document.getElementById('gate-password');
  const usernameInput = document.getElementById('gate-username');
  if(!passwordInput || !usernameInput) return;
  let passwordTyping = false;

  passwordInput.addEventListener('keydown', function() {
    passwordTyping = true;
  });

  passwordInput.addEventListener('change', function() {
    if (this.value && usernameInput.value && !passwordTyping) {
      setTimeout(() => gateLogin(), 100);
    }
    passwordTyping = false;
  });

  passwordInput.addEventListener('input', function() {
    if (this.value && usernameInput.value && !passwordTyping) {
      if (this.value.length > 3) {
        setTimeout(() => gateLogin(), 300);
      }
    }
    setTimeout(() => passwordTyping = false, 500);
  });
}

/* ---------- Account panel (post-login: log out / delete account) ---------- */
export function openSettingsPanel(){
  const s = getSession();
  document.getElementById('account-sub').textContent = s ? i18nText('account.signedinas', {u:s.username}) : i18nText('account.notsignedin');
  document.getElementById('account-status').textContent = '';
  showPanel('panel-settings');
}

/* ---------- Delete account (requires re-entering username + password) ---------- */
export function openDeleteAccountConfirm(){
  document.getElementById('da-username').value = '';
  document.getElementById('da-password').value = '';
  document.getElementById('da-status').textContent = '';
  document.getElementById('overlay').classList.add('show');
  document.getElementById('modal-delete-account').classList.add('show');
  setTimeout(()=>{
    const firstInput = document.getElementById('da-username');
    if(firstInput){ firstInput.focus(); }
  }, 60);
}
export function closeDeleteAccountConfirm(){
  document.getElementById('modal-delete-account').classList.remove('show');
  if(!document.querySelector('.panel.show')) document.getElementById('overlay').classList.remove('show');
}
export async function confirmDeleteAccount(){
  const status = document.getElementById('da-status');
  const username = document.getElementById('da-username').value.trim();
  const password = document.getElementById('da-password').value;
  const s = getSession();
  if(!s){ status.textContent = 'You need to be signed in.'; return; }
  if(!username || !password){ status.textContent = 'Enter your username and password to confirm.'; return; }
  if(username.toLowerCase() !== s.username.toLowerCase()){ status.textContent = 'That username doesn\'t match the signed-in account.'; return; }
  status.style.color = 'var(--text-dim)';
  status.textContent = 'Deleting…';
  try{
    // Re-verify the password server-side before allowing deletion, then
    // permanently remove the account and all of its data.
    await apiCall('login', {username, password});
    await apiCall('deleteAccount', {token:s.token});
    closeDeleteAccountConfirm();
    lockApp();
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = 'Error: '+e.message;
  }
}
