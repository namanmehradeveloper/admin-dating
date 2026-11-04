// Shared list-page toolbar: status chips + search/filter form.

export function FilterChip({ value, selected, onSelect, label, tone }) {
  const active = selected === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`users-chip ${tone ? `users-chip--${tone}` : ''} ${active ? 'is-active' : ''}`}
      onClick={() => onSelect(value)}
    >
      {label}
    </button>
  );
}

export default function FilterToolbar({ label, chips, children }) {
  return (
    <section className="users-toolbar card">
      {chips ? (
        <div className="users-toolbar__chips" role="tablist" aria-label={label}>
          {chips}
        </div>
      ) : null}
      {children}
    </section>
  );
}
