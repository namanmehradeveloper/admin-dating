import { describe, it, expect } from 'vitest';
import { analyticsRequest, checkedPayload, count, datedSeries, finite, funnelRows, localDate, number, presetRange, signupSeries, subscriptionMix, sumKnown, validDate, validRange } from './data.js';

describe('reporting data integrity', () => {
  it('preserves real zero values and rejects missing or invalid counts', () => {
    expect(count(0)).toBe(0);
    for (const value of [undefined, null, '', '42', NaN, Infinity, -1]) expect(count(value)).toBeNull();
    expect(number(null)).toBe('—');
    expect(finite(-4.5)).toBe(-4.5);
  });
  it('keeps missing metrics as gaps without inventing zeros or dated rows', () => {
    expect(datedSeries([{ date: '2026-11-03', signups: 0 }, { date: '2026-11-01', signups: 3, matches: 2 }, { date: 'invalid', signups: 9 }], ['signups', 'matches']))
      .toEqual([{ date: '2026-11-01', signups: 3, matches: 2 }, { date: '2026-11-03', signups: 0, matches: null }]);
  });
  it('filters dated rows inclusively for a custom period', () => {
    const rows = ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'].map(date => ({ date, messages: 4 }));
    expect(datedSeries(rows, ['messages'], { from: '2026-11-01', to: '2026-11-02' })).toHaveLength(2);
  });
  it('uses only actual signup series, with no unrelated sparkline fallback', () => {
    expect(signupSeries({ trends: [{ date: '2026-11-01', matches: 44 }], signupsByDay: [{ date: '2026-11-01', count: 3 }] })).toEqual([{ date: '2026-11-01', signups: 3 }]);
    expect(signupSeries({ trends: [{ date: '2026-11-01', signups: 0 }], signupsByDay: [{ date: '2026-11-01', count: 3 }] })[0].signups).toBe(0);
  });
  it('does not derive subscription counts from incomplete or inconsistent totals', () => {
    expect(subscriptionMix(10, 4).map(row => row.value)).toEqual([4, 6]);
    expect(subscriptionMix(0, 0).map(row => row.value)).toEqual([0, 0]);
    expect(subscriptionMix(null, 4)).toEqual([]);
    expect(subscriptionMix(3, 4)).toEqual([]);
  });
  it('uses matching like conversion counts and rejects invalid funnels', () => {
    expect(funnelRows({ likes: 12, matches: 5 }).map(row => row.value)).toEqual([12, 5]);
    expect(funnelRows({ likes: 0, matches: 0 })).toHaveLength(2);
    expect(funnelRows({ likes: 5, matches: 6 })).toEqual([]);
    expect(funnelRows({ likes: 5 })).toEqual([]);
  });
  it('does not total incomplete samples', () => {
    expect(sumKnown([{ value: 0 }, { value: 2 }], 'value')).toBe(2);
    expect(sumKnown([{ value: null }, { value: 2 }], 'value')).toBeNull();
    expect(sumKnown([], 'value')).toBeNull();
  });
  it('rejects empty envelopes while accepting a legitimate empty payload', () => {
    expect(() => checkedPayload(null)).toThrow();
    expect(() => checkedPayload([])).toThrow();
    expect(checkedPayload({})).toEqual({});
  });
});

describe('date controls and existing request contracts', () => {
  it('computes inclusive presets across month and year boundaries', () => {
    const now = new Date(2026, 0, 2, 12);
    expect(presetRange(7, now)).toEqual({ from: '2025-12-27', to: '2026-01-02', preset: 7 });
    expect(presetRange(1, now).from).toBe(localDate(now));
  });
  it('validates real calendar dates and prevents reversed and future periods', () => {
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('2026-02-29')).toBe(false);
    expect(validRange({ from: '2026-11-01', to: '2026-11-10' }, '2026-11-10')).toBe(true);
    expect(validRange({ from: '2026-11-11', to: '2026-11-10' }, '2026-11-10')).toBe(false);
    expect(validRange({ from: '', to: '2026-11-10' }, '2026-11-10')).toBe(false);
    expect(validRange({ from: '2026-11-01', to: '2026-11-11' }, '2026-11-10')).toBe(false);
  });
  it('retains the days-only contract for preset analytics requests', () => {
    for (const days of [7, 30, 90]) expect(analyticsRequest(presetRange(days))).toEqual({ kind: 'analytics', params: { days } });
  });
  it('uses only supported dashboard dates for custom analytics', () => {
    expect(analyticsRequest({ from: '2026-10-01', to: '2026-10-12', preset: null })).toEqual({ kind: 'dashboard', params: { from: '2026-10-01', to: '2026-10-12' } });
  });
});
