// Spinner with a label, inline or covering the whole screen.

export default function LoadingState({ label = 'Loading…', fullScreen = false }) {
  return (
    <div className={fullScreen ? 'state state--fullscreen' : 'state'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
