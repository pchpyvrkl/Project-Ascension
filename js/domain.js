import { state, saveState } from './store.js';
import { uid, todayStr, fmtDate, parseDate } from './utils.js';
import { COLORS } from './config.js';

export function seedTasks(){
  const now = new Date().toISOString();
  let ord = 0;
  const mk = (name,xp,color,repeat,extra={}) => ({
    id: uid(), name, xp, color, repeat, active:true, deleted:false, order: ord++, createdAt: todayStr(), updatedAt: now, ...extra
  });
  return [
    mk('Morning Workout',50,COLORS[0],'daily'),
    mk('Meditate',30,COLORS[1],'daily'),
    mk('Read 20 Pages',40,COLORS[3],'daily'),
    mk('Deep Work Block',80,COLORS[6],'weekdays'),
    mk('Weekly Review',60,COLORS[4],'weekly',{weekdays:[0]}),
  ];
}

/* ---------- Recurrence logic ---------- */
export function taskAppliesOn(task, dateStr){
  if(!task.active || task.deleted) return false;
  if(task.exceptions && task.exceptions.includes(dateStr)) return false;
  if(task.endDate && dateStr > task.endDate) return false;
  const d = parseDate(dateStr);
  const created = parseDate(task.createdAt);
  // Use the earlier of startDate or createdAt as effective start date
  // This ensures tasks appear on the day they were created even if startDate is set to a future date
  const startDateDate = task.startDate ? parseDate(task.startDate) : new Date(created.getFullYear(),created.getMonth(),created.getDate());
  const effectiveStart = created < startDateDate ? created : startDateDate;
  console.log('taskAppliesOn:', task.name, 'dateStr:', dateStr, 'effectiveStart:', fmtDate(effectiveStart), 'd:', fmtDate(d), 'd < effectiveStart:', d < effectiveStart);
  if(d < effectiveStart) return false;
  const dow = d.getDay();
  switch(task.repeat){
    case 'daily': return true;
    case 'weekdays': return dow>=1 && dow<=5;
    case 'weekends': return dow===0 || dow===6;
    case 'weekly': return (task.weekdays||[]).includes(dow);
    case 'everyx': {
      const n = task.everyx || 2;
      const diffDays = Math.round((d - effectiveStart)/86400000);
      return diffDays>=0 && diffDays % n === 0;
    }
    case 'monthly': return d.getDate() === effectiveStart.getDate();
    case 'once': {
      // For 'once' tasks, check if the date matches startDate (or createdAt if no startDate)
      const targetDate = task.startDate || task.createdAt;
      return targetDate === dateStr;
    }
    default: return false;
  }
}
export function tasksForDate(dateStr){ return state.tasks.filter(t=>taskAppliesOn(t,dateStr)).sort((a,b)=>(a.order||0)-(b.order||0)); }
// Log entries keep an explicit completed:true/false (never delete the key) so that
// "I unchecked this" is a fact with its own timestamp, not silence — silence is
// what would let a stale device resurrect it on the next merge.
export function isCompleted(dateStr, taskId){
  const e = state.logs[dateStr] && state.logs[dateStr][taskId];
  return !!(e && e.completed);
}
export function setCompleted(dateStr, taskId, val, xp){
  if(!state.logs[dateStr]) state.logs[dateStr] = {};
  state.logs[dateStr][taskId] = { completed: !!val, completedAt: new Date().toISOString(), xp: val ? xp : 0 };
  saveState();
}
export function dayStats(dateStr){
  const applicable = tasksForDate(dateStr);
  const log = state.logs[dateStr] || {};
  let xp = 0, done = 0;
  applicable.forEach(t=>{ const e = log[t.id]; if(e && e.completed){ xp += e.xp; done++; } });
  const pct = applicable.length ? Math.round(100*done/applicable.length) : 0;
  return { applicable, done, xp, pct, total: applicable.length };
}

/* ---------- XP ---------- */
export function lifetimeXP(){
  let total = 0;
  Object.values(state.logs).forEach(day=>{ Object.values(day).forEach(e=> total += e.xp); });
  return total;
}
/* ---------- Best Day Records ---------- */
export function computeBestRecords(){
  let bestPct = { pct: 0, date: null };
  let bestXP = { xp: 0, date: null };
  
  const created = parseDate(state.createdAt || todayStr());
  const today = new Date();
  
  for(const c = new Date(created); c <= today; c.setDate(c.getDate() + 1)){
    const ds = fmtDate(c);
    const s = dayStats(ds);
    
    if(s.pct > bestPct.pct){
      bestPct = { pct: s.pct, date: ds };
    }
    
    if(s.xp > bestXP.xp){
      bestXP = { xp: s.xp, date: ds };
    }
  }
  
  return { bestPct, bestXP };
}

/* ---------- Calendar heat level ---------- */
export function xpToLevel(xp, totalXP){
  if(xp<=0) return 0;
  if(totalXP<=0) return 0;
  const percentage = xp / totalXP;
  if(percentage<0.1) return 1;
  if(percentage<0.25) return 2;
  if(percentage<0.5) return 3;
  return 4;
}
