// Error message with an optional "Try again" button.

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
