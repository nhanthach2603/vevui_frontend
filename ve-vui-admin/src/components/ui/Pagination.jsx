import './Pagination.css';

export default function Pagination({ page = 0, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="a-pagination">
      <button className="a-btn pg-btn" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>←</button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button key={i} className={`a-btn pg-btn ${i === page ? 'pg-active' : ''}`} onClick={() => onPageChange(i)}>
          {i + 1}
        </button>
      ))}
      <button className="a-btn pg-btn" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>→</button>
    </div>
  );
}
