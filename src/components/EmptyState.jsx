import { Inbox } from 'lucide-react';
export default function EmptyState({ message = 'Nothing here yet.' }) {
  return <div className="state state--empty"><span className="state__icon" aria-hidden><Inbox size={24} strokeWidth={1.6} /></span><span>{message}</span></div>;
}
