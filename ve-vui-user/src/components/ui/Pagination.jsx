import './Pagination.css';

export default function Pagination({ page = 0, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="uv-pagination">
      <button className="uv-pg-btn" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
        ←
      </button>
      {getPages().map(i => (
        <button
          key={i}
          className={`uv-pg-btn ${i === page ? 'uv-pg-active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i + 1}
        </button>
      ))}
      <button className="uv-pg-btn" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
        →
      </button>
    </div>
  );
}
