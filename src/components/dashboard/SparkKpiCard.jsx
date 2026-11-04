// Dense KPI tile with optional sparkline and period delta — Overview-style card.

import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/format.js';
import Sparkline from '../charts/Sparkline.jsx';
import { CHART_COLORS } from '../charts/chartTheme.js';

function displayValue(value) {
  if (typeof value === 'number') return formatNumber(value);
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const prefix = delta > 0 ? '+' : '';
  return (
    <span className={`spark-kpi__delta spark-kpi__delta--${tone}`} title="Vs previous equal period">
      {prefix}
      {delta}%
    </span>
  );
}

export default function SparkKpiCard({
  label,
  value,
  hint,
  to,
  delta,
  sparkData,
  sparkColor = CHART_COLORS.primary,
  tone = 'primary',
  size = 'default',
}) {
  const body = (
    <>
      <div className="spark-kpi__meta">
        <span className={`spark-kpi__tone spark-kpi__tone--${tone}`} />
        <span className="spark-kpi__label">{label}</span>
        <DeltaBadge delta={delta} />
      </div>
      <div className="spark-kpi__row">
        <div>
          <strong className="spark-kpi__value">{displayValue(value)}</strong>
          {hint && <span className="spark-kpi__hint">{hint}</span>}
        </div>
        {sparkData?.length ? <Sparkline data={sparkData} color={sparkColor} /> : null}
      </div>
    </>
  );

  const className = `spark-kpi${to ? ' spark-kpi--link' : ''}${size === 'hero' ? ' spark-kpi--hero' : ''}`;

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
