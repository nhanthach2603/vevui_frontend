// pages/ReportsPage/ReportsPage.jsx
import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FiTrendingUp, FiDownload } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { fetchStats, fetchTickets, formatPrice } from '../../services/apiService';

const ReportsPage = () => {
  useEffect(() => { document.title = 'Báo cáo | Vé Vui Admin'; }, []);

  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStats().catch(() => null),
      fetchTickets(0, 200).catch(() => null),
    ]).then(([statsData, ticketsData]) => {
      if (statsData) setStats(statsData);
      if (ticketsData?.content) setTickets(ticketsData.content);
      setLoading(false);
    });
  }, []);

  const totalRevenue = stats?.totalRevenue || 0;
  const totalTickets = stats?.totalTickets || 0;
  const confirmedTickets = stats?.confirmedTickets || 0;
  const avgRevenue = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;

  // Build monthly data from tickets
  const monthlyMap = {};
  tickets.forEach(t => {
    if (!t.tripDate) return;
    const month = t.tripDate.substring(0, 7); // yyyy-MM
    if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, tickets: 0 };
    monthlyMap[month].revenue += Number(t.totalPrice || 0);
    monthlyMap[month].tickets += 1;
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  // Route distribution from tickets
  const routeMap = {};
  tickets.forEach(t => {
    const key = `${t.fromCity || '?'} → ${t.toCity || '?'}`;
    routeMap[key] = (routeMap[key] || 0) + 1;
  });
  const routeData = Object.entries(routeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const totalTicketCount = routeData.reduce((s, d) => s + d.value, 0) || 1;
  routeData.forEach(d => d.percent = Math.round((d.value / totalTicketCount) * 100));

  const bestMonth = monthlyData.length > 0
    ? monthlyData.reduce((a, b) => a.revenue > b.revenue ? a : b)
    : { month: '—', revenue: 0 };

  const exportCSV = () => {
    const headers = ['Tháng', 'Doanh thu (₫)', 'Vé bán'];
    const rows = monthlyData.map(d => [d.month, d.revenue, d.tickets]);
    if (rows.length === 0) { alert('Chưa có dữ liệu để xuất'); return; }
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ve-vui-bao-cao-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Báo cáo">
      <div className="page-header">
        <div>
          <h1 className="page-title">Báo cáo doanh thu</h1>
          <p className="page-subtitle">{loading ? 'Đang tải...' : `Tổng hợp dữ liệu kinh doanh`}</p>
        </div>
        <button className="a-btn a-btn-ghost" onClick={exportCSV} id="export-report" disabled={loading || monthlyData.length === 0}>
          <FiDownload size={15}/> Xuất báo cáo
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom:'var(--sp-6)' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon blue"><FiTrendingUp /></div>
          <div className="kpi-info">
            <div className="kpi-label">Tổng doanh thu</div>
            <div className="kpi-value" style={{ fontSize:'1.4rem' }}>{formatPrice(totalRevenue)}</div>
          </div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon green">🎫</div>
          <div className="kpi-info">
            <div className="kpi-label">Tổng vé bán</div>
            <div className="kpi-value">{totalTickets.toLocaleString()}</div>
          </div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon orange">📊</div>
          <div className="kpi-info">
            <div className="kpi-label">Doanh thu TB/vé</div>
            <div className="kpi-value" style={{ fontSize:'1.4rem' }}>{formatPrice(avgRevenue)}</div>
          </div>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="kpi-icon purple">🏆</div>
          <div className="kpi-info">
            <div className="kpi-label">Tháng cao nhất</div>
            <div className="kpi-value">{bestMonth.month}</div>
            <div className="kpi-change up">{formatPrice(bestMonth.revenue)}</div>
          </div>
        </div>
      </div>

      {/* Revenue line chart */}
      {monthlyData.length > 0 && (
        <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
          <div className="a-card-header">
            <div className="a-card-title">Xu hướng doanh thu & Vé bán theo tháng</div>
          </div>
          <div className="a-card-body" style={{ padding:'1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--gray-500)' }} />
                <YAxis yAxisId="left" tickFormatter={v=>`${(v/1000000).toFixed(0)}M`} tick={{ fontSize:11, fill:'var(--gray-500)' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:'var(--gray-500)' }} />
                <Tooltip formatter={(v,n) => n==='revenue' ? formatPrice(v) : v} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="var(--primary)" strokeWidth={3} dot={{ r:4 }} activeDot={{ r:6 }} />
                <Line yAxisId="right" type="monotone" dataKey="tickets" name="Vé bán" stroke="var(--success)" strokeWidth={2} strokeDasharray="5 5" dot={{ r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Route comparison */}
      {routeData.length > 0 && (
        <div className="a-card">
          <div className="a-card-header">
            <div className="a-card-title">So sánh doanh thu theo tuyến (%)</div>
          </div>
          <div className="a-card-body" style={{ padding:'1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={Math.max(200, routeData.length * 40)}>
              <BarChart data={routeData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'var(--gray-500)' }} tickFormatter={v=>`${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'var(--gray-600)' }} width={160} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="percent" name="Tỉ lệ" fill="var(--primary)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {monthlyData.length === 0 && !loading && (
        <div className="a-card" style={{ padding:'3rem', textAlign:'center', color:'var(--gray-400)' }}>
          <p style={{ fontSize:'1.1rem' }}>Chưa có dữ liệu vé để hiển thị báo cáo.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default ReportsPage;
