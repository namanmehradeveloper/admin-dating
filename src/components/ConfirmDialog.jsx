// Modal confirmation for actions that change data (ban, reject, close...). Extra form fields can be
// passed as children. Escape or Cancel closes it unless the action is running.

import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  isBusy = false,
  error,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  className = '',
  children,
}) {
  const dialogRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const isBusyRef = useRef(isBusy);
  onCancelRef.current = onCancel;
  isBusyRef.current = isBusy;

  // Focus the first field only when the dialog opens — not on every parent re-render.
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector('textarea, input, select, button')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !isBusyRef.current) onCancelRef.current();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={() => !isBusy && onCancel()}>
      <div
        className={`dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        {message && <p className="muted">{message}</p>}
        {children}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog__actions">
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={isBusy}>
            Cancel
          </button>
          <button type="button" className={`button button--${tone}`} onClick={onConfirm} disabled={isBusy || confirmDisabled}>
            {isBusy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
