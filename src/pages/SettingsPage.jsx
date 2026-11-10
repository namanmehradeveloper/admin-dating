// Admin-editable limits and read-only system information (ADMIN only). Secrets are never shown:
// the API does not return them.

import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api/settings.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useApi } from '../hooks/useApi.js';
import { SETTING_LABELS as LABELS } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime } from '../utils/format.js';

// "Yes"/"No" for booleans in the system section.
function yesNo(value) {
  return value ? 'Yes' : 'No';
}

export default function SettingsPage() {
  const { data, setData, error, isLoading, reload } = useApi(getSettings, [], { poll: false });
  const [values, setValues] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (data) setValues(Object.fromEntries(data.settings.map((setting) => [setting.key, String(setting.value)])));
  }, [data]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const changes = Object.fromEntries(
    data.settings.filter((setting) => values[setting.key] !== String(setting.value)).map((setting) => [setting.key, Number(values[setting.key])]),
  );
  const hasChanges = Object.keys(changes).length > 0;

  // Saves the changed values after confirmation.
  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      setData(await updateSettings(changes));
      setIsConfirming(false);
      setNotice('Settings saved. They apply immediately.');
    } catch (updateError) {
      setSaveError(getErrorMessage(updateError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader title="Settings" subtitle="Manage platform limits and review system configuration." />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <section className="card">
        <h2>Platform limits</h2>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setIsConfirming(true);
          }}
        >
          {data.settings.map((setting) => (
            <label key={setting.key} className="field">
              <span>{LABELS[setting.key] ?? setting.key}</span>
              <input
                type="number"
                min={setting.min}
                max={setting.max}
                step={1}
                value={values[setting.key] ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, [setting.key]: event.target.value }))}
              />
              <small className="muted">
                Allowed {setting.min}–{setting.max}, default {setting.defaultValue}
                {setting.updatedAt ? ` · changed ${formatDateTime(setting.updatedAt)}` : ''}
              </small>
            </label>
          ))}
          <div className="field--wide">
            <button type="submit" className="button button--primary" disabled={!hasChanges}>
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>System information</h2>
        <DetailList
          rows={[
            ['Environment', data.system.environment],
            ['Current Terms version', data.system.currentTermsVersion],
            ['OTP mode', data.system.otpMode === 'fixed' ? 'Fixed development code (no SMS sent)' : data.system.otpMode],
            ['Push notifications configured', yesNo(data.system.pushNotificationsConfigured)],
            ['Store billing configured', yesNo(data.system.storeBillingConfigured)],
            ['Apple / Google sign-in configured', yesNo(data.system.socialSignInConfigured)],
          ]}
        />
      </section>

      <ConfirmDialog
        open={isConfirming}
        title="Save settings?"
        message={Object.entries(changes)
          .map(([key, value]) => `${LABELS[key] ?? key}: ${value}`)
          .join(' · ')}
        confirmLabel="Save"
        isBusy={isSaving}
        error={saveError}
        onConfirm={handleSave}
        onCancel={() => {
          setIsConfirming(false);
          setSaveError(null);
        }}
      />
    </div>
  );
}
