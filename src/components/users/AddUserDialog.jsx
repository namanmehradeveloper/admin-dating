// Creates a member account by phone with onboarding-style profile fields and optional photos.

import { useEffect, useMemo, useState } from 'react';
import { createUser, uploadUserPhotos } from '../../api/users.api.js';
import { listInterests } from '../../api/profiles.api.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import { PROFILE_GENDERS, RELATIONSHIP_GOALS, SHOW_ME_OPTIONS } from '../../utils/constants.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatEnum } from '../../utils/format.js';

const COUNTRY_DIAL_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'US/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
  { code: '+977', label: 'Nepal (+977)' },
];

const EMPTY_FORM = {
  countryCode: '+91',
  nationalNumber: '',
  displayName: '',
  dateOfBirth: '',
  gender: 'WOMAN',
  showGender: false,
  relationshipGoal: 'LONG_TERM',
  showMe: 'EVERYONE',
  maxDistanceKm: 50,
  bio: '',
  city: '',
  occupation: '',
  interestIds: [],
};

const MAX_PHOTOS = 6;

function toE164(countryCode, nationalNumber) {
  const digits = String(nationalNumber ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return `${countryCode}${digits}`;
}

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
  const [photoFiles, setPhotoFiles] = useState([]);
  const [interestOptions, setInterestOptions] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    listInterests()
      .then((items) => {
        if (!cancelled) setInterestOptions(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setInterestOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const photoPreviews = useMemo(
    () => photoFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [photoFiles],
  );

  useEffect(() => {
    return () => {
      for (const preview of photoPreviews) URL.revokeObjectURL(preview.url);
    };
  }, [photoPreviews]);

  function setField(field) {
    return (value) => setForm((current) => ({ ...current, [field]: value }));
  }

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setPhotoFiles([]);
    setError(null);
    onClose();
  }

  function handleCancel() {
    if (isSaving) return;
    resetAndClose();
  }

  function toggleInterest(id) {
    setForm((current) => {
      const has = current.interestIds.includes(id);
      if (has) return { ...current, interestIds: current.interestIds.filter((item) => item !== id) };
      if (current.interestIds.length >= 10) return current;
      return { ...current, interestIds: [...current.interestIds, id] };
    });
  }

  function handlePhotosChange(event) {
    const selected = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!selected.length) return;
    setPhotoFiles((current) => {
      const next = [...current, ...selected].slice(0, MAX_PHOTOS);
      return next;
    });
  }

  function removePhoto(index) {
    setPhotoFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const phoneNumber = toE164(form.countryCode, form.nationalNumber);
      const body = {
        phoneNumber,
        displayName: form.displayName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        showGender: form.showGender,
        relationshipGoal: form.relationshipGoal,
        showMe: form.showMe,
        maxDistanceKm: Number(form.maxDistanceKm),
        status: 'ACTIVE',
        verificationStatus: 'NONE',
        visibilityStatus: 'VISIBLE',
        minAge: 18,
        maxAge: 99,
      };
      if (form.bio.trim()) body.bio = form.bio.trim();
      if (form.city.trim()) body.city = form.city.trim();
      if (form.occupation.trim()) body.occupation = form.occupation.trim();
      if (form.interestIds.length) body.interestIds = form.interestIds;

      const created = await createUser(body);

      let photoNote = '';
      if (photoFiles.length) {
        const upload = await uploadUserPhotos(created.id, photoFiles);
        if (upload.failures?.length) {
          photoNote = ` ${upload.photos?.length ?? 0} photo(s) saved; ${upload.failures.length} failed.`;
        }
      }

      setForm(EMPTY_FORM);
      setPhotoFiles([]);
      onCreated({ ...created, _photoNote: photoNote });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  const phoneNumber = toE164(form.countryCode, form.nationalNumber);
  const phoneOk = /^\+[1-9]\d{7,14}$/.test(phoneNumber);
  const canSubmit = phoneOk && form.displayName.trim().length >= 1 && form.dateOfBirth;

  return (
    <ConfirmDialog
      open={open}
      title="Add user"
      message="Create a member account with profile details. Photos are optional (1–6). The member signs in later with a one-time code to this phone — no login session is created here."
      confirmLabel="Create user"
      className="dialog--wide"
      isBusy={isSaving}
      error={error}
      confirmDisabled={!canSubmit}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <div className="form-grid">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Phone number *</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
            <label className="field" style={{ flex: '0 0 160px', margin: 0 }}>
              <span className="sr-only">Country code</span>
              <select
                value={form.countryCode}
                onChange={(event) => setField('countryCode')(event.target.value)}
                aria-label="Country code"
              >
                {COUNTRY_DIAL_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ flex: '1 1 auto', margin: 0 }}>
              <span className="sr-only">Mobile number</span>
              <input
                type="tel"
                value={form.nationalNumber}
                onChange={(event) => setField('nationalNumber')(event.target.value.replace(/[^\d\s-]/g, ''))}
                placeholder="9876543210"
                inputMode="numeric"
                autoComplete="off"
                aria-label="Mobile number"
              />
            </label>
          </div>
          {form.nationalNumber && (
            <small className="muted">{phoneOk ? `Will save as ${phoneNumber}` : 'Enter a valid mobile number for the selected country'}</small>
          )}
        </div>
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
        <label className="field">
          <span>City</span>
          <input
            type="text"
            value={form.city}
            onChange={(event) => setField('city')(event.target.value)}
            maxLength={80}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Occupation</span>
          <input
            type="text"
            value={form.occupation}
            onChange={(event) => setField('occupation')(event.target.value)}
            maxLength={80}
            autoComplete="off"
          />
        </label>
        <label className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Bio</span>
          <textarea
            value={form.bio}
            onChange={(event) => setField('bio')(event.target.value)}
            maxLength={500}
            rows={3}
          />
        </label>
        {interestOptions.length > 0 && (
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Interests ({form.interestIds.length}/10)</span>
            <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {interestOptions.map((interest) => {
                const id = interest.id ?? interest._id;
                const selected = form.interestIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={selected ? 'chip chip--active' : 'chip'}
                    onClick={() => toggleInterest(id)}
                    disabled={!selected && form.interestIds.length >= 10}
                  >
                    {interest.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Profile photos (optional, up to {MAX_PHOTOS})</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotosChange}
            disabled={photoFiles.length >= MAX_PHOTOS}
          />
          {photoPreviews.length > 0 && (
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
              {photoPreviews.map((preview, index) => (
                <li key={`${preview.name}-${index}`} style={{ position: 'relative' }}>
                  <img
                    src={preview.url}
                    alt={preview.name}
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                  <button type="button" onClick={() => removePhoto(index)} disabled={isSaving}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ConfirmDialog>
  );
}
