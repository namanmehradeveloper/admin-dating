// Tiny area sparkline for KPI cards (no axes / tooltips).

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color, dataKey = 'value' }) {
  const points = (data ?? []).map((point, index) =>
    typeof point === 'number' ? { i: index, [dataKey]: point } : { i: index, ...point },
  );
  if (points.length < 2) {
    return <div className="sparkline sparkline--empty" aria-hidden />;
  }

  const gradientId = `spark-${color.replace('#', '')}-${dataKey}`;

  return (
    <div className="sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.75} fill={`url(#${gradientId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
