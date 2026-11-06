export function computeAccentForPct(pct, dim){
  const clamped = Math.max(0, Math.min(100, pct));
  const hue = Math.round(4 + (clamped/100)*136); // 4=red, ~140=green
  const sat = 72, light = clamped>=100 ? 58 : 55;
  return dim ? `hsl(${hue} ${sat}% ${light}% / 0.16)` : `hsl(${hue} ${sat}% ${light}%)`;
}
export function updateAccentColor(pct){
  const root = document.documentElement.style;
  const accentColor = computeAccentForPct(pct, false);
  root.setProperty('--accent', accentColor);
  root.setProperty('--accent-dim', computeAccentForPct(pct, true));
  
  // Extract RGB from HSL for the heatmap
  const hue = Math.round(4 + (Math.min(Math.max(pct,0),100)/100)*136);
  const sat = 72, light = Math.min(Math.max(pct,0),100)>=100 ? 58 : 55;
  
  // Convert HSL to RGB
  const h = hue/360, s = sat/100, l = light/100;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  root.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
}
