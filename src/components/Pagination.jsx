// Page buttons under the questions table: Previous, the page numbers (with
// "..." when there are many) and Next, plus which questions are showing.

// Page numbers to show: the first, the last, and the ones around the
// current page. null marks a gap.
function pageList(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const list = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) list.push(null);
    list.push(p);
  });
  return list;
}

const Chevron = ({ left }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={left ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
);

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="Question pages">
      <span className="pagination-info">
        Showing {first} to {last} of {total}
      </span>

      <div className="pagination-buttons">
        <button
          type="button"
          className="page-btn page-step"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <Chevron left />
          <span className="page-step-label">Previous</span>
        </button>

        {pageList(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="page-gap">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`page-btn${p === page ? ' is-active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="page-btn page-step"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <span className="page-step-label">Next</span>
          <Chevron />
        </button>
      </div>
    </nav>
  );
}
