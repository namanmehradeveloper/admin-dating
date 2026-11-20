// Wraps a paginated table: loading, error and empty states, the table itself and page controls.
// The table shell (headers) always renders so empty queues still look like a table view.
// `columns` may be strings or { key, label, node, className } objects.

import { useEffect, useRef } from 'react';
import ErrorState from './ErrorState.jsx';
import EmptyState from './EmptyState.jsx';
import LoadingState from './LoadingState.jsx';
import Pagination from './Pagination.jsx';

function columnKey(column, index) {
  if (typeof column === 'string') return column;
  return column.key ?? column.label ?? index;
}

function renderColumnHeader(column) {
  if (typeof column === 'string') return column;
  return column.node ?? column.label;
}

const COMPLEX_CELL = 'a, button, input, select, textarea, .badge, .user-cell, .action-menu, .status-switch, .stack-inline, .user-row-actions, .table-ellipsis';

function applyTruncationTooltips(root) {
  if (!root) return;

  root.querySelectorAll('tbody td').forEach((td) => {
    if (td.classList.contains('table__row--empty') || td.querySelector('.state, .empty-state')) {
      td.removeAttribute('title');
      return;
    }

    const complex = td.querySelector(COMPLEX_CELL);
    if (complex) {
      if (td.dataset.autoTitle === '1') {
        td.removeAttribute('title');
        delete td.dataset.autoTitle;
      }

      td.querySelectorAll('.user-cell__name, .user-cell__subtitle, .table-ellipsis').forEach((node) => {
        if (node.scrollWidth > node.clientWidth + 1) {
          const text = node.textContent?.trim();
          if (text) node.setAttribute('title', text);
        }
      });

      const plainName = td.querySelector('.user-cell > span:not(.avatar):not(.user-cell__text)');
      if (plainName && plainName.scrollWidth > plainName.clientWidth + 1) {
        const text = plainName.textContent?.trim();
        if (text) plainName.setAttribute('title', text);
      }
      return;
    }

    const text = td.textContent?.trim();
    if (text && td.scrollWidth > td.clientWidth + 1) {
      td.setAttribute('title', text);
      td.dataset.autoTitle = '1';
    } else if (td.dataset.autoTitle === '1') {
      td.removeAttribute('title');
      delete td.dataset.autoTitle;
    }
  });
}

export default function ListView({ list, columns, renderRow, emptyMessage, tableClassName = '', wrapClassName = '' }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => applyTruncationTooltips(wrapRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [list.items, list.isLoading, list.page, list.isLoadingMore, columns.length]);

  if (list.isLoading) {
    return (
      <div className="list-view list-view--loading" aria-busy="true">
        <LoadingState />
      </div>
    );
  }
  if (list.error && list.items.length === 0) return <ErrorState message={list.error} onRetry={list.reload} />;

  const isEmpty = list.items.length === 0;

  return (
    <div className={`list-view${list.isLoadingMore ? ' is-updating' : ''}`.trim()}>
      <div
        ref={wrapRef}
        className={`table-wrap table-wrap--data ${wrapClassName}`.trim()}
        tabIndex={0}
        role="region"
        aria-label="Data table, scroll horizontally to view all columns"
      >
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
      <Pagination list={list} />
    </div>
  );
}
