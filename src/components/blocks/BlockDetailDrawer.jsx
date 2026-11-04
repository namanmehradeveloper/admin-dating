// Side panel for one block record: members, mutual flag, related match/reports.

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { getBlock } from '../../api/blocks.api.js';
import DetailList from '../DetailList.jsx';
import ErrorState from '../ErrorState.jsx';
import LoadingState from '../LoadingState.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime, formatEnum } from '../../utils/format.js';

export default function BlockDetailDrawer({ blockId, onClose }) {
  const detail = useApi(() => getBlock(blockId), [blockId], { poll: false });

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const block = detail.data;

  return (
    <div className="side-panel-backdrop" onMouseDown={onClose}>
      <aside
        className="side-panel side-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="side-panel__header">
          <div>
            <h2 id="block-drawer-title">Block detail</h2>
            {block && <p className="muted">{block.id}</p>}
          </div>
          <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="side-panel__body">
          {detail.isLoading && !block ? (
            <LoadingState />
          ) : detail.error && !block ? (
            <ErrorState message={detail.error} onRetry={detail.reload} />
          ) : block ? (
            <div className="drawer-stack">
              <section>
                <h3>Members</h3>
                <div className="stack-inline" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <p className="muted small">Blocker</p>
                    <div className="stack-inline">
                      <UserCell user={block.blocker} />
                      <Link className="button button--secondary button--small" to={`/users/${block.blocker.id}`}>
                        <ExternalLink size={14} aria-hidden />
                        User
                      </Link>
                    </div>
                  </div>
                  <div>
                    <p className="muted small">Blocked</p>
                    <div className="stack-inline">
                      <UserCell user={block.blocked} />
                      <Link className="button button--secondary button--small" to={`/users/${block.blocked.id}`}>
                        <ExternalLink size={14} aria-hidden />
                        User
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <DetailList
                rows={[
                  ['Created', formatDateTime(block.createdAt)],
                  ['Mutual block', block.mutual ? 'Yes' : 'No'],
                  ['Open reports between', block.openReportsBetween],
                  [
                    'Related match',
                    block.match ? (
                      <span key="match">
                        <StatusBadge value={block.match.status} />{' '}
                        {block.match.endedReason ? formatEnum(block.match.endedReason) : ''} · {block.match.id}
                      </span>
                    ) : (
                      'None'
                    ),
                  ],
                ]}
              />

              <p className="muted small">{block.policyNote}</p>

              <section>
                <h3>Related reports</h3>
                {(block.reports ?? []).length === 0 ? (
                  <p className="muted">No reports between these members.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table data-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Reason</th>
                          <th>Reporter</th>
                          <th>Opened</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.reports.map((report) => (
                          <tr key={report.id}>
                            <td>
                              <StatusBadge value={report.status} />
                            </td>
                            <td>{formatEnum(report.reason)}</td>
                            <td>
                              <UserCell user={report.reporter} />
                            </td>
                            <td>
                              <Link to={`/reports/${report.id}`}>{formatDateTime(report.createdAt)}</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
