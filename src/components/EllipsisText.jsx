// Single-line truncated text with a native tooltip when content overflows.

export default function EllipsisText({ children, title, className = '' }) {
  const empty = children == null || children === '';
  const content = empty ? '—' : children;
  const tip =
    title ??
    (typeof content === 'string' || typeof content === 'number' ? String(content) : undefined);

  return (
    <span className={`table-ellipsis ${className}`.trim()} title={empty ? undefined : tip}>
      {content}
    </span>
  );
}
