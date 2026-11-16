// Virtual goods catalogue — coin packs, emoji packs, gifts (ADMIN only).

import { useState } from 'react';
import { createStoreItem, listStoreItems, listStorePurchases, updateStoreItem } from '../api/store.api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTablePanel from '../components/DataTablePanel.jsx';
import FilterToolbar, { FilterChip } from '../components/FilterToolbar.jsx';
import ListView from '../components/ListView.jsx';
import Notice from '../components/Notice.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { getErrorMessage } from '../utils/errors.js';
import { formatDate, formatEnum } from '../utils/format.js';

const KIND_CHIPS = [
  { value: '', label: 'All' },
  { value: 'COIN_PACK', label: 'Coins' },
  { value: 'EMOJI_PACK', label: 'Emoji packs' },
  { value: 'GIFT', label: 'Gifts' },
];

const ACTIVE_CHIPS = [
  { value: '', label: 'Any status' },
  { value: 'true', label: 'Active', tone: 'success' },
  { value: 'false', label: 'Inactive', tone: 'muted' },
];

function CreateItemDialog({ open, onClose, onCreated }) {
  const [id, setId] = useState('');
  const [kind, setKind] = useState('GIFT');
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [priceCoins, setPriceCoins] = useState(25);
  const [priceMoneyMinor, setPriceMoneyMinor] = useState(4900);
  const [coinAmount, setCoinAmount] = useState(100);
  const [emojis, setEmojis] = useState('💕,💖,💗');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    setIsSaving(true);
    setError(null);
    try {
      const body = {
        id: id.trim(),
        kind,
        title: title.trim(),
        emoji: emoji.trim(),
        isActive: true,
        sortOrder: 200,
      };
      if (kind === 'COIN_PACK') {
        body.priceMoneyMinor = Number(priceMoneyMinor);
        body.coinAmount = Number(coinAmount);
        body.currency = 'INR';
      } else {
        body.priceCoins = Number(priceCoins);
      }
      if (kind === 'EMOJI_PACK') {
        body.emojis = emojis
          .split(/[,\s]+/)
          .map((part) => part.trim())
          .filter(Boolean);
      }
      onCreated(await createStoreItem(body));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title="Add store item"
      confirmLabel="Create"
      isBusy={isSaving}
      error={error}
      confirmDisabled={!id.trim() || !title.trim()}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <label className="field">
        <span>Item ID</span>
        <input value={id} onChange={(event) => setId(event.target.value)} placeholder="gift_balloon" />
      </label>
      <label className="field">
        <span>Kind</span>
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="GIFT">Gift</option>
          <option value="EMOJI_PACK">Emoji pack</option>
          <option value="COIN_PACK">Coin pack</option>
        </select>
      </label>
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field">
        <span>Emoji</span>
        <input value={emoji} onChange={(event) => setEmoji(event.target.value)} maxLength={8} />
      </label>
      {kind === 'COIN_PACK' ? (
        <>
          <label className="field">
            <span>Price (paise)</span>
            <input type="number" value={priceMoneyMinor} onChange={(event) => setPriceMoneyMinor(event.target.value)} min={0} />
          </label>
          <label className="field">
            <span>Coins credited</span>
            <input type="number" value={coinAmount} onChange={(event) => setCoinAmount(event.target.value)} min={1} />
          </label>
        </>
      ) : (
        <label className="field">
          <span>Price (coins)</span>
          <input type="number" value={priceCoins} onChange={(event) => setPriceCoins(event.target.value)} min={0} />
        </label>
      )}
      {kind === 'EMOJI_PACK' && (
        <label className="field">
          <span>Emojis (comma-separated)</span>
          <input value={emojis} onChange={(event) => setEmojis(event.target.value)} />
        </label>
      )}
    </ConfirmDialog>
  );
}

export default function StorePage() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ q: '', kind: '', isActive: '' });
  const list = usePaginatedList(listStoreItems, filters);
  const purchases = usePaginatedList(listStorePurchases, {});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function toggleActive(item) {
    setBusyId(item.id);
    try {
      await updateStoreItem(item.id, { isActive: !item.isActive });
      setNotice(item.isActive ? 'Item disabled.' : 'Item enabled.');
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
        title="Virtual store"
        subtitle="Coin packs, emoji packs, and gifts members can send in chat."
        actions={
          <button type="button" className="button button--primary" onClick={() => setIsCreateOpen(true)}>
            Add item
          </button>
        }
      />
      <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>

      <FilterToolbar
        label="Kind"
        chips={KIND_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value || 'all-kind'}
            {...chip}
            selected={filters.kind}
            onSelect={(kind) => setFilters((current) => ({ ...current, kind }))}
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
            placeholder="Search item id or title"
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </form>
      </FilterToolbar>

      <FilterToolbar
        label="Status"
        chips={ACTIVE_CHIPS.map((chip) => (
          <FilterChip
            key={`active-${chip.value || 'any'}`}
            {...chip}
            selected={filters.isActive}
            onSelect={(isActive) => setFilters((current) => ({ ...current, isActive }))}
          />
        ))}
      />

      <DataTablePanel title="Catalogue" subtitle={list.isLoading ? 'Loading…' : `Page ${list.page} · ${list.items.length} shown`}>
        <ListView
          list={list}
          emptyMessage="No store items yet."
          columns={['Item', 'Kind', 'Price', 'Status', 'Actions']}
          renderRow={(item) => (
            <tr key={item.id}>
              <td>
                <strong>
                  {item.emoji || '•'} {item.title}
                </strong>
                <div className="muted">{item.id}</div>
              </td>
              <td>{formatEnum(item.kind)}</td>
              <td>{item.priceLabel || `${item.priceCoins || 0} coins`}</td>
              <td>
                <StatusBadge value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </td>
              <td>
                <button
                  type="button"
                  className="button button--secondary button--small"
                  disabled={busyId === item.id}
                  onClick={() => void toggleActive(item)}
                >
                  {item.isActive ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          )}
        />
      </DataTablePanel>

      <DataTablePanel title="Recent purchases" subtitle={purchases.isLoading ? 'Loading…' : `${purchases.items.length} shown`}>
        <ListView
          list={purchases}
          emptyMessage="No store purchases yet."
          columns={['When', 'User', 'Item', 'Status', 'Coins Δ']}
          renderRow={(row) => (
            <tr key={row.id}>
              <td>{formatDate(row.createdAt)}</td>
              <td>{row.userId}</td>
              <td>{row.itemId}</td>
              <td>
                <StatusBadge value={row.status} />
              </td>
              <td>{row.coinsDelta}</td>
            </tr>
          )}
        />
      </DataTablePanel>

      {isCreateOpen && (
        <CreateItemDialog
          open
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            setNotice('Store item created.');
            list.reload();
          }}
        />
      )}
    </div>
  );
}
