// CMS content list and create/publish workflow.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createCms, listCms, updateCms } from '../api/cms.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FilterSelect from '../components/FilterSelect.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import ListView from '../components/ListView.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { CMS_TYPES } from '../utils/constants.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDateTime, formatEnum } from '../utils/format.js';

function CreateCmsDialog({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('FAQ');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      onCreated(await createCms({ title: title.trim(), slug: slug.trim(), type, body, status: 'DRAFT', locale: 'en' }));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Create CMS entry"
      confirmLabel="Create draft"
      isBusy={isSaving}
      error={error}
      confirmDisabled={title.trim().length < 1 || slug.trim().length < 1}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
      </label>
      <label className="field">
        <span>Slug</span>
        <input value={slug} onChange={(event) => setSlug(event.target.value)} maxLength={120} placeholder="safety-tips" />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          {CMS_TYPES.map((option) => (
            <option key={option} value={option}>
              {formatEnum(option)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Body</span>
        <textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} maxLength={20000} />
      </label>
    </ConfirmDialog>
  );
}

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft', tone: 'warning' },
  { value: 'PUBLISHED', label: 'Published', tone: 'success' },
  { value: 'ARCHIVED', label: 'Archived', tone: 'muted' },
];

export default function CmsPage() {
  const { isAdmin } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', type: '', status: '' });
  const list = usePaginatedList(listCms, filters);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function setStatus(id, status) {
    setBusyId(id);
    try {
      await updateCms(id, { status });
      setNotice(`Content ${formatEnum(status).toLowerCase()}.`);
      list.reload();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Banners & CMS"
        subtitle="Banners, FAQs, tips, guidelines and static pages."
        actions={
          isAdmin && (
            <button type="button" className="button button--primary" onClick={() => setIsCreateOpen(true)}>
              New entry
            </button>
          )
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      <FilterToolbar
        label="Status"
        chips={STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all'}
            {...chip}
            selected={filters.status}
            onSelect={(status) => setFilters((current) => ({ ...current, status }))}
          />
        ))}
      >
        <form
          className="users-toolbar__form"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({ ...current, q: searchText.trim() }));
          }}
        >
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onClear={() => setFilters((current) => ({ ...current, q: '' }))}
            placeholder="Title or slug…"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
          <FilterSelect label="Type" value={filters.type} options={CMS_TYPES} onChange={(type) => setFilters((current) => ({ ...current, type }))} />
        </form>
      </FilterToolbar>

      <DataTablePanel title="CMS entries" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No CMS entries yet."
          columns={['Title', 'Slug', 'Type', 'Status', 'Updated', ...(isAdmin ? ['Actions'] : [])]}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>
                <Link to={`/cms/${item.id}`}>{item.title}</Link>
              </td>
              <td className="muted">{item.slug}</td>
              <td>{formatEnum(item.type)}</td>
              <td>
                <StatusBadge value={item.status} />
              </td>
              <td>{formatDateTime(item.updatedAt)}</td>
              {isAdmin && (
                <td className="stack-inline">
                  {item.status !== 'PUBLISHED' && (
                    <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'PUBLISHED')}>
                      Publish
                    </button>
                  )}
                  {item.status !== 'ARCHIVED' && (
                    <button type="button" className="button button--secondary button--small" disabled={busyId === item.id} onClick={() => setStatus(item.id, 'ARCHIVED')}>
                      Archive
                    </button>
                  )}
                </td>
              )}
            </tr>
          )}
        />
      </DataTablePanel>

      {isCreateOpen && (
        <CreateCmsDialog
          open
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            setNotice('Draft created.');
            list.reload();
          }}
        />
      )}
    </div>
  );
}
