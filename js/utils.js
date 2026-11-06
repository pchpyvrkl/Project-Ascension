/* Shared pure utilities: ids, dates, escaping, note normalization. */

export function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
export function todayStr(){ return fmtDate(new Date()); }
export function fmtDate(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
export function parseDate(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
export function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Legacy notes were stored as a plain string; new ones carry updatedAt so two
// devices editing the same day's notes can be merged deterministically.
export function normalizeNote(n){
  if(!n) return { text:'', updatedAt:'1970-01-01T00:00:00.000Z' };
  if(typeof n === 'string') return { text:n, updatedAt:'1970-01-01T00:00:00.000Z' };
  return n;
}
