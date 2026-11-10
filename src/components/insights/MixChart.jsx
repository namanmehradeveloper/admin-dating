import { useState } from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard, ChartBoundary, ChartState, InsightTooltip } from './Primitives.jsx';
import { count, number, COLORS } from './data.js';

export default function MixChart({ title, subtitle, items = [], centerLabel = 'Reported total', icon, footer }) {
  const [selected, setSelected] = useState(null);
  const rows = items.filter(item => count(item.value) !== null);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const current = rows.find(row => row.key === selected);
  const focus = (row) => setSelected(selected === row.key ? null : row.key);
  return <ChartCard title={title} subtitle={subtitle} icon={icon} footer={footer}>
    {!rows.length || total === 0 ? <ChartState title={rows.length ? 'No activity recorded' : 'No data available'} message={rows.length ? 'All reported counts are zero for this view.' : 'This breakdown has not been supplied.'} /> : <div className="insight-donut">
      <div className="insight-donut__plot"><ChartBoundary resetKey={JSON.stringify(rows)}><ResponsiveContainer width="100%" height={230} minWidth={0}>
        <PieChart accessibilityLayer><Pie data={rows} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="88%" paddingAngle={rows.filter(row => row.value > 0).length > 1 ? 3 : 0} cornerRadius={5} stroke="none" onMouseEnter={(_, index) => setSelected(rows[index]?.key)} onMouseLeave={() => setSelected(null)} animationDuration={650} animationBegin={0} isAnimationActive="auto">{rows.map(row => <Cell key={row.key} fill={row.color || COLORS.purple} opacity={selected && selected !== row.key ? .3 : 1} />)}</Pie><Tooltip content={<InsightTooltip />} /></PieChart>
      </ResponsiveContainer></ChartBoundary><div className="insight-donut__center" aria-live="polite"><strong>{number(current ? current.value : total)}</strong><span>{current ? current.name : centerLabel}</span></div></div>
      <ul className="insight-mix-legend">{rows.map(row => <li key={row.key}><button type="button" aria-pressed={selected === row.key} onClick={() => focus(row)} onFocus={() => setSelected(row.key)} onBlur={() => setSelected(null)}><span><i style={{ background: row.color || COLORS.purple }} />{row.name}</span><strong>{number(row.value)}<small>{((row.value / total) * 100).toFixed(1)}%</small></strong></button></li>)}</ul>
    </div>}
  </ChartCard>;
}
