import './StatusBadge.css';

const STATUS_MAP = {
  CONFIRMED: { label: 'Da xac nhan',   cls: 'a-badge-green'  },
  PENDING:   { label: 'Cho xac nhan',  cls: 'a-badge-orange' },
  CANCELLED: { label: 'Da huy',        cls: 'a-badge-red'    },
  USED:      { label: 'Da su dung',    cls: 'a-badge-purple' },
};

const StatusBadge = ({ status }) => {
  const info = STATUS_MAP[status] || { label: status, cls: 'a-badge-gray' };
  return <span className={`a-badge ${info.cls}`}>{info.label}</span>;
};

export default StatusBadge;
