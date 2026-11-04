// Grouped bar chart of sign-ups, matches and messages per day (daily activity overview).

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '../../utils/format.js';
import { CHART_COLORS, formatDay } from './chartTheme.js';

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__label">{formatDay(label)}</span>
      {payload.map((entry) => (
        <div key={entry.dataKey}>
          <strong style={{ color: entry.color }}>
            {formatNumber(entry.value)} {entry.name}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function DailyActivityChart({ data, days }) {
  const isEmpty = !data?.length || data.every((day) => day.signups + day.matches + day.messages === 0);

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2>Daily activity</h2>
          <span className="chart-total">Sign-ups, matches and messages · last {days} days</span>
        </div>
      </div>

      {isEmpty ? (
        <p className="chart-empty">No activity in this range yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
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
            <Tooltip content={<ActivityTooltip />} cursor={{ fill: 'rgba(91, 75, 219, 0.06)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.text }} />
            <Bar dataKey="signups" name="Sign-ups" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="matches" name="Matches" fill={CHART_COLORS.pink} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="messages" name="Messages" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
