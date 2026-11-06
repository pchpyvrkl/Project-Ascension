import { STORE_KEY } from './config.js';
import { todayStr } from './utils.js';

export function normalizeStateShape(input){
  const base = input && typeof input === 'object' ? input : {};
  return {
    tasks: Array.isArray(base.tasks) ? base.tasks : [],
    logs: base.logs || {},
    notes: base.notes || {},
    categories: Array.isArray(base.categories) ? base.categories : [],
    collapsedCategories: base.collapsedCategories || {},
    createdAt: base.createdAt || todayStr(),
    ...base,
    tasks: Array.isArray(base.tasks) ? base.tasks : [],
    logs: base.logs || {},
    notes: base.notes || {},
    categories: Array.isArray(base.categories) ? base.categories : [],
    collapsedCategories: base.collapsedCategories || {},
    createdAt: base.createdAt || todayStr(),
  };
}

/* ---------- State ---------- */
export let state = loadState();

/* Replace the whole state object (e.g. after a backend fetch or merge).
   Always goes through normalizeStateShape so the shape stays valid. */
export function setState(s){ state = normalizeStateShape(s); }

/* Persist current state to localStorage without normalization/sync hook. */
export function writeState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

export function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) {
      const loaded = JSON.parse(raw);
      console.log('Loaded state from localStorage:', loaded);
      return normalizeStateShape(loaded);
    }
  }catch(e){
    console.error('Error loading state:', e);
  }
  console.log('Returning default state');
  return normalizeStateShape({ tasks: [], logs: {}, notes: {}, createdAt: todayStr() });
}

/* saveState can't import sync.js (sync imports store), so main.js registers
   the debounced backend push via setOnPersist. */
let onPersist = null;
export function setOnPersist(fn){ onPersist = fn; }

export function saveState(){
  state = normalizeStateShape(state);
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  if(onPersist) onPersist();
}
