// Chart colours and labels. Recharts draws SVG attributes, so colours are plain values, not CSS variables.

export const CHART_COLORS = {
  primary: '#5b4bdb',
  pink: '#e5487a',
  teal: '#8b7cf5',
  amber: '#f0a020',
  green: '#22a06b',
  red: '#d0384b',
  grey: '#a0a6b8',
  grid: '#e3e6ef',
  text: '#687089',
};

export const STATUS_COLORS = {
  ACTIVE: CHART_COLORS.green,
  WARNED: CHART_COLORS.amber,
  SUSPENDED: CHART_COLORS.pink,
  BANNED: CHART_COLORS.red,
  VERIFIED: CHART_COLORS.primary,
  PENDING: CHART_COLORS.amber,
  REJECTED: CHART_COLORS.red,
  NONE: CHART_COLORS.grey,
  LIKE: CHART_COLORS.pink,
  PASS: CHART_COLORS.grey,
  SUPER_LIKE: CHART_COLORS.primary,
};

// "2026-10-15" -> "15 Oct"
export function formatDay(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
