// Two-column label/value list for detail pages. `rows` is [[label, value], ...].

export default function DetailList({ rows }) {
  return (
    <dl className="detail-list">
      {rows.map(([label, value]) => (
        <div key={label} className="detail-list__row">
          <dt>{label}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
