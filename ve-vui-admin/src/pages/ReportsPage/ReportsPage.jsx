// pages/ReportsPage/ReportsPage.jsx
import { useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FiTrendingUp, FiDownload } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { revenueData, routeRevenueData, formatPrice } from '../../services/adminData';

const ReportsPage = () => {
  useEffect(() => { document.title = 'Báo cáo | Vé Vui Admin'; }, []);

  const totalRevenue = revenueData.reduce((s,d) => s + d.revenue, 0);
  const totalTickets = revenueData.reduce((s,d) => s + d.tickets, 0);
  const avgRevenue   = Math.round(totalRevenue / revenueData.length);
  const bestMonth    = revenueData.reduce((a,b) => a.revenue > b.revenue ? a : b);

  const exportCSV = () => {
    const headers = ['Tháng', 'Doanh thu (₫)', 'Vé bán'];
    const rows = revenueData.map(d => [d.month, d.revenue, d.tickets]);
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
          <p className="page-subtitle">Tổng hợp dữ liệu kinh doanh năm 2024</p>
        </div>
        <button className="a-btn a-btn-ghost" onClick={exportCSV} id="export-report">
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
            <div className="kpi-change up">+18.5% YoY</div>
          </div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon green">🎫</div>
          <div className="kpi-info">
            <div className="kpi-label">Tổng vé bán</div>
            <div className="kpi-value">{totalTickets.toLocaleString()}</div>
            <div className="kpi-change up">+21% YoY</div>
          </div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-icon orange">📊</div>
          <div className="kpi-info">
            <div className="kpi-label">Doanh thu TB/tháng</div>
            <div className="kpi-value" style={{ fontSize:'1.4rem' }}>{formatPrice(avgRevenue)}</div>
            <div className="kpi-change flat">—</div>
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
      <div className="a-card" style={{ marginBottom:'var(--sp-5)' }}>
        <div className="a-card-header">
          <div className="a-card-title">Xu hướng doanh thu & Vé bán theo tháng</div>
        </div>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem 1.5rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--gray-500)' }} />
              <YAxis yAxisId="left" tickFormatter={v=>`${(v/1000000).toFixed(0)}M`} tick={{ fontSize:11, fill:'var(--gray-500)' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:'var(--gray-500)' }} />
              <Tooltip formatter={(v,n) => n==='Doanh thu' ? formatPrice(v) : v} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="var(--primary)" strokeWidth={3} dot={{ r:4 }} activeDot={{ r:6 }} />
              <Line yAxisId="right" type="monotone" dataKey="tickets" name="Vé bán" stroke="var(--success)" strokeWidth={2} strokeDasharray="5 5" dot={{ r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route comparison */}
      <div className="a-card">
        <div className="a-card-header">
          <div className="a-card-title">So sánh doanh thu theo tuyến (%)</div>
        </div>
        <div className="a-card-body" style={{ padding:'1rem 1.5rem 1.5rem' }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={routeRevenueData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:11, fill:'var(--gray-500)' }} tickFormatter={v=>`${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'var(--gray-600)' }} width={160} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="value" name="Tỉ lệ" fill="var(--primary)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
