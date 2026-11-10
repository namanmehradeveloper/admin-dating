import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard, ChartBoundary, ChartState, InsightTooltip } from './Primitives.jsx';
import { count, compact, number, COLORS } from './data.js';
export default function CategoryChart({ title, subtitle, items = [], icon }) {
  const rows = items.filter(item => count(item.value) !== null);
  return <ChartCard title={title} subtitle={subtitle} icon={icon}>
    {!rows.length ? <ChartState /> : rows.every(row => row.value === 0) ? <ChartState title="No activity recorded" message="All reported counts in this breakdown are zero." /> : <>
      <ChartBoundary resetKey={JSON.stringify(rows)}><div className="insight-category-plot" style={{ height: Math.max(220, rows.length * 46) }}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={rows} layout="vertical" margin={{ top: 6, right: 12, bottom: 4, left: 0 }} accessibilityLayer><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" horizontal={false} /><XAxis type="number" tickFormatter={compact} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} /><YAxis type="category" dataKey="name" width={100} tickFormatter={value => value.length > 15 ? `${value.slice(0, 14)}…` : value} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<InsightTooltip />} cursor={{ fill: 'var(--primary-soft)' }} /><Bar dataKey="value" name="Count" radius={[0, 5, 5, 0]} barSize={19} animationDuration={650} isAnimationActive="auto">{rows.map(row => <Cell key={row.key} fill={row.color || COLORS.purple} />)}</Bar></BarChart></ResponsiveContainer></div></ChartBoundary>
      <ul className="insight-category-key">{rows.map(row => <li key={row.key}><span><i style={{ background: row.color || COLORS.purple }} />{row.name}</span><strong>{number(row.value)}</strong></li>)}</ul>
    </>}
  </ChartCard>;
}
