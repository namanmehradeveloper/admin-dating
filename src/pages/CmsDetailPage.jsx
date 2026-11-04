// One CMS entry — edit and status changes for ADMIN.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCms, updateCms } from '../api/cms.api.js';
import DetailList from '../components/DetailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { CMS_STATUSES, CMS_TYPES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

export default function CmsDetailPage() {
  const { cmsId } = useParams();
  const { isAdmin } = useAuth();
  const { data, setData, error, isLoading, reload } = useApi(() => getCms(cmsId), [cmsId], { poll: false });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setBody(data.body ?? '');
  }, [data]);

  if (isLoading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  async function handleSave(extra = {}) {
    setIsSaving(true);
    setNotice(null);
    try {
      const updated = await updateCms(cmsId, { title: title.trim(), body, ...extra });
      setData(updated);
      setNotice('Saved.');
    } catch (saveError) {
      setNotice(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="detail-page">
      <PageHeader title={data.title} subtitle={data.slug} backTo="/cms" backLabel="CMS" />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <section className="card">
        <DetailList
          rows={[
            ['Type', formatEnum(data.type)],
            ['Status', <StatusBadge key="status" value={data.status} />],
            ['Locale', data.locale],
            ['Published', formatDateTime(data.publishedAt)],
            ['Updated', formatDateTime(data.updatedAt)],
          ]}
        />
      </section>

      {isAdmin ? (
        <section className="card">
          <h2>Edit</h2>
          <label className="field">
            <span>Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={data.type} onChange={(event) => handleSave({ type: event.target.value })} disabled={isSaving}>
              {CMS_TYPES.map((option) => (
                <option key={option} value={option}>
                  {formatEnum(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Body</span>
            <textarea rows={10} value={body} onChange={(event) => setBody(event.target.value)} maxLength={20000} />
          </label>
          <div className="stack-inline">
            <button type="button" className="button button--primary" disabled={isSaving} onClick={() => handleSave()}>
              Save
            </button>
            {CMS_STATUSES.filter((status) => status !== data.status).map((status) => (
              <button key={status} type="button" className="button button--secondary" disabled={isSaving} onClick={() => handleSave({ status })}>
                Set {formatEnum(status)}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Body</h2>
          <pre className="cms-body">{data.body || '—'}</pre>
        </section>
      )}
    </div>
  );
}
