// Configurable Plus plans (ADMIN only). Overrides live in AppSetting; catalog ids stay fixed.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSubscriptionPlans, updateSubscriptionPlan } from '../api/subscriptions.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatEnum, formatMoney } from '../utils/format.js';

function EditPlanDialog({ plan, open, onClose, onSaved }) {
  const [title, setTitle] = useState(plan?.title || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [priceLabel, setPriceLabel] = useState(plan?.priceLabel || '');
  const [amountRupees, setAmountRupees] = useState(plan ? String(plan.amountMinor / 100) : '');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setTitle(plan.title);
    setDescription(plan.description);
    setPriceLabel(plan.priceLabel);
    setAmountRupees(String(plan.amountMinor / 100));
    setError(null);
  }, [plan]);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const amountMinor = Math.round(Number(amountRupees) * 100);
      onSaved(
        await updateSubscriptionPlan(plan.id, {
          title: title.trim(),
          description: description.trim(),
          priceLabel: priceLabel.trim(),
          amountMinor,
        }),
      );
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={`Edit ${plan?.id || 'plan'}`}
      confirmLabel="Save plan"
      isBusy={isSaving}
      error={error}
      confirmDisabled={!title.trim() || !priceLabel.trim() || !Number.isFinite(Number(amountRupees))}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={3} />
      </label>
      <label className="field">
        <span>Price label</span>
        <input value={priceLabel} onChange={(event) => setPriceLabel(event.target.value)} maxLength={40} />
      </label>
      <label className="field">
        <span>Amount (₹)</span>
        <input type="number" min={1} step="1" value={amountRupees} onChange={(event) => setAmountRupees(event.target.value)} />
      </label>
      <p className="muted small">Period stays {formatEnum(plan?.period)}. Product id cannot change.</p>
    </ConfirmDialog>
  );
}

export default function SubscriptionPlansPage() {
  const plans = useApi(() => listSubscriptionPlans(), []);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function resetPlan(productId) {
    setBusyId(productId);
    try {
      await updateSubscriptionPlan(productId, { reset: true });
      setNotice('Plan restored to catalog defaults.');
      plans.reload();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  if (plans.isLoading && !plans.data) return <LoadingState />;
  if (plans.error) return <ErrorState message={plans.error} onRetry={plans.reload} />;

  return (
    <div className="admin-page">
      <PageHeader
        title="Subscription plans"
        subtitle="Monthly ₹499 and Yearly ₹3,999 defaults. Overrides apply to member paywall and checkout."
        backTo="/subscriptions"
        backLabel="Subscriptions"
        actions={
          <Link className="button button--ghost" to="/payments">
            Payments
          </Link>
        }
      />

      {notice ? <Notice tone="info">{notice}</Notice> : null}

      <div className="grid-2">
        {(plans.data?.items || []).map((plan) => (
          <section key={plan.id} className="card">
            <div className="card__header">
              <div>
                <h2>{plan.title}</h2>
                <p className="muted small">{plan.id} · {formatEnum(plan.period)}</p>
              </div>
              <StatusBadge value={plan.isOverridden ? 'ACTIVE' : 'DRAFT'} />
            </div>
            <p>{plan.description}</p>
            <div className="detail-rows section-gap">
              <div>
                <span>Display price</span>
                <strong>{plan.priceLabel}</strong>
              </div>
              <div>
                <span>Charge amount</span>
                <strong>{formatMoney(plan.amountMinor, plan.currency)}</strong>
              </div>
              <div>
                <span>Defaults</span>
                <strong>
                  {plan.defaults?.priceLabel} · {formatMoney(plan.defaults?.amountMinor, plan.currency)}
                </strong>
              </div>
            </div>
            <div className="button-row">
              <button type="button" className="button button--primary" onClick={() => setEditing(plan)}>
                Edit
              </button>
              <button
                type="button"
                className="button button--ghost"
                disabled={!plan.isOverridden || busyId === plan.id}
                onClick={() => void resetPlan(plan.id)}
              >
                {busyId === plan.id ? 'Resetting…' : 'Reset defaults'}
              </button>
            </div>
          </section>
        ))}
      </div>

      <EditPlanDialog
        plan={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setNotice('Plan updated. Member paywall will use the new values.');
          plans.reload();
        }}
      />
    </div>
  );
}
