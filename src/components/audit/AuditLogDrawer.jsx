// Side panel with the full details of one audit entry. Escape, close, or outside click dismisses it.

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatDateTime, formatEnum } from '../../utils/format.js';
import DetailList from '../DetailList.jsx';
import StatusBadge from '../StatusBadge.jsx';
import UserCell from '../UserCell.jsx';
import { AuditSummary, AuditTarget, AuditValue, getAuditChanges, getAuditFields } from './auditFormat.jsx';

export default function AuditLogDrawer({ log, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!log) return undefined;
    panelRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [log, onClose]);

  if (!log) return null;

  const changes = getAuditChanges(log);
  const fields = getAuditFields(log);

  return (
    <div className="side-panel-backdrop" onMouseDown={onClose}>
      <aside
        className="side-panel side-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-drawer-title"
        tabIndex={-1}
        ref={panelRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="side-panel__header">
          <div>
            <h2 id="audit-drawer-title">{formatEnum(log.action)}</h2>
            <p className="muted small">{formatDateTime(log.createdAt)}</p>
          </div>
          <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </header>

        <div className="side-panel__body drawer-stack">
          <section className="side-panel__section">
            <div className="audit-drawer-summary">
              <AuditSummary log={log} />
            </div>
            <DetailList
              rows={[
                [
                  'Staff member',
                  <span key="actor" className="audit-actor">
                    <UserCell user={log.actor} />
                    <StatusBadge value={log.actorRole} />
                  </span>,
                ],
                ['Action', <span key="action" className="audit-action-chip">{formatEnum(log.action)}</span>],
                ['Target type', formatEnum(log.targetType)],
                ['Target', <AuditTarget key="target" log={log} />],
                ['When', formatDateTime(log.createdAt)],
                ['Entry id', <code key="id">{log.id}</code>],
              ]}
            />
          </section>

          {changes.length > 0 && (
            <section className="side-panel__section">
              <h3>Changes</h3>
              <div className="table-wrap">
                <table className="table audit-changes">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((change) => (
                      <tr key={change.field}>
                        <td>{change.label}</td>
                        <td>
                          <AuditValue field={change.isStatus ? 'from' : change.field} value={change.from} log={log} />
                        </td>
                        <td>
                          <strong>
                            <AuditValue field={change.isStatus ? 'to' : change.field} value={change.to} log={log} />
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {fields.length > 0 && (
            <section className="side-panel__section">
              <h3>Details</h3>
              <DetailList rows={fields} />
            </section>
          )}

          <details className="side-panel__raw">
            <summary>Raw metadata</summary>
            <pre className="json">{JSON.stringify(log.metadata, null, 2)}</pre>
          </details>
        </div>
      </aside>
    </div>
  );
}
