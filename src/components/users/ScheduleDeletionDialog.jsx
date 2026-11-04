// Confirms scheduling a member's 14-day account deletion (ADMIN). Requires an audited reason.

import { useState } from 'react';
import { scheduleUserDeletion } from '../../api/users.api.js';
import { getErrorMessage } from '../../utils/errors.js';
import ConfirmDialog from '../ConfirmDialog.jsx';

export default function ScheduleDeletionDialog({ open, account, onClose, onDeleted }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!open || !account) return null;

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const result = await scheduleUserDeletion(account.id, { reason: reason.trim() });
      onDeleted(result);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Delete user"
      message={`${account.displayName || account.email || 'This member'} will be signed out immediately. Account data is erased after the 14-day grace period unless they sign in again.`}
      confirmLabel="Schedule deletion"
      tone="danger"
      isBusy={isSaving}
      error={error}
      confirmDisabled={reason.trim().length < 3}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Reason (3–500 characters, audited)</span>
        <textarea
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why is this account being deleted?"
        />
      </label>
    </ConfirmDialog>
  );
}
