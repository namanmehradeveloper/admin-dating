// Display helpers for dates, numbers and enum values.

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const numberFormat = new Intl.NumberFormat();

// "14 Oct 2026, 13:05", or "—" when empty.
export function formatDateTime(value) {
  return value ? dateTimeFormat.format(new Date(value)) : '—';
}

// "14 Oct 2026", or "—" when empty.
export function formatDate(value) {
  return value ? dateFormat.format(new Date(value)) : '—';
}

// "12,345"
export function formatNumber(value) {
  return typeof value === 'number' ? numberFormat.format(value) : '—';
}

// "IN_REVIEW" -> "In review"
export function formatEnum(value) {
  if (!value) return '—';
  const words = String(value).toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Converts a <input type="datetime-local"> value to an ISO timestamp (or undefined when empty).
export function localInputToIso(value) {
  return value ? new Date(value).toISOString() : undefined;
}

// "2m 14s" / "45s" for answered call length; "—" when unknown.
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '—';
  const whole = Math.round(seconds);
  if (whole < 60) return `${whole}s`;
  const minutes = Math.floor(whole / 60);
  const rem = whole % 60;
  if (minutes < 60) return rem ? `${minutes}m ${rem}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

// "3 hours ago" / "just now" for activity feeds.
export function formatRelativeTime(value) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}
