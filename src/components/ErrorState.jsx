// Error message with an optional "Try again" button.

import { CircleAlert, RotateCcw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon" aria-hidden><CircleAlert size={24} /></span>
      <strong>Unable to load this information</strong>
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          <RotateCcw size={15} aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}
