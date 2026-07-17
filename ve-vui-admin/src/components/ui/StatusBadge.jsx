import './StatusBadge.css';

const STATUS_MAP = {
  SCHEDULED: { label: 'Đã đặt lịch',   cls: 'a-badge-blue'   },
  CONFIRMED: { label: 'Đã xác nhận',   cls: 'a-badge-green'  },
  PENDING:   { label: 'Chờ xác nhận',  cls: 'a-badge-orange' },
  CANCELLED: { label: 'Đã hủy',        cls: 'a-badge-red'    },
  COMPLETED: { label: 'Hoàn thành',    cls: 'a-badge-green'  },
  DEPARTED:  { label: 'Đã khởi hành',  cls: 'a-badge-blue'   },
  USED:      { label: 'Đã sử dụng',    cls: 'a-badge-purple' },
  ACTIVE:    { label: 'Đang hoạt động', cls: 'a-badge-green'  },
  INACTIVE:  { label: 'Ngừng hoạt động', cls: 'a-badge-gray'   },
  BANNED:    { label: 'Bị khóa',        cls: 'a-badge-red'    },
  published: { label: 'Đã xuất bản',   cls: 'a-badge-green'  },
  draft:     { label: 'Bản nháp',       cls: 'a-badge-gray'   },
  DRAFT:     { label: 'Bản nháp',       cls: 'a-badge-gray'   },
  PUBLISHED: { label: 'Đã xuất bản',   cls: 'a-badge-green'  },
};

const StatusBadge = ({ status }) => {
  const info = STATUS_MAP[status] || { label: status, cls: 'a-badge-gray' };
  return <span className={`a-badge ${info.cls}`}>{info.label}</span>;
};

export default StatusBadge;
