import { Component } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesCombined, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, CircleAlert } from 'lucide-react';
import { finite, number } from './data.js';

export function ChartState({ title = 'No data available', message = 'There is no reported activity for this period.', icon: Icon = ChartNoAxesCombined, onRetry }) {
  return <div className="insight-empty" role="status"><span><Icon size={23} aria-hidden /></span><strong>{title}</strong><p>{message}</p>{onRetry && <button className="button button--secondary button--small" onClick={onRetry} type="button"><RefreshCw size={14} aria-hidden />Try again</button>}</div>;
}
export class ChartBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous) { if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false }); }
  render() { return this.state.failed ? <ChartState title="Chart could not be displayed" message="Try displaying this chart again." icon={CircleAlert} onRetry={() => this.setState({ failed: false })} /> : this.props.children; }
}
export function ChartCard({ title, subtitle, icon: Icon = ChartNoAxesCombined, actions, children, footer, className = '' }) {
  return <section className={`card insight-chart ${className}`} aria-label={title}><header className="insight-chart__header"><div className="insight-chart__heading"><span className="insight-chart__icon"><Icon size={18} aria-hidden /></span><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{actions}</header>{children}{footer && <footer className="insight-chart__footer">{footer}</footer>}</section>;
}
export function MetricCard({ label, value, hint, scope = 'Selected period', delta, icon: Icon = ChartNoAxesCombined, color = 'purple', to }) {
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const body = <><div className="insight-metric__top"><span className={`insight-metric__icon insight-tone--${color}`}><Icon size={18} aria-hidden /></span><span>{scope}</span></div><span className="insight-metric__label">{label}</span><div className="insight-metric__value"><strong>{number(value)}</strong>{finite(delta) !== null && <span className={`insight-delta ${delta < 0 ? 'is-down' : ''}`} title="Change versus the previous equal period"><DeltaIcon size={13} aria-hidden />{delta > 0 ? '+' : ''}{number(delta)}%</span>}</div><p>{hint || (finite(value) === null ? 'Not supplied for this period' : 'Reported by your platform')}</p></>;
  return to ? <Link to={to} className="card insight-metric">{body}</Link> : <section className="card insight-metric">{body}</section>;
}
export function InsightsSkeleton() {
  return <div className="insight-skeleton" role="status" aria-label="Loading reporting data"><span className="insight-sr-only">Loading reporting data…</span><div className="insight-metrics">{Array.from({ length: 4 }, (_, i) => <div className="card" key={i}><i /><i /><i /></div>)}</div><div className="insight-grid">{[0, 1].map(i => <div className="card insight-skeleton__chart" key={i}><i /><i /><div /></div>)}</div></div>;
}
export function RefreshNotice({ error, loading, onRetry, label }) {
  if (error) return <div className="insight-notice insight-notice--error" role="alert"><CircleAlert size={17} aria-hidden /><span>Could not refresh: {error}. Still showing {label}.</span><button type="button" onClick={onRetry}>Retry</button></div>;
  if (loading) return <div className="insight-notice" role="status"><RefreshCw size={15} className="insight-spin" aria-hidden /><span>Updating charts. Showing the last loaded period: {label}.</span></div>;
  return null;
}
export function InsightTooltip({ active, payload, label, labelFormatter = value => value }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter(row => finite(row.value) !== null);
  if (!rows.length) return null;
  return <div className="insight-tooltip"><strong>{labelFormatter(label ?? rows[0]?.name)}</strong>{rows.map((row, index) => <div key={`${row.dataKey}-${index}`}><span><i style={{ background: row.color || row.payload?.fill || row.payload?.color }} />{row.name}</span><b>{number(row.value)}</b></div>)}</div>;
}
