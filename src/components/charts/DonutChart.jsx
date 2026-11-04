// Donut chart of counts per status with the total in the centre and a legend showing count and share.

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatEnum, formatNumber } from '../../utils/format.js';
import { CHART_COLORS, STATUS_COLORS } from './chartTheme.js';

export default function DonutChart({ title, counts, centerLabel = 'Total' }) {
  const slices = Object.entries(counts ?? {})
    .map(([key, value]) => ({ key, name: formatEnum(key), value, color: STATUS_COLORS[key] ?? CHART_COLORS.grey }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <section className="card">
      <h2>{title}</h2>
      {total === 0 ? (
        <p className="chart-empty">No data yet</p>
      ) : (
        <div className="donut">
          <div className="donut__chart">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} stroke="none">
                  {slices.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut__center">
              <strong>{formatNumber(total)}</strong>
              <span>{centerLabel}</span>
            </div>
          </div>
          <ul className="chart-legend">
            {slices.map((slice) => (
              <li key={slice.key}>
                <span className="chart-legend__dot" style={{ background: slice.color }} />
                <span className="chart-legend__name">{slice.name}</span>
                <span className="chart-legend__value">
                  {formatNumber(slice.value)} <small>({Math.round((slice.value / total) * 100)}%)</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
