import { useState } from 'react';
import { Funnel, FunnelChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Filter } from 'lucide-react';
import { ChartCard, ChartBoundary, ChartState, InsightTooltip } from './Primitives.jsx';
import { funnelRows, number, finite } from './data.js';
import { formatEnum } from '../../utils/format.js';

export default function ConversionFunnel({ performance, custom = false }) {
  const choices = Array.isArray(performance) ? performance : [];
  const [action, setAction] = useState('LIKE');
  const row = choices.find(item => item.action === action) || choices[0];
  const rows = funnelRows(row);
  return <ChartCard title="Like-to-match funnel" subtitle="Follow an action from a like to a matched like" icon={Filter} actions={choices.length > 1 && <select className="insight-select" aria-label="Funnel action" value={row.action} onChange={event => setAction(event.target.value)}>{choices.map(item => <option key={item.action} value={item.action}>{formatEnum(item.action)}</option>)}</select>} footer="Counts refer to the selected action, not unique members.">
    {custom ? <ChartState title="Choose a preset to see conversion" message="Swipe conversion is available for 7, 30, and 90 days. Custom dates apply to the activity charts." /> : !rows.length ? <ChartState message="Like and matched-like counts have not been supplied for this period." /> : rows[0].value === 0 ? <ChartState title="No likes recorded" message="The funnel will appear when this action has recorded likes." /> : <>
      <div className="insight-funnel-stat"><strong>{finite(row.conversion) !== null ? `${number(row.conversion)}%` : `${((row.matches / row.likes) * 100).toFixed(1)}%`}</strong><span>{formatEnum(row.action)} conversion</span></div>
      <ChartBoundary resetKey={JSON.stringify(row)}><div className="insight-funnel-plot"><ResponsiveContainer width="100%" height="100%" minWidth={0}><FunnelChart accessibilityLayer margin={{ top: 10, right: 24, bottom: 10, left: 24 }}><Tooltip content={<InsightTooltip />} /><Funnel data={rows} dataKey="value" nameKey="name" lastShapeType="rectangle" stroke="var(--surface)" strokeWidth={5} isAnimationActive="auto" animationBegin={0} animationDuration={650} /></FunnelChart></ResponsiveContainer></div></ChartBoundary>
      <ol className="insight-funnel-legend">{rows.map((item, i) => <li key={item.name}><span><i style={{ background: item.fill }} />{i + 1}. {item.name}</span><strong>{number(item.value)}</strong></li>)}</ol>
    </>}
  </ChartCard>;
}
