// Creates a member account by phone with the same core fields as app onboarding.

import { useState } from 'react';
import { createUser } from '../../api/users.api.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import { PROFILE_GENDERS, RELATIONSHIP_GOALS, SHOW_ME_OPTIONS } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatEnum } from '../../utils/format.js';

const EMPTY_FORM = {
  phoneNumber: '',
  displayName: '',
  dateOfBirth: '',
  gender: 'WOMAN',
  showGender: false,
  relationshipGoal: 'LONG_TERM',
  showMe: 'EVERYONE',
  maxDistanceKm: 50,
};

function EnumSelect({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatEnum(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AddUserDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField(field) {
    return (value) => setForm((current) => ({ ...current, [field]: value }));
  }

  function handleCancel() {
    if (isSaving) return;
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const created = await createUser({
        phoneNumber: form.phoneNumber.trim(),
        displayName: form.displayName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        showGender: form.showGender,
        relationshipGoal: form.relationshipGoal,
        showMe: form.showMe,
        maxDistanceKm: Number(form.maxDistanceKm),
        // Same defaults the app would land on after a normal signup
        status: 'ACTIVE',
        verificationStatus: 'NONE',
        visibilityStatus: 'VISIBLE',
        minAge: 18,
        maxAge: 99,
      });
      setForm(EMPTY_FORM);
      onCreated(created);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  const phoneOk = /^\+[1-9]\d{7,14}$/.test(form.phoneNumber.trim());
  const canSubmit = phoneOk && form.displayName.trim().length >= 1 && form.dateOfBirth;

  return (
    <ConfirmDialog
      open={open}
      title="Add user"
      message="Create a member account. The member can sign in using a one-time code sent to this phone number."
      confirmLabel="Create user"
      className="dialog--wide"
      isBusy={isSaving}
      error={error}
      confirmDisabled={!canSubmit}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <div className="form-grid">
        <label className="field">
          <span>Phone number with country code *</span>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(event) => setField('phoneNumber')(event.target.value)}
            placeholder="+919876543210"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Display name</span>
          <input
            type="text"
            value={form.displayName}
            onChange={(event) => setField('displayName')(event.target.value)}
            maxLength={40}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Date of birth</span>
          <input type="date" value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth')(event.target.value)} />
        </label>
        <EnumSelect label="Gender" value={form.gender} options={PROFILE_GENDERS} onChange={setField('gender')} />
        <label className="field">
          <span>Show gender on profile</span>
          <select
            value={form.showGender ? 'true' : 'false'}
            onChange={(event) => setField('showGender')(event.target.value === 'true')}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        <EnumSelect
          label="Relationship goal"
          value={form.relationshipGoal}
          options={RELATIONSHIP_GOALS}
          onChange={setField('relationshipGoal')}
        />
        <EnumSelect label="Show me" value={form.showMe} options={SHOW_ME_OPTIONS} onChange={setField('showMe')} />
        <label className="field">
          <span>Maximum distance (km)</span>
          <input
            type="number"
            min={1}
            max={500}
            value={form.maxDistanceKm}
            onChange={(event) => setField('maxDistanceKm')(event.target.value)}
          />
        </label>
      </div>
    </ConfirmDialog>
  );
}
