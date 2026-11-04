// One number on the dashboard, optionally linking to the related page.
// Optional Lucide icon + tone matches the Dating Cloud KPI card pattern.

import { Link } from 'react-router-dom';
import { formatNumber } from '../utils/format.js';

function displayValue(value) {
  if (typeof value === 'number') return formatNumber(value);
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

export default function StatCard({ label, value, hint, to, icon: Icon, tone = 'primary' }) {
  const body = (
    <>
      <div className="stat-card__top">
        {Icon ? (
          <span className={`stat-card__icon stat-card__icon--${tone}`} aria-hidden>
            <Icon size={18} strokeWidth={2.1} />
          </span>
        ) : null}
        <span className="stat-card__label">{label}</span>
      </div>
      <strong className="stat-card__value">{displayValue(value)}</strong>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat-card stat-card--link">
      {body}
    </Link>
  ) : (
    <div className="stat-card">{body}</div>
  );
}
