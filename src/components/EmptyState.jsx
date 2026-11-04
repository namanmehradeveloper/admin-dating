// Message shown when a list has no items.

export default function EmptyState({ message = 'Nothing here yet.' }) {
  return <div className="state state--empty">{message}</div>;
}
