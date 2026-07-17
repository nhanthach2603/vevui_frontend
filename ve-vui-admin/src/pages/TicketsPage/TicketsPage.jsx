// pages/TicketsPage/TicketsPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { FiDownload, FiEye, FiChevronDown } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchTickets, fetchTicketById, searchTicketsAdmin, cancelTicket, updateTicketStatus, exportTickets, formatPrice } from '../../services/apiService';
import StatusBadge from '../../components/ui/StatusBadge';
import SearchInput from '../../components/ui/SearchInput';

const PAYMENT_LABELS = {
  transfer: 'Chuyen khoan', TRANSFER: 'Chuyen khoan',
  momo: 'MoMo', MOMO: 'MoMo',
  vnpay: 'VNPay', VNPAY: 'VNPay',
  zalopay: 'ZaloPay', ZALOPAY: 'ZaloPay',
};

const TicketsPage = () => {
  const [tickets, setTickets]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatus]         = useState('all');
  const [viewItem, setView]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId]       = useState(null);
  const [openDropdown, setOpenDropdown]   = useState(null);

  useEffect(() => { document.title = 'Ve dat | Ve Vui Admin'; }, []);

  useEffect(() => {
    fetchTickets(0, 100).then(data => {
      setTickets(data?.content || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((q) => {
    setSearch(q);
    if (!q.trim()) {
      fetchTickets(0, 100).then(data => setTickets(data?.content || [])).catch(() => {});
      return;
    }
    setLoading(true);
    searchTicketsAdmin(q).then(data => {
      setTickets(data?.content || data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      String(t.id).toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.phone || '').includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCancel = async (id) => {
    try {
      const updated = await cancelTicket(id);
      setTickets(ts => ts.map(t => t.id === id ? { ...t, status: updated?.status || 'CANCELLED' } : t));
      setView(v => v && v.id === id ? { ...v, status: updated?.status || 'CANCELLED' } : v);
    } catch (e) { alert('Loi: ' + e.message); }
    setView(null);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const updated = await updateTicketStatus(id, newStatus);
      setTickets(ts => ts.map(t => t.id === id ? { ...t, status: updated?.status || newStatus } : t));
      setView(v => v && v.id === id ? { ...v, status: updated?.status || newStatus } : v);
    } catch (e) { alert('Loi cap nhat trang thai: ' + e.message); }
    setUpdatingId(null);
    setOpenDropdown(null);
  };

  const handleView = async (ticket) => {
    setView(ticket);
    setDetailLoading(true);
    try {
      const full = await fetchTicketById(ticket.id);
      if (full) setView(full);
    } catch (_) {}
    setDetailLoading(false);
  };

  useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openDropdown]);

  const totalRevenue = tickets.filter(t => t.status === 'CONFIRMED').reduce((s, t) => s + (t.totalPrice || 0), 0);

  const exportCSV = async () => {
    try {
      const data = await exportTickets();
      const list = data?.content || data || [];
      const headers = ['Ma ve','Hanh khach','SDT','Tuyen','Ghe','Tong tien','Phuong thuc','Trang thai','Ngay dat'];
      const rows = (Array.isArray(list) ? list : []).map(t => [
        t.id, t.customerName, t.phone,
        `${t.fromCity || ''} - ${t.toCity || ''}`,
        (t.seatNumbers || t.seats || []).join(' '),
        t.totalPrice,
        PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod,
        t.status,
        t.bookedAt ? new Date(t.bookedAt).toLocaleString('vi-VN') : '',
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ve-vui-ve-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert('Loi xuat CSV: ' + e.message);
    }
  };

  return (
    <AdminLayout title="Ve dat">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quan ly ve</h1>
          <p className="page-subtitle">
            {tickets.length} ve · {tickets.filter(t=>t.status==='CONFIRMED').length} xac nhan · Doanh thu: <strong style={{color:'var(--primary)'}}>{formatPrice(totalRevenue)}</strong>
          </p>
        </div>
        <button className="a-btn a-btn-ghost" onClick={exportCSV} id="export-tickets">
          <FiDownload size={15}/> Xuat CSV
        </button>
      </div>

      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body card-filter-body">
          <div className="filter-bar" style={{ gap:'var(--sp-4)', flexWrap:'wrap', alignItems:'center' }}>
            <SearchInput value={search} onChange={handleSearch} placeholder="Tim ma ve, ten, SDT..." id="ticket-search" />
            <div className="filter-bar filter-group" style={{ flexWrap:'wrap' }}>
            {[['all','Tat ca'],['PENDING','Cho xac nhan'],['CONFIRMED','Da xac nhan'],['CANCELLED','Da huy'],['USED','Da su dung']].map(([v,l]) => (
              <button key={v} className={`a-btn a-btn-sm ${statusFilter===v?'a-btn-primary':'a-btn-ghost'}`} onClick={() => setStatus(v)} id={`filter-${v}`}>{l}</button>
            ))}
          </div>
          </div>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Ma ve</th><th>Hanh khach</th><th>Tuyen</th><th>Ghe</th><th>Tong tien</th><th>Thanh toan</th><th>Trang thai</th><th>Thao tac</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:'3rem', color:'var(--gray-400)' }}>
                  <p>Khong tim thay ve nao</p>
                </td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><code style={{ fontFamily:'monospace', fontWeight:800, color:'var(--primary)', letterSpacing:1 }}>{t.id}</code></td>
                  <td>
                    <div style={{ fontWeight:700 }}>{t.customerName}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{t.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{(t.fromCity || '')}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>to {t.toCity}</div>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {(t.seatNumbers || t.seats || []).map(s => (
                        <span key={s} style={{ background:'var(--primary-bg)', color:'var(--primary-dark)', padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:'0.75rem', fontWeight:700 }}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.totalPrice)}</td>
                  <td><span className="a-badge a-badge-blue">{PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod}</span></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <div className="action-row" style={{ alignItems:'center', position:'relative' }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => handleView(t)} title="Xem chi tiet" id={`view-ticket-${t.id}`}><FiEye size={14}/></button>
                      <div style={{ position:'relative' }}>
                        <button
                          className="a-btn a-btn-ghost a-btn-sm"
                          onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === t.id ? null : t.id); }}
                          disabled={updatingId === t.id}
                          id={`status-dropdown-${t.id}`}
                          style={{ fontSize:'0.75rem', display:'flex', alignItems:'center', gap:3 }}
                        >
                          {updatingId === t.id ? '...' : 'Doi trang thai'} <FiChevronDown size={12}/>
                        </button>
                        {openDropdown === t.id && (
                          <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:'100%', right:0, background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'var(--r-md)', boxShadow:'var(--sh-md)', zIndex:50, minWidth:150, padding:'4px 0' }}>
                            {['PENDING','CONFIRMED','CANCELLED','USED'].map(s => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(t.id, s)}
                                style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 12px', fontSize:'0.8rem', border:'none', background:'none', cursor:'pointer', fontWeight: t.status === s ? 700 : 400, color: t.status === s ? 'var(--primary)' : 'var(--gray-700)' }}
                                onMouseEnter={e => e.target.style.background = 'var(--gray-50)'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                              >
                                {s === 'PENDING' ? 'Cho xac nhan' : s === 'CONFIRMED' ? 'Da xac nhan' : s === 'CANCELLED' ? 'Da huy' : 'Da su dung'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setView(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Chi tiet ve {viewItem.id}</div>
              <button className="modal-close" onClick={() => setView(null)}>x</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <p style={{ textAlign:'center', color:'var(--gray-400)', padding:'2rem' }}>Dang tai...</p>
              ) : (
                <>
                  {[
                    ['Ma ve', viewItem.id],
                    ['Hanh khach', viewItem.customerName],
                    ['So dien thoai', viewItem.phone],
                    ['Email', viewItem.email || '-'],
                    ['Tuyen', `${viewItem.fromCity || ''} - ${viewItem.toCity || ''}`],
                    ['Diem di', viewItem.fromCity || '-'],
                    ['Diem den', viewItem.toCity || '-'],
                    ['Ghe', (viewItem.seatNumbers || viewItem.seats || []).join(', ')],
                    ['So luong ghe', (viewItem.seatNumbers || viewItem.seats || []).length],
                    ['Tong tien', formatPrice(viewItem.totalPrice)],
                    ['Don gia', formatPrice(viewItem.price)],
                    ['Thanh toan', PAYMENT_LABELS[viewItem.paymentMethod] || viewItem.paymentMethod],
                    ['Trang thai', <StatusBadge key="status" status={viewItem.status} />],
                    ['Ngay dat', viewItem.bookedAt ? new Date(viewItem.bookedAt).toLocaleString('vi-VN') : '-'],
                    ['Ghi chu', viewItem.note || '-'],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--gray-100)', fontSize:'0.875rem' }}>
                      <span style={{ color:'var(--gray-500)' }}>{k}</span>
                      <span style={{ fontWeight:700, textAlign:'right' }}>{v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setView(null)}>Dong</button>
              {viewItem.status === 'CONFIRMED' && (
                <button className="a-btn a-btn-danger" onClick={() => handleCancel(viewItem.id)}>Huy ve</button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TicketsPage;
