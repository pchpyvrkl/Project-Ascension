import { LS_API, DEFAULT_API_URL, LS_SESSION } from './config.js';

// Clear old API URL if it exists (one-time migration)
if(localStorage.getItem(LS_API) && localStorage.getItem(LS_API) !== DEFAULT_API_URL){
  localStorage.removeItem(LS_API);
  console.log('Cleared old API URL from localStorage');
}

export function getApiUrl(){ return localStorage.getItem(LS_API) || DEFAULT_API_URL; }
export function getSession(){ try{ return JSON.parse(localStorage.getItem(LS_SESSION)||'null'); }catch(e){ return null; } }
/* setSession can't import sync.js (sync imports api), so main.js registers
   the sync-indicator refresh via setOnSessionChange. */
let onSessionChange = null;
export function setOnSessionChange(fn){ onSessionChange = fn; }

export function setSession(s){
  if(s) localStorage.setItem(LS_SESSION, JSON.stringify(s));
  else localStorage.removeItem(LS_SESSION);
  if(onSessionChange) onSessionChange();
}

export async function apiCall(action, payload, retryCount = 0){
  const url = getApiUrl();
  console.log('API Call:', action, 'URL:', url, 'Payload:', payload);
  if(!url) throw new Error('No backend URL configured yet');
  let res;
  try{
    // text/plain avoids a CORS preflight against Apps Script web apps
    res = await fetch(url, {
      method:'POST',
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(Object.assign({action}, payload))
    });
    console.log('Response status:', res.status);
  }catch(networkErr){
    console.error('Network error:', networkErr);
    if(location.protocol === 'file:'){
      throw new Error('Could not reach the backend. This page is open as a local file (file://) — most browsers, especially Safari, block requests to remote servers from local files. Host this file on a real web server (even a simple one) and open it via http:// or https:// instead.');
    }
    throw new Error('Could not reach the backend — check your internet connection, and make sure no ad-blocker or privacy extension is blocking script.google.com.');
  }
  const raw = await res.text();
  console.log('Response raw (first 200 chars):', raw.substring(0, 200));
  let data;
  try{
    data = JSON.parse(raw);
  }catch(e){
    console.error('JSON parse error:', e, 'Raw response:', raw);
    // Apps Script sometimes returns HTML transiently even with correct deployment
    // Retry once to handle temporary glitches
    if(retryCount < 1){
      console.warn('Backend returned non-JSON response, retrying...', raw.substring(0, 200));
      await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
      return apiCall(action, payload, retryCount + 1);
    }
    // If still failing after retry, it's likely a deployment configuration issue
    const isHtml = raw.trim().toLowerCase().startsWith('<');
    if(isHtml){
      throw new Error('Backend returned an HTML page instead of JSON. This usually means the Apps Script deployment needs to be updated: Deploy → Manage deployments → edit → "Who has access" must be "Anyone", then redeploy as a new version and ensure the URL ends in /exec.');
    }
    throw new Error('Backend returned invalid data: ' + raw.substring(0, 100));
  }
  if(!data.ok) throw new Error(data.error || 'Request failed');
  console.log('API success:', data);
  return data;
}

