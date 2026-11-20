// Shared admin table pager: range summary, page-size select, first/prev/numbered/next/last.
// Hides itself when there is only one page and the dataset is smaller than the page size
// (unless the caller already advanced past page 1).

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../hooks/usePaginatedList.js';

function buildPageItems(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, current]);
  for (let offset = 1; offset <= 1; offset += 1) {
    if (current - offset > 1) pages.add(current - offset);
    if (current + offset < totalPages) pages.add(current + offset);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) items.push('ellipsis');
    items.push(page);
    previous = page;
  }
  return items;
}

export default function Pagination({ list }) {
  const {
    page = 1,
    pageSize = 25,
    total = null,
    totalPages = 1,
    items = [],
    hasPrev,
    hasMore,
    isLoadingMore,
    goPrev,
    goNext,
    goToPage,
    setPageSize,
    goFirst,
    goLast,
  } = list;

  const knownTotal = typeof total === 'number';
  const resolvedTotalPages = knownTotal ? Math.max(1, totalPages || 1) : null;
  const from = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = items.length === 0 ? 0 : (page - 1) * pageSize + items.length;

  const canPrev = Boolean(hasPrev) && !isLoadingMore;
  const canNext = Boolean(hasMore) && !isLoadingMore;
  const showPager = items.length > 0 && (canPrev || canNext || page > 1 || (knownTotal && total > pageSize));

  if (!showPager) return null;

  const pageItems = resolvedTotalPages ? buildPageItems(page, resolvedTotalPages) : [];
  const showNumbered = Boolean(goToPage && resolvedTotalPages && resolvedTotalPages > 1);
  const showEnds = Boolean(goFirst && goLast && resolvedTotalPages && resolvedTotalPages > 1);

  return (
    <div className="table-pagination" aria-label="Pagination">
      <div className="table-pagination__meta">
        {knownTotal ? (
          <p className="table-pagination__summary">
            Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>
          </p>
        ) : (
          <p className="table-pagination__summary">
            Page <strong>{page}</strong>
            <span className="table-pagination__dot" aria-hidden>
              ·
            </span>
            {items.length} shown
          </p>
        )}
        {isLoadingMore ? <span className="table-pagination__loading">Updating…</span> : null}
        {typeof setPageSize === 'function' ? (
          <label className="table-pagination__size">
            <span className="table-pagination__size-label">Rows</span>
            <select
              className="table-pagination__size-select"
              value={pageSize}
              disabled={isLoadingMore}
              onChange={(event) => setPageSize(Number(event.target.value))}
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="table-pagination__actions">
        {showEnds ? (
          <button
            type="button"
            className="button button--secondary button--small table-pagination__btn table-pagination__btn--icon"
            onClick={goFirst}
            disabled={!canPrev}
            aria-label="First page"
            title="First page"
          >
            <ChevronsLeft size={16} strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}

        <button
          type="button"
          className="button button--secondary button--small table-pagination__btn"
          onClick={goPrev}
          disabled={!canPrev}
        >
          <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
          Previous
        </button>

        {showNumbered ? (
          <div className="table-pagination__pages" role="navigation" aria-label="Page numbers">
            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`e-${index}`} className="table-pagination__ellipsis" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`button button--small table-pagination__page${item === page ? ' is-active' : ' button--secondary'}`}
                  onClick={() => goToPage(item)}
                  disabled={isLoadingMore || item === page}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        ) : (
          <span className="table-pagination__page-label">Page {page}</span>
        )}

        <button
          type="button"
          className="button button--secondary button--small table-pagination__btn"
          onClick={goNext}
          disabled={!canNext}
        >
          Next
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
        </button>

        {showEnds ? (
          <button
            type="button"
            className="button button--secondary button--small table-pagination__btn table-pagination__btn--icon"
            onClick={goLast}
            disabled={!canNext}
            aria-label="Last page"
            title="Last page"
          >
            <ChevronsRight size={16} strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
