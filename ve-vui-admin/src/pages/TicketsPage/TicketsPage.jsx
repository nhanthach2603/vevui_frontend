// pages/TicketsPage/TicketsPage.jsx
import { useEffect, useState } from 'react';
import { FiSearch, FiDownload, FiEye, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { tickets as initialTickets, getRoute, formatPrice } from '../../services/adminData';

const PAYMENT_LABELS = {
  transfer: 'Chuyển khoản',
  momo:     'MoMo',
  vnpay:    'VNPay',
  zalopay:  'ZaloPay',
};

const TicketsPage = () => {
  const [tickets, setTickets]     = useState(initialTickets);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [viewItem, setView]       = useState(null);

  useEffect(() => { document.title = 'Vé đặt | Vé Vui Admin'; }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCancel = (id) => {
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status: 'cancelled' } : t));
    setView(null);
  };

  const handleConfirm = (id) => {
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status: 'confirmed' } : t));
  };

  const totalRevenue = tickets.filter(t=>t.status==='confirmed').reduce((s,t)=>s+t.totalPrice,0);

  const exportCSV = () => {
    const headers = ['Mã vé','Hành khách','SĐT','Tuyến','Ghế','Tổng tiền','Phương thức','Trạng thái','Ngày đặt'];
    const rows = filtered.map(t => {
      const route = getRoute(t.routeId);
      return [
        t.id, t.customerName, t.phone,
        `${route?.from} → ${route?.to}`,
        t.seats.join(' '),
        t.totalPrice,
        PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod,
        t.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy',
        new Date(t.bookedAt).toLocaleString('vi-VN'),
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ve-vui-danh-sach-ve-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Vé đặt">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý vé</h1>
          <p className="page-subtitle">
            {tickets.length} vé · {tickets.filter(t=>t.status==='confirmed').length} xác nhận · Doanh thu: <strong style={{color:'var(--primary)'}}>{formatPrice(totalRevenue)}</strong>
          </p>
        </div>
        <button className="a-btn a-btn-ghost" onClick={exportCSV} id="export-tickets">
          <FiDownload size={15}/> Xuất CSV
        </button>
      </div>

      {/* Filters */}
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem', display:'flex', gap:'var(--sp-4)', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:220 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tìm mã vé, tên, SĐT..." value={search} onChange={e=>setSearch(e.target.value)} id="ticket-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[['all','Tất cả'],['confirmed','Đã xác nhận'],['cancelled','Đã hủy']].map(([v,l]) => (
              <button key={v} className={`a-btn a-btn-sm ${statusFilter===v?'a-btn-primary':'a-btn-ghost'}`} onClick={() => setStatus(v)} id={`filter-${v}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Mã vé</th><th>Hành khách</th><th>Tuyến</th><th>Ghế</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const route = getRoute(t.routeId);
                return (
                  <tr key={t.id}>
                    <td><code style={{ fontFamily:'monospace', fontWeight:800, color:'var(--primary)', letterSpacing:1 }}>{t.id}</code></td>
                    <td>
                      <div style={{ fontWeight:700 }}>{t.customerName}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{t.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight:600 }}>{route?.from?.replace('TP. Hồ Chí Minh','HCM')}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>→ {route?.to}</div>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {t.seats.map(s => (
                          <span key={s} style={{ background:'var(--primary-bg)', color:'var(--primary-dark)', padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:'0.75rem', fontWeight:700 }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.totalPrice)}</td>
                    <td><span className="a-badge a-badge-blue">{PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod}</span></td>
                    <td>
                      <span className={`a-badge ${t.status==='confirmed'?'a-badge-green':'a-badge-red'}`}>
                        {t.status==='confirmed'?'Đã xác nhận':'Đã hủy'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setView(t)} title="Xem chi tiết" id={`view-ticket-${t.id}`}><FiEye size={14}/></button>
                        {t.status === 'confirmed' && (
                          <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" style={{ color:'var(--danger)' }} onClick={() => handleCancel(t.id)} title="Hủy vé" id={`cancel-ticket-${t.id}`}><FiXCircle size={14}/></button>
                        )}
                        {t.status === 'cancelled' && (
                          <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" style={{ color:'var(--success)' }} onClick={() => handleConfirm(t.id)} title="Khôi phục" id={`restore-ticket-${t.id}`}><FiCheckCircle size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--gray-400)' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎫</div>
              <p>Không tìm thấy vé nào</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setView(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Chi tiết vé {viewItem.id}</div>
              <button className="modal-close" onClick={() => setView(null)}>×</button>
            </div>
            <div className="modal-body">
              {[
                ['Hành khách', viewItem.customerName],
                ['Số điện thoại', viewItem.phone],
                ['Tuyến', `${getRoute(viewItem.routeId)?.from} → ${getRoute(viewItem.routeId)?.to}`],
                ['Ghế', viewItem.seats.join(', ')],
                ['Tổng tiền', formatPrice(viewItem.totalPrice)],
                ['Thanh toán', PAYMENT_LABELS[viewItem.paymentMethod]],
                ['Trạng thái', viewItem.status === 'confirmed' ? '✅ Đã xác nhận' : '❌ Đã hủy'],
                ['Ngày đặt', new Date(viewItem.bookedAt).toLocaleString('vi-VN')],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--gray-100)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setView(null)}>Đóng</button>
              {viewItem.status === 'confirmed' && (
                <button className="a-btn a-btn-danger" onClick={() => handleCancel(viewItem.id)}>Hủy vé</button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TicketsPage;
