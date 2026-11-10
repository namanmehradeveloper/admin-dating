import { useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { localDate, presetRange, validRange } from './data.js';

export function useInsightRange() {
  const [applied, setApplied] = useState(() => presetRange(7));
  const [draft, setDraft] = useState(applied);
  const [customOpen, setCustomOpen] = useState(false);
  const choose = (days) => { const range = presetRange(days); setApplied(range); setDraft(range); setCustomOpen(false); };
  const apply = (event) => { event.preventDefault(); if (validRange(draft)) setApplied({ from: draft.from, to: draft.to, preset: null }); };
  return { applied, draft, setDraft, customOpen, setCustomOpen, choose, apply, key: `${applied.from}:${applied.to}:${applied.preset}` };
}
export default function DateRange({ range, loading, onRefresh, todayOption = false }) {
  const invalid = !validRange(range.draft);
  return <section className="insight-filter card" aria-label="Reporting period">
    <div className="insight-filter__row">
      <div className="insight-filter__label"><CalendarDays size={17} aria-hidden /><span>Reporting period</span></div>
      <div className="insight-presets" role="group" aria-label="Date presets">
        {(todayOption ? [1, 7, 30, 90] : [7, 30, 90]).map(days => <button key={days} type="button" aria-pressed={range.applied.preset === days && !range.customOpen} onClick={() => range.choose(days)}>{days === 1 ? 'Today' : `${days} days`}</button>)}
        <button type="button" aria-pressed={range.customOpen || range.applied.preset === null} aria-expanded={range.customOpen} onClick={() => range.setCustomOpen(!range.customOpen)}>Custom</button>
      </div>
      <button className="button button--secondary insight-refresh" onClick={onRefresh} disabled={loading} type="button"><RefreshCw size={15} className={loading ? 'insight-spin' : ''} aria-hidden />Refresh</button>
    </div>
    {range.customOpen && <form className="insight-custom" onSubmit={range.apply}>
      <label className="field"><span>Start date</span><input type="date" required value={range.draft.from} max={range.draft.to || localDate()} onChange={e => range.setDraft({ ...range.draft, from: e.target.value })} /></label>
      <label className="field"><span>End date</span><input type="date" required value={range.draft.to} min={range.draft.from || undefined} max={localDate()} onChange={e => range.setDraft({ ...range.draft, to: e.target.value })} /></label>
      <button type="submit" className="button button--primary" disabled={invalid || loading}>Apply dates</button>
      {invalid && <p className="insight-date-error" role="status">Choose valid dates, with the start on or before the end and no future dates.</p>}
    </form>}
  </section>;
}
