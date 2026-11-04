// Area chart of one daily metric (sign-ups, matches or messages) with a metric switcher and the period total.
// Metrics are shown one at a time because messages dwarf the other two on a shared axis.

import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '../../utils/format.js';
import SegmentedControl from '../SegmentedControl.jsx';
import { CHART_COLORS, formatDay } from './chartTheme.js';

const METRICS = [
  { value: 'signups', label: 'Sign-ups', color: CHART_COLORS.primary },
  { value: 'matches', label: 'Matches', color: CHART_COLORS.pink },
  { value: 'messages', label: 'Messages', color: CHART_COLORS.teal },
];

function TrendTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__label">{formatDay(label)}</span>
      <strong>
        {formatNumber(payload[0].value)} {metric.label.toLowerCase()}
      </strong>
    </div>
  );
}

export default function TrendChart({ data, days }) {
  const [metricKey, setMetricKey] = useState('signups');
  const metric = METRICS.find((item) => item.value === metricKey);
  const total = data.reduce((sum, day) => sum + day[metricKey], 0);
  const gradientId = `trend-gradient-${metricKey}`;

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Growth trend</h2>
          <span className="chart-total">
            {formatNumber(total)} {metric.label.toLowerCase()} in the last {days} days
          </span>
        </div>
        <SegmentedControl label="Metric" options={METRICS} value={metricKey} onChange={setMetricKey} />
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<TrendTooltip metric={metric} />} cursor={{ stroke: metric.color, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey={metricKey}
            stroke={metric.color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
