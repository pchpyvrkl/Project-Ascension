import { state } from './store.js';
import { dayStats } from './domain.js';
import { fmtDate, parseDate, todayStr } from './utils.js';
import { i18nText, currentLang } from './i18n.js';

export let analyticsPeriod = 'days';

export function setAnalyticsPeriod(period){
  analyticsPeriod = period;
  // Update button states
  const selector = document.getElementById('analytics-period-selector');
  selector.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  renderAnalytics();
}

export function renderAnalytics(){
  const today = new Date();
  const todayDs = todayStr();
  const todayStats = dayStats(todayDs);
  
  // Use the earliest date from logs or createdAt, whichever is earlier
  const createdFromLogs = Object.keys(state.logs || {}).length > 0 
    ? Object.keys(state.logs).reduce((min, date) => date < min ? date : min)
    : null;
  const created = createdFromLogs ? parseDate(createdFromLogs) : parseDate(state.createdAt || todayStr());
  
  // Get all days from account creation to today (all-time data for statistics)
  const allDaysList = [];
  for(const c = new Date(created); c <= today; c.setDate(c.getDate() + 1)){
    allDaysList.push(fmtDate(c));
  }
  const allDayData = allDaysList.map(ds => dayStats(ds));
  
  // Calculate statistics for all-time data
  let totalTasks = 0, completedTasks = 0;
  allDayData.forEach(s => {
    totalTasks += s.total;
    completedTasks += s.done;
  });
  const overallSuccessRate = totalTasks > 0 ? Math.round(100 * completedTasks / totalTasks) : 0;
  
  // Update basic stats (all-time)
  document.getElementById('an-totalcompleted').textContent = completedTasks;
  document.getElementById('an-activetasks').textContent = Math.max(0, todayStats.total - todayStats.done);
  document.getElementById('an-overallsuccess').textContent = overallSuccessRate + '%';
  
  // Today's metrics (always show today regardless of period)
  document.getElementById('an-todaystasks').textContent = todayStats.total;
  document.getElementById('an-todaycompleted').textContent = todayStats.done;
  document.getElementById('an-todayrate').textContent = todayStats.pct + '%';
  
  // Average completion and XP for all-time
  const avgPct = allDayData.length > 0 ? Math.round(allDayData.reduce((a,s)=>a+s.pct,0)/allDayData.length) : 0;
  const avgXP = allDayData.length > 0 ? Math.round(allDayData.reduce((a,s)=>a+s.xp,0)/allDayData.length) : 0;
  document.getElementById('an-avgxp').textContent = avgXP;

  // Most productive month (highest average completion)
  const monthData = {};
  allDaysList.forEach(ds => {
    const s = dayStats(ds);
    const d = parseDate(ds);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    if(!monthData[monthKey]) monthData[monthKey] = { totalPct: 0, count: 0 };
    monthData[monthKey].totalPct += s.pct;
    monthData[monthKey].count++;
  });
  let bestMonthKey = null;
  let bestMonthAvg = -1;
  Object.keys(monthData).forEach(monthKey => {
    const avg = Math.round(monthData[monthKey].totalPct / monthData[monthKey].count);
    if(avg > bestMonthAvg){ bestMonthAvg = avg; bestMonthKey = monthKey; }
  });
  if(bestMonthKey){
    const [year, month] = bestMonthKey.split('-').map(Number);
    const bestMonthLabel = new Date(year, month).toLocaleDateString(currentLang==='th' ? 'th-TH' : undefined, { month:'long', year:'numeric' });
    document.getElementById('an-avgpct').textContent = bestMonthLabel;
  } else {
    document.getElementById('an-avgpct').textContent = '—';
  }

  // Best day by XP for all-time (specific date)
  let bestXPDate = null;
  let bestXPValue = -1;
  allDaysList.forEach((ds, idx) => {
    if (allDayData[idx].xp > bestXPValue) {
      bestXPValue = allDayData[idx].xp;
      bestXPDate = ds;
    }
  });
  if (bestXPDate && bestXPValue > 0) {
    const date = parseDate(bestXPDate);
    document.getElementById('an-bestday').textContent = date.toLocaleDateString(currentLang === 'th' ? 'th-TH' : undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    document.getElementById('an-bestday').textContent = '—';
  }

  // Days tracked and perfect days for all-time
  document.getElementById('an-daystracked').textContent = allDaysList.length;

  let perfectDays = 0;
  allDayData.forEach(s => {
    if(s.total>0 && s.done===s.total) perfectDays++;
  });
  document.getElementById('an-perfectdays').textContent = perfectDays;

  // Consistency score for all-time (last 20 days)
  const consistencyWindow = 20;
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - (consistencyWindow - 1));
  let consistencySum = 0, consistencyDays = 0;
  allDaysList.forEach(ds => {
    const d = parseDate(ds);
    const s = dayStats(ds);
    if(d >= windowStart){ 
      consistencySum += s.pct; 
      consistencyDays++; 
    }
  });
  document.getElementById('an-consistency').textContent = consistencyDays > 0 ? Math.round(consistencySum/consistencyDays)+'%' : '0%';

  // Scatter plot: XP vs % Complete (using selected period)
  const scatterContainer = document.getElementById('scatter-plot');
  if(scatterContainer){
    scatterContainer.innerHTML = '';
    
    // Collect data points based on period
    const dataPoints = [];
    
    if(analyticsPeriod === 'days'){
      // For days: show daily data (all-time)
      allDaysList.forEach(ds => {
        const s = dayStats(ds);
        dataPoints.push({
          date: ds,
          xp: s.xp,
          pct: s.pct
        });
      });
    } else if(analyticsPeriod === 'month'){
      // For month: show only current month data
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = today;
      const adjustedStart = created > startDate ? created : startDate;
      
      for(const c = new Date(adjustedStart); c <= endDate; c.setDate(c.getDate() + 1)){
        if(c > today) break;
        const ds = fmtDate(c);
        const s = dayStats(ds);
        dataPoints.push({
          date: ds,
          xp: s.xp,
          pct: s.pct
        });
      }
    } else if(analyticsPeriod === 'months'){
      // For months: aggregate by month
      const monthData = {};
      allDaysList.forEach(ds => {
        const s = dayStats(ds);
        const d = parseDate(ds);
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if(!monthData[monthKey]){
          monthData[monthKey] = { totalXP: 0, totalPct: 0, count: 0 };
        }
        monthData[monthKey].totalXP += s.xp;
        monthData[monthKey].totalPct += s.pct;
        monthData[monthKey].count++;
      });
      
      Object.keys(monthData).forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const avgXP = Math.round(monthData[monthKey].totalXP / monthData[monthKey].count);
        const avgPct = Math.round(monthData[monthKey].totalPct / monthData[monthKey].count);
        dataPoints.push({
          date: monthKey,
          xp: avgXP,
          pct: avgPct,
          label: new Date(parseInt(year), parseInt(month)).toLocaleDateString('en', {month:'short', year:'numeric'})
        });
      });
    } else if(analyticsPeriod === 'years'){
      // For years: aggregate by year
      const yearData = {};
      allDaysList.forEach(ds => {
        const s = dayStats(ds);
        const d = parseDate(ds);
        const yearKey = d.getFullYear();
        if(!yearData[yearKey]){
          yearData[yearKey] = { totalXP: 0, totalPct: 0, count: 0 };
        }
        yearData[yearKey].totalXP += s.xp;
        yearData[yearKey].totalPct += s.pct;
        yearData[yearKey].count++;
      });
      
      Object.keys(yearData).forEach(yearKey => {
        const avgXP = Math.round(yearData[yearKey].totalXP / yearData[yearKey].count);
        const avgPct = Math.round(yearData[yearKey].totalPct / yearData[yearKey].count);
        dataPoints.push({
          date: yearKey.toString(),
          xp: avgXP,
          pct: avgPct,
          label: yearKey.toString()
        });
      });
    }
    
    if(dataPoints.length > 0){
      const scatterWrapper = document.createElement('div');
      scatterWrapper.style.position = 'relative';
      scatterWrapper.style.width = '100%';
      scatterWrapper.style.height = '350px';
      scatterWrapper.style.padding = '30px';
      scatterWrapper.style.border = '1px solid var(--border)';
      scatterWrapper.style.borderRadius = '10px';
      scatterWrapper.style.background = 'var(--bg-elev)';
      scatterWrapper.style.boxSizing = 'border-box';
      
      // Create SVG for scatter plot
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.overflow = 'visible';
      svg.style.display = 'block';
      
      // Wait for layout to settle before calculating dimensions
      setTimeout(() => {
        const width = scatterWrapper.clientWidth - 60;
        const height = scatterWrapper.clientHeight - 60;
        const padding = 30;
        
        // Clear and recreate SVG content
        while (svg.firstChild) {
          svg.removeChild(svg.firstChild);
        }
        
        // Add axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding);
        xAxis.setAttribute('y1', height - padding);
        xAxis.setAttribute('x2', width - padding);
        xAxis.setAttribute('y2', height - padding);
        xAxis.setAttribute('stroke', 'var(--border)');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);
        
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding);
        yAxis.setAttribute('y1', padding);
        yAxis.setAttribute('x2', padding);
        yAxis.setAttribute('y2', height - padding);
        yAxis.setAttribute('stroke', 'var(--border)');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);
        
        // Add axis labels
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', width / 2);
        xLabel.setAttribute('y', height - 5);
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.setAttribute('fill', 'var(--text-faint)');
        xLabel.setAttribute('font-size', '12');
        xLabel.textContent = '% Complete';
        svg.appendChild(xLabel);
        
        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('x', 10);
        yLabel.setAttribute('y', height / 2);
        yLabel.setAttribute('text-anchor', 'middle');
        yLabel.setAttribute('fill', 'var(--text-faint)');
        yLabel.setAttribute('font-size', '12');
        yLabel.setAttribute('transform', `rotate(-90, 10, ${height / 2})`);
        yLabel.textContent = 'XP';
        svg.appendChild(yLabel);
        
        // Linear regression trend line for XP vs % Complete
        const maxXP = Math.max(...dataPoints.map(p => p.xp), 1);
        const regressionPoints = dataPoints.map(point => ({
          x: point.pct,
          y: point.xp
        }));

        let slope = 0;
        let intercept = 0;
        if(regressionPoints.length > 1) {
          const meanX = regressionPoints.reduce((sum, p) => sum + p.x, 0) / regressionPoints.length;
          const meanY = regressionPoints.reduce((sum, p) => sum + p.y, 0) / regressionPoints.length;
          let numerator = 0;
          let denominator = 0;
          regressionPoints.forEach(point => {
            const dx = point.x - meanX;
            const dy = point.y - meanY;
            numerator += dx * dy;
            denominator += dx * dx;
          });
          if(denominator !== 0) {
            slope = numerator / denominator;
            intercept = meanY - slope * meanX;
          }
        }

        const x1 = 0;
        const x2 = 100;
        const y1 = intercept + slope * x1;
        const y2 = intercept + slope * x2;

        const plotLeft = padding;
        const plotRight = width - padding;
        const plotTop = padding;
        const plotBottom = height - padding;
        const plotWidth = plotRight - plotLeft;
        const plotHeight = plotBottom - plotTop;

        const clipY = value => Math.max(0, Math.min(maxXP, value));
        const getPlotCoord = point => ({
          x: plotLeft + (point.x / 100) * plotWidth,
          y: plotBottom - (point.y / maxXP) * plotHeight
        });

        const linePoints = [{x: x1, y: y1}, {x: x2, y: y2}];
        const visiblePoints = linePoints.filter(p => p.y >= 0 && p.y <= maxXP);

        const addIntersection = (pA, pB, boundY) => {
          if((pA.y < boundY && pB.y > boundY) || (pA.y > boundY && pB.y < boundY)){
            const t = (boundY - pA.y) / (pB.y - pA.y);
            const x = pA.x + (pB.x - pA.x) * t;
            if(x >= 0 && x <= 100){
              visiblePoints.push({ x, y: boundY });
            }
          }
        };

        addIntersection(linePoints[0], linePoints[1], 0);
        addIntersection(linePoints[0], linePoints[1], maxXP);

        if(visiblePoints.length === 2){
          const pA = getPlotCoord(visiblePoints[0]);
          const pB = getPlotCoord(visiblePoints[1]);
          const trendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          trendLine.setAttribute('x1', pA.x);
          trendLine.setAttribute('y1', pA.y);
          trendLine.setAttribute('x2', pB.x);
          trendLine.setAttribute('y2', pB.y);
          trendLine.setAttribute('stroke', 'rgba(255,255,255,0.65)');
          trendLine.setAttribute('stroke-width', '1.5');
          svg.appendChild(trendLine);

        }

        // Group data points by same XP and completion percentage
        const groupedPoints = {};
        dataPoints.forEach(point => {
          const key = `${point.xp}-${point.pct}`;
          if(!groupedPoints[key]) {
            groupedPoints[key] = [];
          }
          groupedPoints[key].push(point);
        });
        
        // Plot data points (one circle per unique XP/percentage combination)
        Object.keys(groupedPoints).forEach(key => {
          const points = groupedPoints[key];
          const representativePoint = points[0]; // Use first point for positioning
          
          const x = padding + (representativePoint.pct / 100) * (width - 2 * padding);
          const y = (height - padding) - (representativePoint.xp / maxXP) * (height - 2 * padding);
          
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          
          // Make circle slightly larger if it represents multiple days
          const baseRadius = points.length > 1 ? 8 : 6;
          circle.setAttribute('r', baseRadius);
          
          // Use green color based on completion percentage
          let fillColor;
          if(representativePoint.pct === 100) fillColor = '#46b478';
          else if(representativePoint.pct >= 75) fillColor = 'rgba(70,180,120,0.8)';
          else if(representativePoint.pct >= 50) fillColor = 'rgba(70,180,120,0.6)';
          else if(representativePoint.pct >= 25) fillColor = 'rgba(70,180,120,0.4)';
          else fillColor = 'rgba(70,180,120,0.2)';
          
          circle.setAttribute('fill', fillColor);
          circle.setAttribute('stroke', 'var(--bg-elev)');
          circle.setAttribute('stroke-width', '2');
          circle.style.cursor = 'pointer';
          circle.style.transition = 'r 0.2s, fill 0.2s';
          
          // Store the original fill color and radius for hover restoration
          circle.dataset.originalFill = fillColor;
          circle.dataset.originalRadius = baseRadius;
          circle.dataset.xp = representativePoint.xp;
          circle.dataset.pct = representativePoint.pct;
          circle.dataset.pointCount = points.length;
          
          // Create tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'scatter-tooltip';
          tooltip.style.position = 'absolute';
          tooltip.style.background = 'var(--bg-elev-2)';
          tooltip.style.border = '1px solid var(--border)';
          tooltip.style.borderRadius = '8px';
          tooltip.style.padding = '12px';
          tooltip.style.fontSize = '12px';
          tooltip.style.color = 'var(--text)';
          tooltip.style.pointerEvents = 'none';
          tooltip.style.opacity = '0';
          tooltip.style.transition = 'opacity 0.2s';
          tooltip.style.zIndex = '1000';
          tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          tooltip.style.whiteSpace = 'nowrap';
          tooltip.style.maxWidth = '300px';
          
          // Build tooltip content with all days
          let tooltipContent = '';
          if(points.length === 1) {
            if(representativePoint.label){
              // Monthly aggregated data
              tooltipContent = `
                <div style="font-weight:bold; margin-bottom:4px;">${representativePoint.label}</div>
                <div>XP: <span style="color:#46b478; font-weight:bold;">${points[0].xp}</span></div>
                <div>Complete: <span style="color:#46b478; font-weight:bold;">${points[0].pct}%</span></div>
              `;
            } else {
              // Daily data
              const dateObj = parseDate(points[0].date);
              tooltipContent = `
                <div style="font-weight:bold; margin-bottom:4px;">${dateObj.toLocaleDateString(undefined,{month:'short', day:'numeric', year:'numeric'})}</div>
                <div>XP: <span style="color:#46b478; font-weight:bold;">${points[0].xp}</span></div>
                <div>Complete: <span style="color:#46b478; font-weight:bold;">${points[0].pct}%</span></div>
              `;
            }
          } else {
            // Multiple days with same values
            tooltipContent = `
              <div style="font-weight:bold; margin-bottom:8px; border-bottom:1px solid var(--border); padding-bottom:4px;">
                ${points.length} days
              </div>
              <div style="margin-bottom:4px;">XP: <span style="color:#46b478; font-weight:bold;">${representativePoint.xp}</span></div>
              <div style="margin-bottom:8px;">Complete: <span style="color:#46b478; font-weight:bold;">${representativePoint.pct}%</span></div>
              <div style="font-size:11px; color:var(--text-dim);">Dates:</div>
              <div style="max-height:150px; overflow-y:auto; margin-top:4px;">
                ${points.map(p => {
                  const dateObj = parseDate(p.date);
                  return `<div style="padding:2px 0;">${dateObj.toLocaleDateString(undefined,{month:'short', day:'numeric', year:'numeric'})}</div>`;
                }).join('')}
              </div>
            `;
          }
          tooltip.innerHTML = tooltipContent;
          
          scatterWrapper.appendChild(tooltip);
          
          // Hover events
          circle.addEventListener('mouseenter', (e) => {
            circle.setAttribute('r', parseInt(circle.dataset.originalRadius) + 4);
            circle.setAttribute('fill', '#46b478'); // Bright green on hover
            tooltip.style.opacity = '1';
            
            // Position tooltip relative to circle position
            tooltip.style.left = (x + 10) + 'px';
            tooltip.style.top = (y - 40) + 'px';
          });
          
          circle.addEventListener('mouseleave', () => {
            circle.setAttribute('r', circle.dataset.originalRadius);
            circle.setAttribute('fill', circle.dataset.originalFill);
            circle.setAttribute('stroke', 'var(--bg-elev)');
            circle.setAttribute('stroke-width', '2');
            tooltip.style.opacity = '0';
          });
          
          svg.appendChild(circle);
        });
      }, 50);
      
      scatterWrapper.appendChild(svg);
      scatterContainer.appendChild(scatterWrapper);
    }
  }

  // Monthly heatmap
  const hm = document.getElementById('monthly-heatmap');
  hm.innerHTML = '';
  hm.style.display = 'flex';
  hm.style.flexDirection = 'column';
  hm.style.gap = '20px';
  
  // Get all years from data
  const years = new Set();
  Object.keys(state.logs).forEach(dateStr => {
    const year = parseDate(dateStr).getFullYear();
    years.add(year);
  });
  const sortedYears = Array.from(years).sort();
  
  // Add current year if not present
  const currentYear = today.getFullYear();
  if(!sortedYears.includes(currentYear)) sortedYears.push(currentYear);
  
  // Year totals for summary row, calculated from each year's start date through today
  const yearTotals = {};
  sortedYears.forEach(year => {
    const startDate = [...Object.keys(state.logs)]
      .map(d => parseDate(d))
      .filter(d => d.getFullYear() === year)
      .sort((a, b) => a - b)[0] || new Date(year, 0, 1);
    const endDate = year === currentYear ? today : new Date(year, 11, 31);

    let xp = 0;
    let done = 0;
    let total = 0;

    for (let c = new Date(startDate); c <= endDate; c.setDate(c.getDate() + 1)) {
      const s = dayStats(fmtDate(c));
      xp += s.xp;
      done += s.done;
      total += s.total;
    }

    yearTotals[year] = { xp, done, total, pct: total > 0 ? Math.round(100 * done / total) : 0 };
  });
  
  // Create month cells for each year
  sortedYears.forEach(year => {
    // Year container
    const yearContainer = document.createElement('div');
    yearContainer.style.marginBottom = '24px';
    
    // Year header
    const yearHeader = document.createElement('div');
    yearHeader.className = 'month-cell year-header';
    yearHeader.textContent = year;
    yearHeader.style.padding = '12px 16px';
    yearHeader.style.fontWeight = 'bold';
    yearHeader.style.background = 'var(--bg-elev-2)';
    yearHeader.style.borderRadius = '10px';
    yearHeader.style.marginBottom = '12px';
    yearHeader.style.fontSize = '18px';
    yearHeader.style.color = 'var(--text)';
    yearContainer.appendChild(yearHeader);
    
    // Month grid for this year - responsive layout
    const monthGrid = document.createElement('div');
    monthGrid.style.display = 'grid';
    monthGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(70px, 1fr))';
    monthGrid.style.gap = '10px';
    
    for(let month = 0; month < 12; month++){
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const clampEnd = monthEnd > today ? today : monthEnd;
      
      let monthXP = 0;
      let monthTotal = 0;
      let monthDone = 0;
      
      for(const c = new Date(monthStart); c <= clampEnd; c.setDate(c.getDate() + 1)){
        const s = dayStats(fmtDate(c));
        monthXP += s.xp;
        monthTotal += s.total;
        monthDone += s.done;
      }
      
      const monthPct = monthTotal > 0 ? Math.round(100 * monthDone / monthTotal) : 0;
      
      const cell = document.createElement('div');
      cell.className = 'month-cell';
      cell.style.border = '1px solid var(--border)';
      cell.style.borderRadius = '10px';
      cell.style.padding = '0 8px 12px 8px';
      cell.style.minHeight = '80px';
      cell.style.display = 'flex';
      cell.style.flexDirection = 'column';
      cell.style.justifyContent = 'flex-start';
      cell.style.alignItems = 'center';
      cell.style.textAlign = 'center';
      cell.style.transition = 'transform 0.2s, border-color 0.2s';
      cell.style.cursor = 'default';
      cell.style.position = 'relative';
      
      // Apply background color based on completion percentage (brighter green)
      if (monthPct === 100) {
        cell.style.backgroundColor = 'rgba(70,180,120,0.6)';
        cell.style.borderColor = 'rgba(70,180,120,0.9)';
      } else if (monthPct >= 75) {
        cell.style.backgroundColor = 'rgba(70,180,120,0.5)';
        cell.style.borderColor = 'rgba(70,180,120,0.8)';
      } else if (monthPct >= 50) {
        cell.style.backgroundColor = 'rgba(70,180,120,0.4)';
        cell.style.borderColor = 'rgba(70,180,120,0.7)';
      } else if (monthPct >= 25) {
        cell.style.backgroundColor = 'rgba(70,180,120,0.25)';
        cell.style.borderColor = 'rgba(70,180,120,0.5)';
      } else if (monthPct > 0) {
        cell.style.backgroundColor = 'rgba(70,180,120,0.15)';
        cell.style.borderColor = 'rgba(70,180,120,0.4)';
      } else {
        cell.style.backgroundColor = 'var(--bg-elev)';
        cell.style.borderColor = 'var(--border)';
      }
      
      const monthName = monthStart.toLocaleDateString(currentLang==='th'?'th-TH':undefined,{month:'short'});
      
      // Use same text colors as calendar
      const textColor = monthPct > 0 ? 'var(--text)' : 'var(--text-faint)';
      const xpColor = monthPct > 0 ? 'var(--accent)' : 'var(--accent)';
      const dimColor = monthPct > 0 ? 'var(--accent)' : 'var(--text-dim)';
      
      cell.innerHTML = `
        <div style="display:flex; flex:1; flex-direction:column; justify-content:center; align-items:center; gap:2px; padding-top:10px;">
          <div style="font-size:16px; font-weight:bold; color:${xpColor};">${monthXP}</div>
          <div style="font-size:10px; color:${dimColor};">XP</div>
          <div style="font-size:12px; color:${textColor}; font-weight:600;">${monthName}</div>
        </div>
      `;
      
      monthGrid.appendChild(cell);
    }
    
    yearContainer.appendChild(monthGrid);
    
    // Year summary row
    const yearSummary = document.createElement('div');
    yearSummary.className = 'month-cell year-summary';
    yearSummary.style.padding = '14px 16px';
    yearSummary.style.background = 'var(--bg-elev-2)';
    yearSummary.style.borderRadius = '10px';
    yearSummary.style.border = '1px solid var(--border)';
    yearSummary.style.display = 'flex';
    yearSummary.style.justifyContent = 'space-between';
    yearSummary.style.alignItems = 'center';
    yearSummary.style.flexWrap = 'wrap';
    yearSummary.style.gap = '12px';
    
    const avgYearPct = yearTotals[year].total > 0 ? Math.round(100 * yearTotals[year].done / yearTotals[year].total) : 0;
    
    yearSummary.innerHTML = `
      <div style="font-weight:bold; color:var(--text); font-size:16px;">${year} ${i18nText('analytics.yearTotal')}</div>
      <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="color:var(--accent); font-weight:bold; font-size:18px;">${yearTotals[year].xp}</span>
          <span style="color:var(--text-faint); font-size:13px;">XP</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="color:var(--text-dim); font-weight:bold; font-size:18px;">${avgYearPct}%</span>
          <span style="color:var(--text-faint); font-size:13px;">${i18nText('analytics.yearAvg')}</span>
        </div>
      </div>
    `;
    
    yearContainer.appendChild(yearSummary);
    hm.appendChild(yearContainer);
  });

  // % Complete heatmap
  renderCalendarHeatmap('pct');

  // XP heatmap
  renderCalendarHeatmap('xp');
}


// Calendar heatmap functions for XP and % Complete
export let heatmapTimeframe = { pct: 'month', xp: 'month' };
export let selectedYear = { pct: null, xp: null };

export function setHeatmapTimeframe(chartType, timeframe) {
  heatmapTimeframe[chartType] = timeframe;
  
  // Update button states
  const containerId = chartType === 'pct' ? 'pct-heatmap-calendar' : 'xp-heatmap-calendar';
  const container = document.getElementById(containerId);
  if (container) {
    const buttons = container.parentElement.querySelectorAll('.heatmap-timeframe-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.timeframe === timeframe);
    });
  }
  
  renderCalendarHeatmap(chartType);
}

export function toggleYearDropdown(chartType, event) {
  event.stopPropagation();
  const dropdownId = `${chartType}-year-dropdown`;
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  // Close other dropdowns
  document.querySelectorAll('.year-dropdown').forEach(dd => {
    if (dd.id !== dropdownId) dd.classList.remove('show');
  });

  // Toggle current dropdown
  const isOpen = dropdown.classList.contains('show');
  dropdown.classList.toggle('show');

  if (!isOpen) {
    populateYearDropdown(chartType);
  }
}

export function populateYearDropdown(chartType) {
  const dropdownId = `${chartType}-year-dropdown`;
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  const today = new Date();
  const created = parseDate(state.createdAt || todayStr());
  const startYear = created.getFullYear();
  const currentYear = today.getFullYear();

  // Calculate available years
  const years = [];
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }

  // Build dropdown content
  let html = '<div class="year-dropdown-header">Select Year</div>';
  years.forEach(year => {
    const isActive = selectedYear[chartType] === year || (selectedYear[chartType] === null && year === currentYear);
    html += `
      <div class="year-dropdown-item ${isActive ? 'active' : ''}" onclick="selectYear('${chartType}', ${year})">
        <span class="year-text">${year}</span>
      </div>
    `;
  });

  dropdown.innerHTML = html;
}

export function selectYear(chartType, year) {
  selectedYear[chartType] = year;
  setHeatmapTimeframe(chartType, 'year');

  // Close dropdown
  const dropdownId = `${chartType}-year-dropdown`;
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) dropdown.classList.remove('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.year-dropdown').forEach(dd => {
    dd.classList.remove('show');
  });
});

export function renderCalendarHeatmap(chartType) {
  const calendar = document.getElementById(chartType === 'pct' ? 'pct-heatmap-calendar' : 'xp-heatmap-calendar');
  if (!calendar) return;
  
  calendar.innerHTML = '';
  
  const today = new Date();
  const created = parseDate(state.createdAt || todayStr());
  const timeframe = heatmapTimeframe[chartType];
  
  let startDate, endDate;

  switch (timeframe) {
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'year':
      const yearToUse = selectedYear[chartType] || today.getFullYear();
      startDate = new Date(yearToUse, 0, 1);
      endDate = yearToUse === today.getFullYear() ? today : new Date(yearToUse, 11, 31);
      break;
    case 'total':
      startDate = created;
      endDate = today;
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }

  // Ensure start date is not before account creation
  if (startDate < created) {
    startDate = new Date(created);
  }

  // Ensure end date is not after today
  if (endDate > today) {
    endDate = new Date(today);
  }
  
  // Group by month
  const monthGroups = {};
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const key = `${year}-${month}`;
    
    if (!monthGroups[key]) {
      monthGroups[key] = {
        year,
        month,
        days: []
      };
    }
    
    monthGroups[key].days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Get daily data
  const dailyData = {};
  const allDaysList = [];
  for (const c = new Date(startDate); c <= endDate; c.setDate(c.getDate() + 1)) {
    const ds = fmtDate(c);
    allDaysList.push(ds);
    const s = dayStats(ds);
    dailyData[ds] = {
      value: chartType === 'pct' ? s.pct : s.xp,
      total: s.total,
      done: s.done
    };
  }
  
  // Calculate max value for color scaling
  const values = Object.values(dailyData).map(d => d.value);
  const maxValue = Math.max(...values, 1);
  
  // Render each month
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  Object.keys(monthGroups).sort().forEach(key => {
    const group = monthGroups[key];
    const monthDiv = document.createElement('div');
    monthDiv.className = 'calendar-month';
    
    // Month header
    const header = document.createElement('div');
    header.className = 'calendar-month-header';
    
    const monthLabel = document.createElement('div');
    monthLabel.className = 'month-label';
    monthLabel.textContent = monthNames[group.month];
    header.appendChild(monthLabel);
    
    const yearLabel = document.createElement('div');
    yearLabel.className = 'year-label';
    yearLabel.textContent = group.year;
    header.appendChild(yearLabel);
    
    // Calculate total for this month
    let monthTotal = 0;
    group.days.forEach(date => {
      const dateStr = fmtDate(date);
      monthTotal += dailyData[dateStr] ? dailyData[dateStr].value : 0;
    });
    
    const monthTotalLabel = document.createElement('div');
    monthTotalLabel.className = 'month-total';
    monthTotalLabel.textContent = chartType === 'pct' ? Math.round(monthTotal / group.days.length) + '%' : Math.round(monthTotal);
    header.appendChild(monthTotalLabel);
    
    monthDiv.appendChild(header);
    
    // Single grid for both labels and cells
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    
    // Add day labels as first row
    dayNames.forEach(day => {
      const label = document.createElement('div');
      label.className = 'day-label';
      label.textContent = day;
      grid.appendChild(label);
    });
    
    // Add empty cells for alignment
    const firstDayOfWeek = group.days[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell';
      emptyCell.style.visibility = 'hidden';
      emptyCell.style.pointerEvents = 'none';
      emptyCell.style.width = '30px';
      emptyCell.style.height = '30px';
      grid.appendChild(emptyCell);
    }
    
    // Add actual days
    group.days.forEach(date => {
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      const dateStr = fmtDate(date);
      const data = dailyData[dateStr] || { value: 0 };
      
      // Add color level based on value
      if (data.value > 0) {
        const level = Math.ceil((data.value / maxValue) * 5);
        cell.classList.add(`level-${Math.min(level, 5)}`);
      }
      
      // Add date number
      const dayNumber = document.createElement('span');
      dayNumber.className = 'day-number';
      dayNumber.textContent = date.getDate();
      cell.appendChild(dayNumber);
      
      // Add tooltip
      cell.title = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n${chartType === 'pct' ? 'Completion' : 'XP'}: ${data.value}${chartType === 'pct' ? '%' : ''}\nTasks: ${data.done}/${data.total}`;
      
      grid.appendChild(cell);
    });
    
    monthDiv.appendChild(grid);
    calendar.appendChild(monthDiv);
  });
  
  // Update stats
  updateHeatmapStats(chartType, dailyData, startDate, endDate);
}

export function updateHeatmapStats(chartType, dailyData, startDate, endDate) {
  const prefix = chartType === 'pct' ? 'pct' : 'xp';
  
  let total = 0;
  let activeDays = 0;
  let bestDay = { date: null, value: 0 };
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = fmtDate(d);
    const data = dailyData[dateStr] || { value: 0, total: 0, done: 0 };
    
    // Include ALL days in total calculation
    total += data.value;
    
    // Track active days (days with value > 0)
    if (data.value > 0) {
      activeDays++;
      
      if (data.value > bestDay.value) {
        bestDay = { date: dateStr, value: data.value };
      }
    }
  }
  
  // Update stats display - use ALL days for total/average calculations
  document.getElementById(`${prefix}-cal-total`).textContent = chartType === 'pct' ? Math.round(total / totalDays) + '%' : Math.round(total);
  document.getElementById(`${prefix}-cal-total-days`).textContent = totalDays + ' days';
  
  const avg = totalDays > 0 ? total / totalDays : 0;
  document.getElementById(`${prefix}-cal-avg`).textContent = chartType === 'pct' ? Math.round(avg) + '%' : Math.round(avg);
  document.getElementById(`${prefix}-cal-avg-days`).textContent = totalDays + ' days';
  
  if (bestDay.date) {
    const bestDate = parseDate(bestDay.date);
    document.getElementById(`${prefix}-cal-best`).textContent = chartType === 'pct' ? Math.round(bestDay.value) + '%' : Math.round(bestDay.value);
    document.getElementById(`${prefix}-cal-best-date`).textContent = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else {
    document.getElementById(`${prefix}-cal-best`).textContent = '0';
    document.getElementById(`${prefix}-cal-best-date`).textContent = '--';
  }
  
  document.getElementById(`${prefix}-cal-active`).textContent = activeDays;
  document.getElementById(`${prefix}-cal-total-days-display`).textContent = totalDays + ' total';
}

