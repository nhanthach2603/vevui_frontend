// pages/CustomersPage/CustomersPage.jsx
import { useEffect, useState } from 'react';
import { FiSearch, FiEye, FiUsers, FiUserCheck, FiUserX } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { customers as initialCustomers } from '../../services/adminData';

const CustomersPage = () => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch]       = useState('');
  const [viewItem, setView]       = useState(null);

  useEffect(() => { document.title = 'Khách hàng | Vé Vui Admin'; }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id) => setCustomers(cs => cs.map(c => c.id === id ? { ...c, status: c.status==='active'?'inactive':'active' } : c));

  const active   = customers.filter(c=>c.status==='active').length;
  const inactive = customers.filter(c=>c.status==='inactive').length;

  return (
    <AdminLayout title="Khách hàng">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khách hàng</h1>
          <p className="page-subtitle">{customers.length} khách hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
        {[
          { icon:<FiUsers />,    label:'Tổng khách hàng', val:customers.length, color:'blue' },
          { icon:<FiUserCheck />,label:'Đang hoạt động',  val:active,           color:'green' },
          { icon:<FiUserX />,   label:'Không hoạt động', val:inactive,         color:'orange' },
        ].map(s => (
          <div key={s.label} className="a-card" style={{ padding:'var(--sp-5)', display:'flex', gap:'var(--sp-3)', alignItems:'center' }}>
            <div className={`kpi-icon ${s.color}`}>{s.icon}</div>
            <div><div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase' }}>{s.label}</div><div style={{ fontSize:'1.75rem', fontWeight:900, color:'var(--gray-900)' }}>{s.val}</div></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:400 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tìm theo tên, SĐT, email..." value={search} onChange={e=>setSearch(e.target.value)} id="customer-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Khách hàng</th><th>Liên hệ</th><th>Số chuyến</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:38, height:38, background:'var(--primary-bg)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', fontWeight:800, fontSize:'1rem', flexShrink:0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight:700 }}>{c.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>#{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{c.phone}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{c.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight:700, color:'var(--primary)' }}>{c.totalTrips}</span>
                    <span style={{ color:'var(--gray-400)', fontSize:'0.82rem' }}> chuyến</span>
                  </td>
                  <td>{new Date(c.joinedAt).toLocaleDateString('vi-VN')}</td>
                  <td><span className={`a-badge ${c.status==='active'?'a-badge-green':'a-badge-gray'}`}>{c.status==='active'?'Hoạt động':'Không HĐ'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setView(c)} id={`view-customer-${c.id}`}><FiEye size={14}/></button>
                      <button
                        className={`a-btn a-btn-sm ${c.status==='active'?'a-btn-ghost':'a-btn-success'}`}
                        style={{ fontSize:'0.75rem', ...(c.status==='active' ? { color:'var(--danger)', borderColor:'var(--danger)' } : {}) }}
                        onClick={() => toggleStatus(c.id)}
                        id={`toggle-customer-${c.id}`}
                      >
                        {c.status==='active'?'Khóa':'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setView(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Thông tin khách hàng</div>
              <button className="modal-close" onClick={() => setView(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-4)', marginBottom:'var(--sp-5)' }}>
                <div style={{ width:60, height:60, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:'1.5rem' }}>
                  {viewItem.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{viewItem.name}</div>
                  <span className={`a-badge ${viewItem.status==='active'?'a-badge-green':'a-badge-gray'}`}>{viewItem.status==='active'?'Hoạt động':'Không HĐ'}</span>
                </div>
              </div>
              {[
                ['Số điện thoại', viewItem.phone],
                ['Email', viewItem.email],
                ['Tổng chuyến đi', `${viewItem.totalTrips} chuyến`],
                ['Ngày đăng ký', new Date(viewItem.joinedAt).toLocaleDateString('vi-VN')],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--gray-100)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--gray-500)' }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setView(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CustomersPage;
