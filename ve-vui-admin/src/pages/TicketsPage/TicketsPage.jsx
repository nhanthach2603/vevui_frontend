// pages/TicketsPage/TicketsPage.jsx
import { useEffect, useState } from 'react';
import { FiSearch, FiDownload, FiEye, FiXCircle } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchTickets, cancelTicket, formatPrice } from '../../services/apiService';

const PAYMENT_LABELS = {
  transfer: 'Chuyen khoan', TRANSFER: 'Chuyen khoan',
  momo: 'MoMo', MOMO: 'MoMo',
  vnpay: 'VNPay', VNPAY: 'VNPay',
  zalopay: 'ZaloPay', ZALOPAY: 'ZaloPay',
};

const TicketsPage = () => {
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [viewItem, setView]       = useState(null);

  useEffect(() => { document.title = 'Ve dat | Ve Vui Admin'; }, []);

  useEffect(() => {
    fetchTickets(0, 100).then(data => {
      setTickets(data?.content || []);
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
    } catch (e) { alert('Loi: ' + e.message); }
    setView(null);
  };

  const totalRevenue = tickets.filter(t => t.status === 'CONFIRMED').reduce((s, t) => s + (t.totalPrice || 0), 0);

  const exportCSV = () => {
    const headers = ['Ma ve','Hanh khach','SDT','Tuyen','Ghe','Tong tien','Phuong thuc','Trang thai','Ngay dat'];
    const rows = filtered.map(t => [
      t.id, t.customerName, t.phone,
      `${t.fromCity || ''} - ${t.toCity || ''}`,
      (t.seatNumbers || t.seats || []).join(' '),
      t.totalPrice,
      PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod,
      t.status === 'CONFIRMED' ? 'Da xac nhan' : 'Da huy',
      t.bookedAt ? new Date(t.bookedAt).toLocaleString('vi-VN') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ve-vui-ve-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
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
        <div className="a-card-body" style={{ padding:'1rem 1.5rem', display:'flex', gap:'var(--sp-4)', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:220 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tim ma ve, ten, SDT..." value={search} onChange={e=>setSearch(e.target.value)} id="ticket-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[['all','Tat ca'],['CONFIRMED','Da xac nhan'],['CANCELLED','Da huy']].map(([v,l]) => (
              <button key={v} className={`a-btn a-btn-sm ${statusFilter===v?'a-btn-primary':'a-btn-ghost'}`} onClick={() => setStatus(v)} id={`filter-${v}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
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
                  <td>
                    <span className={`a-badge ${t.status==='CONFIRMED'?'a-badge-green':'a-badge-red'}`}>
                      {t.status==='CONFIRMED'?'Da xac nhan':'Da huy'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setView(t)} title="Xem chi tiet" id={`view-ticket-${t.id}`}><FiEye size={14}/></button>
                      {t.status === 'CONFIRMED' && (
                        <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" style={{ color:'var(--danger)' }} onClick={() => handleCancel(t.id)} title="Huy ve" id={`cancel-ticket-${t.id}`}><FiXCircle size={14}/></button>
                      )}
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
              {[
                ['Hanh khach', viewItem.customerName],
                ['So dien thoai', viewItem.phone],
                ['Tuyen', `${viewItem.fromCity || ''} - ${viewItem.toCity || ''}`],
                ['Ghe', (viewItem.seatNumbers || viewItem.seats || []).join(', ')],
                ['Tong tien', formatPrice(viewItem.totalPrice)],
                ['Thanh toan', PAYMENT_LABELS[viewItem.paymentMethod] || viewItem.paymentMethod],
                ['Trang thai', viewItem.status === 'CONFIRMED' ? 'Da xac nhan' : 'Da huy'],
                ['Ngay dat', viewItem.bookedAt ? new Date(viewItem.bookedAt).toLocaleString('vi-VN') : '-'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--gray-100)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
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
