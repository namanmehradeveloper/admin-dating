// Chart colours and labels. Recharts draws SVG attributes, so colours are plain values, not CSS variables.

export const CHART_COLORS = {
  primary: '#5a3fd6',
  pink: '#e04878',
  teal: '#1f9a8f',
  amber: '#d8891a',
  green: '#178a52',
  red: '#d03550',
  grey: '#7f8aa3',
  grid: '#dfe3ef',
  text: '#5b657c',
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
