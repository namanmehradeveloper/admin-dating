// Side panel for one mutual match: members, status history, chat conversion, reports.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { endMatch, getMatch } from '../../api/matches.api.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import DetailList from '../DetailList.jsx';
import ErrorState from '../ErrorState.jsx';
import LoadingState from '../LoadingState.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatDateTime, formatEnum, formatNumber } from '../../utils/format.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'reports', label: 'Reports' },
];

export default function MatchDetailDrawer({ matchId, onClose, onChanged }) {
  const { isAdmin } = useAuth();
  const detail = useApi(() => getMatch(matchId), [matchId], { poll: false });
  const [tab, setTab] = useState('overview');
  const [notice, setNotice] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTab('overview');
    setNotice(null);
    setConfirmEnd(false);
    setError(null);
  }, [matchId]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleEnd() {
    setBusy(true);
    setError(null);
    try {
      const updated = await endMatch(matchId, { reason: 'MODERATION' });
      detail.setData(updated);
      setConfirmEnd(false);
      setNotice('Match ended. Both members were notified (no reason shown to them).');
      onChanged?.('Match ended by moderation.');
    } catch (endError) {
      setError(getErrorMessage(endError));
    } finally {
      setBusy(false);
    }
  }

  const match = detail.data;

  return (
    <div className="side-panel-backdrop" onMouseDown={onClose}>
      <aside
        className="side-panel side-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="side-panel__header">
          <div>
            <h2 id="match-drawer-title">Match detail</h2>
            {match && (
              <p className="muted">
                <StatusBadge value={match.status} /> · <StatusBadge value={match.lifecycle} /> · {match.id}
              </p>
            )}
          </div>
          <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="drawer-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`drawer-tabs__tab ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="side-panel__body">
          {notice && <p className="drawer-notice">{notice}</p>}
          {detail.isLoading && !match ? (
            <LoadingState />
          ) : detail.error && !match ? (
            <ErrorState message={detail.error} onRetry={detail.reload} />
          ) : match ? (
            <>
              {tab === 'overview' && (
                <div className="drawer-stack">
                  <section>
                    <h3>Members</h3>
                    <div className="stack-inline" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                      {(match.users ?? []).map((user, index) => (
                        <div key={user?.id ?? index} className="stack-inline">
                          <UserCell user={user} />
                          {user?.id ? (
                            <Link className="button button--secondary button--small" to={`/users/${user.id}`}>
                              <ExternalLink size={14} aria-hidden />
                              User
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>

                  <DetailList
                    rows={[
                      ['Lifecycle', <StatusBadge key="life" value={match.lifecycle} />],
                      ['Algorithm', match.algorithmVersion],
                      ['Compatibility', match.compatibilityScore != null ? `${formatNumber(match.compatibilityScore)}` : '—'],
                      ['Messages', match.messageCount],
                      ['Chat started', match.chatStarted ? 'Yes' : 'No'],
                      ['Matched', formatDateTime(match.matchedAt)],
                      ['Expires', match.expiresAt ? formatDateTime(match.expiresAt) : 'Never'],
                      ['Ended', match.endedAt ? formatDateTime(match.endedAt) : '—'],
                      ['End reason', match.endedReason ? formatEnum(match.endedReason) : '—'],
                      ['Conversation', match.conversationId ?? '—'],
                    ]}
                  />

                  {isAdmin && match.status === 'ACTIVE' && (
                    <div className="form-grid__actions">
                      <button type="button" className="button button--danger" onClick={() => setConfirmEnd(true)}>
                        End match (moderation)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tab === 'history' && (
                <div className="drawer-stack">
                  <h3>Status history</h3>
                  {(match.statusHistory ?? []).length === 0 ? (
                    <p className="muted">No history recorded for this match yet.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table data-table">
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Reason</th>
                            <th>Actor</th>
                            <th>When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {match.statusHistory.map((entry, index) => (
                            <tr key={`${entry.at}-${index}`}>
                              <td>
                                <StatusBadge value={entry.status} />
                              </td>
                              <td>{entry.reason ? formatEnum(entry.reason) : '—'}</td>
                              <td>{entry.actorId ?? '—'}</td>
                              <td>{formatDateTime(entry.at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'reports' && (
                <div className="drawer-stack">
                  <h3>Related reports</h3>
                  <p className="muted small">Reports between these two members (moderation history). Message text is never shown.</p>
                  {(match.reports ?? []).length === 0 ? (
                    <p className="muted">No reports between these members.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table data-table">
                        <thead>
                          <tr>
                            <th>Report</th>
                            <th>Status</th>
                            <th>Reason</th>
                            <th>Reporter</th>
                            <th>Target</th>
                            <th>Opened</th>
                          </tr>
                        </thead>
                        <tbody>
                          {match.reports.map((report) => (
                            <tr key={report.id}>
                              <td>
                                <Link to={`/reports/${encodeURIComponent(report.id)}`}>{report.id}</Link>
                              </td>
                              <td>
                                <StatusBadge value={report.status} />
                              </td>
                              <td>{formatEnum(report.reason)}</td>
                              <td>
                                <UserCell user={report.reporter} />
                              </td>
                              <td>
                                <UserCell user={report.targetUser} />
                              </td>
                              <td>{formatDateTime(report.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {confirmEnd && (
          <ConfirmDialog
            open
            title="End this match?"
            message="Closes the conversation and notifies both members. The reason is not shown to them. This is audited."
            confirmLabel="End match"
            isBusy={busy}
            error={error}
            onConfirm={handleEnd}
            onCancel={() => {
              setConfirmEnd(false);
              setError(null);
            }}
          />
        )}
      </aside>
    </div>
  );
}
