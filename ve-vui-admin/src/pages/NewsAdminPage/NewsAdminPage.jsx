// pages/NewsAdminPage/NewsAdminPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { newsArticles as initialNews } from '../../services/adminData';

const CATEGORIES = ['Khuyến mãi', 'Tin tức', 'Hướng dẫn', 'Du lịch', 'Thông báo'];

const NewsAdminPage = () => {
  const [news, setNews]           = useState(initialNews);
  const [search, setSearch]       = useState('');
  const [showModal, setModal]     = useState(false);
  const [editItem, setEdit]       = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [form, setForm]           = useState({ title:'', category:'Tin tức', author:'Admin', status:'draft' });

  useEffect(() => { document.title = 'Tin tức | Vé Vui Admin'; }, []);

  const filtered = news.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  const openAdd  = () => { setEdit(null); setForm({ title:'', category:'Tin tức', author:'Admin', status:'draft' }); setModal(true); };
  const openEdit = (n) => { setEdit(n); setForm({ title:n.title, category:n.category, author:n.author, status:n.status }); setModal(true); };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editItem) {
      setNews(ns => ns.map(n => n.id === editItem.id ? { ...n, ...form } : n));
    } else {
      const now = new Date().toISOString().split('T')[0];
      setNews(ns => [...ns, { id:`n${Date.now()}`, ...form, publishedAt: now, views: 0 }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { setNews(ns => ns.filter(n => n.id !== id)); setDeleteId(null); };

  return (
    <AdminLayout title="Tin tức">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tin tức</h1>
          <p className="page-subtitle">{news.length} bài · {news.filter(n=>n.status==='published').length} đã xuất bản</p>
        </div>
        <button className="a-btn a-btn-primary" onClick={openAdd} id="add-news">
          <FiPlus size={15}/> Viết bài
        </button>
      </div>

      {/* Search */}
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:400 }}>
            <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
            <input className="a-input" placeholder="Tìm bài viết..." value={search} onChange={e=>setSearch(e.target.value)} id="news-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="a-card">
        <div style={{ overflowX:'auto' }}>
          <table className="a-table">
            <thead>
              <tr><th>Tiêu đề</th><th>Danh mục</th><th>Tác giả</th><th>Ngày</th><th>Lượt xem</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(n => (
                <tr key={n.id}>
                  <td>
                    <div style={{ fontWeight:700, maxWidth:300, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {n.title}
                    </div>
                  </td>
                  <td><span className="a-badge a-badge-blue">{n.category}</span></td>
                  <td style={{ color:'var(--gray-500)' }}>{n.author}</td>
                  <td>{new Date(n.publishedAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ fontWeight:600 }}>{n.views.toLocaleString()}</td>
                  <td>
                    <span className={`a-badge ${n.status==='published'?'a-badge-green':'a-badge-orange'}`}>
                      {n.status==='published'?'Đã xuất bản':'Nháp'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEdit(n)} id={`edit-news-${n.id}`}><FiEdit2 size={14}/></button>
                      <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteId(n.id)} style={{ color:'var(--danger)' }} id={`delete-news-${n.id}`}><FiTrash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Chỉnh sửa bài' : 'Viết bài mới'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="a-form-group">
                <label className="a-label">Tiêu đề *</label>
                <input className="a-input" placeholder="Nhập tiêu đề bài viết..." value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} id="news-title" />
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Danh mục</label>
                  <select className="a-input a-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} id="news-cat">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="a-form-group">
                  <label className="a-label">Trạng thái</label>
                  <select className="a-input a-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} id="news-status">
                    <option value="draft">Nháp</option>
                    <option value="published">Xuất bản</option>
                  </select>
                </div>
              </div>
              <div className="a-form-group">
                <label className="a-label">Tác giả</label>
                <input className="a-input" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} id="news-author" />
              </div>
              <div style={{ padding:'var(--sp-4)', background:'var(--primary-bg)', borderRadius:'var(--r-md)', fontSize:'0.85rem', color:'var(--primary-dark)' }}>
                💡 Trong phiên bản thực tế, sẽ có trình soạn thảo văn bản phong phú (Rich Text Editor) tại đây.
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSave} id="save-news">Lưu bài</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <div className="modal-body"><p>Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDelete(deleteId)} id="confirm-delete-news">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default NewsAdminPage;
