// pages/NewsAdminPage/NewsAdminPage.jsx
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFileText, FiTag } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchNews, createNews, updateNews, deleteNews } from '../../services/apiService';

const initialCategories = ['Khuyến mãi', 'Tin tức', 'Hướng dẫn', 'Du lịch', 'Thông báo'];

const NewsAdminPage = () => {
  const [tab, setTab]                     = useState('news');
  const [news, setNews]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [categories, setCategories]       = useState(initialCategories);
  const [search, setSearch]               = useState('');
  const [showModal, setModal]             = useState(false);
  const [editItem, setEdit]               = useState(null);
  const [deleteId, setDeleteId]           = useState(null);
  const [form, setForm]                   = useState({ title:'', excerpt:'', category:'Tin tức', author:'Admin', status:'draft' });
  const [saving, setSaving]               = useState(false);

  const [catForm, setCatForm]             = useState('');
  const [editCatIdx, setEditCatIdx]       = useState(null);
  const [deleteCatIdx, setDeleteCatIdx]   = useState(null);
  const [showCatModal, setCatModal]       = useState(false);

  useEffect(() => { document.title = 'Tin tức | Vé Vui Admin'; }, []);

  useEffect(() => {
    fetchNews(0, 100).then(data => {
      // Backend may return Page<Article> or array
      const items = data?.content || (Array.isArray(data) ? data : []);
      const mapped = items.map(n => ({
        id: n.id,
        title: n.title,
        excerpt: n.excerpt || n.summary || '',
        category: n.category || 'Tin tức',
        author: n.author || 'Admin',
        status: n.published ? 'published' : (n.status || 'draft'),
        publishedAt: n.publishedAt || n.createdAt || new Date().toISOString().split('T')[0],
        views: n.viewCount || n.views || 0,
      }));
      setNews(mapped);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── News ──
  const filteredNews = news.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setEdit(null); setForm({ title:'', excerpt:'', category: categories[0] || 'Tin tức', author:'Admin', status:'draft' }); setModal(true); };
  const openEdit = (n) => { setEdit(n); setForm({ title:n.title, excerpt:n.excerpt||'', category:n.category, author:n.author, status:n.status }); setModal(true); };

  const handleSaveNews = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const body = { title: form.title, excerpt: form.excerpt, category: form.category, author: form.author, published: form.status === 'published' };
    try {
      if (editItem) {
        await updateNews(editItem.id, body);
        setNews(ns => ns.map(n => n.id === editItem.id ? { ...n, ...form } : n));
      } else {
        const created = await createNews(body);
        const now = new Date().toISOString().split('T')[0];
        setNews(ns => [...ns, { id: created.id || `n${Date.now()}`, ...form, publishedAt: now, views: 0 }]);
      }
      setModal(false);
    } catch (e) { alert('Lỗi: ' + e.message); }
    setSaving(false);
  };

  const handleDeleteNews = async (id) => {
    try {
      await deleteNews(id);
      setNews(ns => ns.filter(n => n.id !== id));
    } catch (e) { alert('Lỗi: ' + e.message); }
    setDeleteId(null);
  };

  // ── Categories ──
  const openAddCat  = () => { setEditCatIdx(null); setCatForm(''); setCatModal(true); };
  const openEditCat = (idx) => { setEditCatIdx(idx); setCatForm(categories[idx]); setCatModal(true); };

  const handleSaveCat = () => {
    const val = catForm.trim();
    if (!val) return;
    if (categories.some((c, i) => c.toLowerCase() === val.toLowerCase() && i !== editCatIdx)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    if (editCatIdx !== null) {
      const oldName = categories[editCatIdx];
      setCategories(cs => cs.map((c, i) => i === editCatIdx ? val : c));
      setNews(ns => ns.map(n => n.category === oldName ? { ...n, category: val } : n));
    } else {
      setCategories(cs => [...cs, val]);
    }
    setCatModal(false);
  };

  const handleDeleteCat = (idx) => {
    const catName = categories[idx];
    const usedCount = news.filter(n => n.category === catName).length;
    if (usedCount > 0) {
      alert(`Không thể xóa danh mục "${catName}" vì đang có ${usedCount} bài viết.`);
      setDeleteCatIdx(null);
      return;
    }
    setCategories(cs => cs.filter((_, i) => i !== idx));
    setDeleteCatIdx(null);
  };

  return (
    <AdminLayout title="Tin tức">
      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:'var(--sp-5)' }}>
        <button className={`a-btn a-btn-sm ${tab === 'news' ? 'a-btn-primary' : 'a-btn-ghost'}`} onClick={() => { setTab('news'); setSearch(''); }} id="tab-news">
          <FiFileText size={14} /> Bài viết
        </button>
        <button className={`a-btn a-btn-sm ${tab === 'categories' ? 'a-btn-primary' : 'a-btn-ghost'}`} onClick={() => { setTab('categories'); setSearch(''); }} id="tab-categories">
          <FiTag size={14} /> Danh mục
        </button>
      </div>

      {/* ══════ NEWS TAB ══════ */}
      {tab === 'news' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Quản lý tin tức</h1>
              <p className="page-subtitle">{news.length} bài · {news.filter(n=>n.status==='published').length} đã xuất bản</p>
            </div>
            <button className="a-btn a-btn-primary" onClick={openAdd} id="add-news">
              <FiPlus size={15}/> Viết bài
            </button>
          </div>

          <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
            <div className="a-card-body" style={{ padding:'1rem 1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, maxWidth:400 }}>
                <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
                <input className="a-input" placeholder="Tìm bài viết..." value={search} onChange={e=>setSearch(e.target.value)} id="news-search" style={{ border:'none', boxShadow:'none', padding:'4px 0' }} />
              </div>
            </div>
          </div>

          <div className="a-card">
            <div style={{ overflowX:'auto' }}>
              <table className="a-table">
                <thead>
                  <tr><th>Tiêu đề</th><th>Danh mục</th><th>Tác giả</th><th>Ngày</th><th>Lượt xem</th><th>Trạng thái</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                  {filteredNews.map(n => (
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
                  {filteredNews.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--gray-400)' }}>Không tìm thấy bài viết nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════ CATEGORIES TAB ══════ */}
      {tab === 'categories' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Quản lý danh mục</h1>
              <p className="page-subtitle">{categories.length} danh mục</p>
            </div>
            <button className="a-btn a-btn-primary" onClick={openAddCat} id="add-category">
              <FiPlus size={15}/> Thêm danh mục
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'var(--sp-4)' }}>
            {categories.map((cat, idx) => {
              const count = news.filter(n => n.category === cat).length;
              return (
                <div key={idx} className="a-card" style={{ padding:'var(--sp-5)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'var(--gray-900)' }}>{cat}</h3>
                    <div style={{ fontSize:'0.82rem', color:'var(--gray-400)', marginTop:4 }}>{count} bài viết</div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => openEditCat(idx)} title="Sửa" id={`edit-cat-${idx}`}><FiEdit2 size={14}/></button>
                    <button className="a-btn a-btn-ghost a-btn-sm a-btn-icon" onClick={() => setDeleteCatIdx(idx)} style={{ color:'var(--danger)' }} title="Xóa" id={`delete-cat-${idx}`}><FiTrash2 size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════ NEWS MODAL ══════ */}
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
              <div className="a-form-group">
                <label className="a-label">Mô tả ngắn</label>
                <textarea className="a-input" rows={3} placeholder="Mô tả nội dung bài viết..." value={form.excerpt} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} id="news-excerpt" style={{ resize:'vertical' }} />
              </div>
              <div className="grid-2">
                <div className="a-form-group">
                  <label className="a-label">Danh mục</label>
                  <select className="a-input a-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} id="news-cat">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSaveNews} disabled={saving} id="save-news">{saving ? 'Đang lưu...' : 'Lưu bài'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa</div><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <div className="modal-body"><p>Bạn có chắc muốn xóa bài viết này?</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDeleteNews(deleteId)} id="confirm-delete-news">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ CATEGORY MODAL ══════ */}
      {showCatModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setCatModal(false)}>
          <div className="modal-box" style={{ maxWidth:420 }}>
            <div className="modal-header">
              <div className="modal-title">{editCatIdx !== null ? 'Sửa danh mục' : 'Thêm danh mục mới'}</div>
              <button className="modal-close" onClick={() => setCatModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="a-form-group">
                <label className="a-label">Tên danh mục *</label>
                <input className="a-input" placeholder="VD: Khuyến mãi, Du lịch, Hướng dẫn..." value={catForm} onChange={e=>setCatForm(e.target.value)} id="cat-name"
                  onKeyDown={e => e.key === 'Enter' && handleSaveCat()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setCatModal(false)}>Hủy</button>
              <button className="a-btn a-btn-primary" onClick={handleSaveCat} id="save-category">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {deleteCatIdx !== null && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteCatIdx(null)}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header"><div className="modal-title">Xác nhận xóa danh mục</div><button className="modal-close" onClick={() => setDeleteCatIdx(null)}>×</button></div>
            <div className="modal-body"><p>Xóa danh mục <strong>"{categories[deleteCatIdx]}"</strong>? Hành động này không thể hoàn tác.</p></div>
            <div className="modal-footer">
              <button className="a-btn a-btn-ghost" onClick={() => setDeleteCatIdx(null)}>Hủy</button>
              <button className="a-btn a-btn-danger" onClick={() => handleDeleteCat(deleteCatIdx)} id="confirm-delete-cat">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default NewsAdminPage;
