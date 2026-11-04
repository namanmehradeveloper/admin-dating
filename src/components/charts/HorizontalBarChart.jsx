// Horizontal bar chart for ranked categories (largest first), with the value printed after each bar.

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEnum, formatNumber } from '../../utils/format.js';
import { CHART_COLORS } from './chartTheme.js';

const ROW_HEIGHT = 44;

export default function HorizontalBarChart({ title, items, color = CHART_COLORS.primary, emptyText = 'Nothing here right now' }) {
  const rows = items
    .map((item) => ({ ...item, name: item.name ?? formatEnum(item.key) }))
    .sort((a, b) => b.value - a.value);
  const isEmpty = rows.every((row) => row.value === 0);

  return (
    <section className="card">
      <h2>{title}</h2>
      {isEmpty ? (
        <p className="chart-empty">{emptyText}</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, rows.length * ROW_HEIGHT)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'rgba(91, 75, 219, 0.06)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
              {rows.map((row) => (
                <Cell key={row.key} fill={row.color ?? color} />
              ))}
              <LabelList dataKey="value" position="right" formatter={formatNumber} className="chart-bar-label" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
