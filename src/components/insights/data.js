// Presentation helpers only. Missing values stay missing; no synthetic statistics.
export const COLORS = { purple: 'var(--insight-purple)', teal: 'var(--insight-teal)', pink: 'var(--insight-pink)', amber: 'var(--insight-amber)', blue: 'var(--insight-blue)', muted: 'var(--insight-muted)' };
export const finite = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
export const count = (value) => finite(value) !== null && value >= 0 ? value : null;
export const number = (value) => finite(value) === null ? '—' : new Intl.NumberFormat().format(value);
export const compact = (value) => finite(value) === null ? '—' : new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; }
export function presetRange(days, now = new Date()) { const start = new Date(now); start.setDate(start.getDate() - days + 1); return { from: localDate(start), to: localDate(now), preset: days }; }
export function validRange(range, today = localDate()) { return validDate(range.from) && validDate(range.to) && range.from <= range.to && range.to <= today; }
export function dayLabel(value, full = false) { return validDate(value) ? new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(full ? { year: 'numeric' } : {}), timeZone: 'UTC' }) : String(value ?? ''); }
export const rangeLabel = (range) => `${dayLabel(range.from, true)} – ${dayLabel(range.to, true)}`;
export function datedSeries(rows, keys, { from, to } = {}, dateKey = 'date') {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => validDate(row?.[dateKey]) && (!from || row[dateKey] >= from) && (!to || row[dateKey] <= to))
    .map(row => ({ date: row[dateKey], ...Object.fromEntries(keys.map(key => [key, count(row[key])])) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function signupSeries(dashboard, range) {
  const trends = datedSeries(dashboard?.trends, ['signups'], range);
  if (trends.some(row => row.signups !== null)) return trends;
  return datedSeries(dashboard?.signupsByDay, ['count'], range).map(row => ({ date: row.date, signups: row.count }));
}
export function sumKnown(rows, key) { return rows.length && rows.every(row => count(row[key]) !== null) ? rows.reduce((sum, row) => sum + row[key], 0) : null; }
export function subscriptionMix(total, premium) {
  if (count(total) === null || count(premium) === null || premium > total) return [];
  return [{ key: 'plus', name: 'Active Plus', value: premium, color: COLORS.purple }, { key: 'other', name: 'Other members', value: total - premium, color: COLORS.muted }];
}
export function funnelRows(row) {
  if (count(row?.likes) === null || count(row?.matches) === null || row.matches > row.likes) return [];
  return [{ name: 'Likes sent', value: row.likes, fill: COLORS.purple }, { name: 'Matched likes', value: row.matches, fill: COLORS.teal }];
}
// Analytics accepts preset days. Custom activity uses the already-supported dashboard dates.
export const analyticsRequest = (range) => range.preset ? { kind: 'analytics', params: { days: range.preset } } : { kind: 'dashboard', params: { from: range.from, to: range.to } };
export function checkedPayload(payload) { if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('No reporting data was returned. Please try again.'); return payload; }
