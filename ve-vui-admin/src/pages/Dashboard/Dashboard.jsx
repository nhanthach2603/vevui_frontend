// pages/Dashboard/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp, FiTrendingDown, FiArrowRight,
  FiUsers, FiCalendar, FiCreditCard, FiDollarSign, FiBarChart2
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchStats, fetchTickets, fetchTrips, formatPrice } from '../../services/apiService';
import './Dashboard.css';

const KPICard = ({ label, value, icon, colorClass, change, changeDir, sub }) => (
  <div className={`kpi-card kpi-${colorClass}`}>
    <div className={`kpi-icon ${colorClass}`}>{icon}</div>
    <div className="kpi-info">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={`kpi-change ${changeDir}`}>
          {changeDir === 'up' ? <FiTrendingUp size={12}/> : <FiTrendingDown size={12}/>}
          {change}
        </div>
      )}
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  useEffect(() => { document.title = 'Dashboard | Vé Vui Admin'; }, []);

  const [stats, setStats]               = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [todayTrips, setTodayTrips]     = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      fetchStats().catch(() => null),
      fetchTickets(0, 5).catch(() => null),
      fetchTrips(0, 20).catch(() => null),
    ]).then(([statsData, ticketsData, tripsData]) => {
      if (statsData) setStats(statsData);
      if (ticketsData?.content) setRecentTickets(ticketsData.content);
      if (tripsData?.content) {
        setTodayTrips(tripsData.content.filter(t => t.tripDate === today).slice(0, 5));
      }
      setLoading(false);
    });
  }, []);


  return (
    <AdminLayout title="Dashboard">
      {/* Welcome hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1 className="page-title">Chào buổi sáng, Admin! 👋</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day:'2-digit', month:'2-digit', year:'numeric' })}
            {' · '}Hôm nay có <strong>{todayTrips.length}</strong> chuyến và <strong>{stats?.todayTickets ?? '—'}</strong> vé mới
          </p>
        </div>
        <div className="dash-hero-actions">
          <Link to="/trips" className="a-btn a-btn-primary" id="add-trip">
            <FiCalendar size={15}/> Xem chuyến
          </Link>
          <Link to="/reports" className="a-btn a-btn-ghost" id="view-reports">
            <FiBarChart2 size={15}/> Xem báo cáo
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Doanh thu hôm nay" value={formatPrice(stats?.todayRevenue)} icon={<FiDollarSign />} colorClass="blue" sub={loading ? 'Đang tải...' : null} />
        <KPICard label="Vé hôm nay"        value={loading ? '...' : (stats?.todayTickets ?? 0)} icon={<FiCreditCard />} colorClass="green" />
        <KPICard label="Tổng vé xác nhận" value={loading ? '...' : (stats?.confirmedTickets ?? 0)} icon={<FiCalendar />} colorClass="orange" sub="Đã xác nhận" />
        <KPICard label="Tổng doanh thu"   value={formatPrice(stats?.totalRevenue)} icon={<FiUsers />} colorClass="purple" />
      </div>

      {/* Charts row */}
      <div className="dash-charts">
        {/* Revenue summary card */}
        <div className="a-card dash-chart-card">
          <div className="a-card-header">
            <div className="a-card-title">Tổng quan doanh thu</div>
          </div>
          <div className="a-card-body" style={{ padding: '1.5rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-4)' }}>
              <div style={{ padding:'var(--sp-4)', background:'var(--primary-bg)', borderRadius:'var(--r-md)', textAlign:'center' }}>
                <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-500)', marginBottom:4 }}>Hôm nay</div>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--primary)' }}>{formatPrice(stats?.todayRevenue)}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>{stats?.todayTickets ?? 0} vé</div>
              </div>
              <div style={{ padding:'var(--sp-4)', background:'#F0FDF4', borderRadius:'var(--r-md)', textAlign:'center' }}>
                <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-500)', marginBottom:4 }}>Tổng cộng</div>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--success)' }}>{formatPrice(stats?.totalRevenue)}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--gray-400)' }}>{stats?.totalTickets ?? 0} vé</div>
              </div>
            </div>
            <div style={{ marginTop:'var(--sp-4)', padding:'var(--sp-3)', background:'var(--gray-50)', borderRadius:'var(--r-md)', display:'flex', justifyContent:'space-around', fontSize:'0.85rem' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontWeight:700, color:'var(--success)' }}>{stats?.confirmedTickets ?? 0}</div>
                <div style={{ color:'var(--gray-400)', fontSize:'0.75rem' }}>Đã xác nhận</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontWeight:700, color:'var(--danger)' }}>{stats?.cancelledTickets ?? 0}</div>
                <div style={{ color:'var(--gray-400)', fontSize:'0.75rem' }}>Đã hủy</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontWeight:700, color:'var(--primary)' }}>{stats?.totalTickets ? Math.round(((stats?.confirmedTickets||0)/stats.totalTickets)*100) : 0}%</div>
                <div style={{ color:'var(--gray-400)', fontSize:'0.75rem' }}>Tỷ lệ xác nhận</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="dash-tables">
        {/* Recent tickets */}
        <div className="a-card">
          <div className="a-card-header">
            <div className="a-card-title">Vé mới nhất</div>
            <Link to="/tickets" className="a-btn a-btn-ghost a-btn-sm">Xem tất cả <FiArrowRight size={12}/></Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Hành khách</th>
                  <th>Tuyến</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.length === 0 && !loading && (
                  <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--gray-400)', padding:'1.5rem' }}>Chưa có vé nào</td></tr>
                )}
                {recentTickets.map(t => (
                  <tr key={t.id}>
                    <td><code style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight:700 }}>{t.id}</code></td>
                    <td>
                      <div style={{ fontWeight:700 }}>{t.customerName}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{t.phone}</div>
                    </td>
                    <td>{t.fromCity?.replace('TP. Hồ Chí Minh','HCM')} → {t.toCity}</td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.totalPrice)}</td>
                    <td>
                      <span className={`a-badge ${t.status === 'CONFIRMED' ? 'a-badge-green' : 'a-badge-red'}`}>
                        {t.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đã hủy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's trips */}
        <div className="a-card">
          <div className="a-card-header">
            <div className="a-card-title">Chuyến đi hôm nay</div>
            <Link to="/trips" className="a-btn a-btn-ghost a-btn-sm">Xem tất cả <FiArrowRight size={12}/></Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="a-table">
              <thead>
                <tr><th>Giờ</th><th>Tuyến</th><th>Xe</th><th>Ghế trống</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {todayTrips.length === 0 && !loading && (
                  <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--gray-400)', padding:'1.5rem' }}>Không có chuyến hôm nay</td></tr>
                )}
                {todayTrips.map(t => {
                  const total   = t.bus?.totalSeats || 34;
                  const avail   = t.availableSeats || 0;
                  const booked  = total - avail;
                  const pct     = Math.round((booked / total) * 100);
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight:800, fontSize:'1rem' }}>{t.departureTime}</td>
                      <td>{t.route?.fromCity?.replace('TP. Hồ Chí Minh','HCM')} → {t.route?.toCity}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{t.bus?.plateNumber}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>{t.bus?.busTypeName}</div>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'var(--gray-100)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)', transition:'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize:'0.78rem', fontWeight:700 }}>{booked}/{total}</span>
                        </div>
                      </td>
                      <td><span className={`a-badge ${t.status === 'SCHEDULED' ? 'a-badge-green' : 'a-badge-gray'}`}>{t.status === 'SCHEDULED' ? 'Hoạt động' : t.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
