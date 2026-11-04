// Shared Teachers-style table card used across admin list pages.

export default function DataTablePanel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`users-table-panel card users-table-panel--data ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="users-table-panel__header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p className="muted small">{subtitle}</p> : null}
          </div>
          {actions ? <div className="users-table-panel__actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
