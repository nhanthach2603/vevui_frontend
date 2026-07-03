import './ConfirmDialog.css';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-modal" onClick={e => e.stopPropagation()}>
        <div className="cd-icon">⚠️</div>
        <p className="cd-message">{message}</p>
        <div className="cd-actions">
          <button className="a-btn cd-cancel" onClick={onCancel}>Hủy</button>
          <button className="a-btn a-btn-primary cd-confirm" onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}
