// Modal confirmation for actions that change data (ban, reject, close...). Extra form fields can be
// passed as children. Escape or Cancel closes it unless the action is running.

import { ShieldCheck, TriangleAlert } from 'lucide-react';
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
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('textarea, input, select, button')?.focus();
    const trapFocus = (event) => {
      if (event.key !== 'Tab') return;
      const elements = [...dialogRef.current.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex="0"]')].filter((el) => el.getClientRects().length);
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); dialogRef.current.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
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
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`dialog__symbol dialog__symbol--${tone}`} aria-hidden>{tone === 'danger' ? <TriangleAlert size={23} /> : <ShieldCheck size={23} />}</div>
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
