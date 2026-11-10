// Wraps a paginated table: loading, error and empty states, the table itself and page controls.
// The table shell (headers) always renders so empty queues still look like a table view.
// `columns` may be strings or { key, label, node, className } objects.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorState from './ErrorState.jsx';
import EmptyState from './EmptyState.jsx';
import LoadingState from './LoadingState.jsx';

function columnKey(column, index) {
  if (typeof column === 'string') return column;
  return column.key ?? column.label ?? index;
}

function renderColumnHeader(column) {
  if (typeof column === 'string') return column;
  return column.node ?? column.label;
}

export default function ListView({ list, columns, renderRow, emptyMessage, tableClassName = '', wrapClassName = '' }) {
  if (list.isLoading) return <LoadingState />;
  if (list.error && list.items.length === 0) return <ErrorState message={list.error} onRetry={list.reload} />;

  const isEmpty = list.items.length === 0;
  const showPager = !isEmpty && (list.hasPrev || list.hasMore || list.page > 1);
  const canPrev = Boolean(list.hasPrev) && !list.isLoadingMore;
  const canNext = Boolean(list.hasMore) && !list.isLoadingMore;

  return (
    <>
      <div className={`table-wrap table-wrap--data ${wrapClassName}`.trim()} tabIndex={0} role="region" aria-label="Data table, scroll horizontally to view all columns">
        <table className={`table data-table ${tableClassName}`.trim()}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th scope="col" key={columnKey(column, index)} className={typeof column === 'object' ? column.className : undefined}>
                  {renderColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr className="table__row--empty">
                <td colSpan={columns.length}><EmptyState message={emptyMessage} /></td>
              </tr>
            ) : (
              list.items.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
      {list.error && <ErrorState message={list.error} />}
      {showPager && (
        <div className="table-pagination">
          <p className="table-pagination__meta">
            Page {list.page}
            <span className="table-pagination__dot" aria-hidden>
              ·
            </span>
            {list.items.length} shown
            {list.isLoadingMore ? <span className="table-pagination__loading">Updating…</span> : null}
          </p>
          <div className="table-pagination__actions">
            <button
              type="button"
              className="button button--secondary button--small table-pagination__btn"
              onClick={list.goPrev}
              disabled={!canPrev}
            >
              <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
              Previous
            </button>
            <button
              type="button"
              className="button button--secondary button--small table-pagination__btn"
              onClick={list.goNext}
              disabled={!canNext}
            >
              Next
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
