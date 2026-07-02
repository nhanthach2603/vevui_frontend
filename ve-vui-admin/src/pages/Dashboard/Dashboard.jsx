// pages/Dashboard/Dashboard.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  FiTrendingUp, FiTrendingDown, FiArrowRight,
  FiUsers, FiCalendar, FiCreditCard, FiDollarSign, FiBarChart2
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  getDashboardStats, formatPrice, tickets, trips,
  revenueData, routeRevenueData, getRoute, getBus, getBusType
} from '../../services/adminData';
import './Dashboard.css';

const COLORS = ['#0EA5E9', '#22C55E', '#F59E0B', '#8B5CF6', '#94A3B8'];

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
  const stats = getDashboardStats();

  const recentTickets = tickets.slice().reverse().slice(0, 5);
  const todayTrips    = trips.filter(t => t.date === new Date().toISOString().split('T')[0]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <div className="ct-label">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="ct-row" style={{ color: p.color }}>
            <span>{p.name}:</span>
            <strong>{p.name === 'Doanh thu' ? formatPrice(p.value) : p.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1 className="page-title">Chào buổi sáng, Admin! 👋</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day:'2-digit', month:'2-digit', year:'numeric' })}
            {' · '}Hôm nay có <strong>{stats.todayTrips}</strong> chuyến và <strong>{stats.todayTickets}</strong> vé mới
          </p>
        </div>
        <div className="dash-hero-actions">
          <Link to="/trips/new" className="a-btn a-btn-primary" id="add-trip">
            <FiCalendar size={15}/> Thêm chuyến
          </Link>
          <Link to="/reports" className="a-btn a-btn-ghost" id="view-reports">
            <FiBarChart2 size={15}/> Xem báo cáo
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Doanh thu hôm nay" value={formatPrice(stats.todayRevenue)} icon={<FiDollarSign />} colorClass="blue"   change={stats.revenueChange !== 0 ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}% so hôm qua` : null} changeDir={stats.revenueChange >= 0 ? 'up' : 'down'} />
        <KPICard label="Vé bán hôm nay"    value={stats.todayTickets}               icon={<FiCreditCard />} colorClass="green"  change={stats.ticketChange !== 0 ? `${stats.ticketChange > 0 ? '+' : ''}${stats.ticketChange} so hôm qua` : null} changeDir={stats.ticketChange >= 0 ? 'up' : 'down'} />
        <KPICard label="Chuyến đi hôm nay" value={stats.todayTrips}                 icon={<FiCalendar />}   colorClass="orange" sub="Đang hoạt động" />
        <KPICard label="Tổng khách hàng"   value={stats.totalCustomers}             icon={<FiUsers />}      colorClass="purple" />
      </div>

      {/* Charts row */}
      <div className="dash-charts">
        {/* Revenue bar chart */}
        <div className="a-card dash-chart-card">
          <div className="a-card-header">
            <div className="a-card-title">Doanh thu theo tháng</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>2024</span>
          </div>
          <div className="a-card-body" style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--gray-500)' }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Doanh thu" fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart - route distribution */}
        <div className="a-card dash-chart-card dash-chart-sm">
          <div className="a-card-header">
            <div className="a-card-title">Phân bổ tuyến</div>
          </div>
          <div className="a-card-body" style={{ padding: '1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={routeRevenueData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {routeRevenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
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
                {recentTickets.map(t => {
                  const route = getRoute(t.routeId);
                  return (
                    <tr key={t.id}>
                      <td><code style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight:700 }}>{t.id}</code></td>
                      <td>
                        <div style={{ fontWeight:700 }}>{t.customerName}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--gray-400)' }}>{t.phone}</div>
                      </td>
                      <td>{route?.from} → {route?.to}</td>
                      <td style={{ fontWeight:700, color:'var(--primary)' }}>{formatPrice(t.totalPrice)}</td>
                      <td>
                        <span className={`a-badge ${t.status === 'confirmed' ? 'a-badge-green' : 'a-badge-red'}`}>
                          {t.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
                <tr><th>Giờ</th><th>Tuyến</th><th>Xe</th><th>Đặt/Tổng</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {todayTrips.slice(0,5).map(t => {
                  const route   = getRoute(t.routeId);
                  const bus     = getBus(t.busId);
                  const busType = getBusType(bus?.typeId);
                  const total   = busType?.seats || 34;
                  const pct     = Math.round((t.bookedSeats / total) * 100);
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight:800, fontSize:'1rem' }}>{t.departureTime}</td>
                      <td>{route?.from?.replace('TP. Hồ Chí Minh','HCM')} → {route?.to}</td>
                      <td><div style={{ fontWeight:600 }}>{bus?.plateNumber}</div><div style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>{busType?.name}</div></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'var(--gray-100)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)', transition:'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize:'0.78rem', fontWeight:700 }}>{t.bookedSeats}/{total}</span>
                        </div>
                      </td>
                      <td><span className="a-badge a-badge-green">Hoạt động</span></td>
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
