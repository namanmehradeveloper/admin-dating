import { useId, useState } from 'react';
import { Area, AreaChart, Line, LineChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard, ChartState, ChartBoundary, InsightTooltip } from './Primitives.jsx';
import { compact, dayLabel, number, finite } from './data.js';

export default function TimeChart({ title, subtitle, data = [], series, defaultType = 'area', icon, switchable = true }) {
  const [type, setType] = useState(defaultType);
  const [hidden, setHidden] = useState([]);
  const id = useId().replace(/:/g, '');
  const visible = series.filter(item => !hidden.includes(item.key));
  const hasData = data.some(row => visible.some(item => finite(row[item.key]) !== null));
  const hasGaps = data.some(row => visible.some(item => finite(row[item.key]) === null));
  const Chart = type === 'line' ? LineChart : type === 'bar' ? BarChart : AreaChart;
  const Mark = type === 'line' ? Line : type === 'bar' ? Bar : Area;
  const toggle = (key) => setHidden(current => current.includes(key) ? current.filter(item => item !== key) : visible.length > 1 ? [...current, key] : current);
  return <ChartCard title={title} subtitle={subtitle} icon={icon} actions={switchable && <div className="insight-chart-switch" role="group" aria-label={`${title} chart type`}>{['area', 'line', 'bar'].map(item => <button type="button" aria-pressed={type === item} onClick={() => setType(item)} key={item}>{item}</button>)}</div>} footer={<>
    <span>{hasGaps ? 'Missing values remain gaps in the chart.' : 'Hover, tap, or use arrow keys to explore.'}</span>
    {hasData && <details className="insight-data"><summary>View data</summary><div className="table-wrap" tabIndex={0} role="region" aria-label={`${title} values`}><table className="table data-table"><thead><tr><th scope="col">Date</th>{series.map(item => <th key={item.key} scope="col">{item.label}</th>)}</tr></thead><tbody>{data.map((row, i) => <tr key={`${row.date}-${i}`}><th scope="row">{dayLabel(row.date, true)}</th>{series.map(item => <td key={item.key}>{number(row[item.key])}</td>)}</tr>)}</tbody></table></div></details>}
  </>}>
    <div className="insight-legend" role="group" aria-label={`${title} series`}>{series.map(item => <button key={item.key} type="button" aria-pressed={!hidden.includes(item.key)} onClick={() => toggle(item.key)} title={`Show or hide ${item.label}`}><i style={{ background: item.color }} />{item.label}</button>)}</div>
    <ChartBoundary resetKey={`${type}:${JSON.stringify(data)}`}>
      {!hasData ? <ChartState message="No dated values were returned for this period." /> : <div className="insight-plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <Chart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 4 }} accessibilityLayer>
            <defs>{series.map(item => <linearGradient key={item.key} id={`${id}-${item.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={item.color} stopOpacity={0.24} /><stop offset="100%" stopColor={item.color} stopOpacity={0.015} /></linearGradient>)}</defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="date" tickFormatter={value => dayLabel(value)} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={32} tickMargin={12} />
            <YAxis tickFormatter={compact} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} allowDecimals={false} tickCount={5} domain={[0, 'auto']} />
            <Tooltip content={<InsightTooltip labelFormatter={value => dayLabel(value, true)} />} cursor={type === 'bar' ? { fill: 'var(--primary-soft)', opacity: .6 } : { stroke: 'var(--border)', strokeDasharray: '4 4' }} />
            {visible.map(item => <Mark key={item.key} dataKey={item.key} name={item.label} type="monotone" stroke={type === 'bar' ? undefined : item.color} strokeWidth={2.5} fill={type === 'area' ? `url(#${id}-${item.key})` : item.color} connectNulls={false} dot={data.length === 1 ? { r: 4 } : false} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 3 }} radius={type === 'bar' ? [5, 5, 0, 0] : undefined} maxBarSize={28} isAnimationActive="auto" animationDuration={650} animationBegin={0} />)}
          </Chart>
        </ResponsiveContainer>
      </div>}
    </ChartBoundary>
  </ChartCard>;
}
