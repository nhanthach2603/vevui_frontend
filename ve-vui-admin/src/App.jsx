import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import RoutesPage from './pages/RoutesPage/RoutesPage';
import BusesPage from './pages/BusesPage/BusesPage';
import TripsPage from './pages/TripsPage/TripsPage';
import TicketsPage from './pages/TicketsPage/TicketsPage';
import CustomersPage from './pages/CustomersPage/CustomersPage';
import NewsAdminPage from './pages/NewsAdminPage/NewsAdminPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';

const isAuthenticated = () => !!localStorage.getItem('vevui_admin');

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/routes"     element={<ProtectedRoute><RoutesPage /></ProtectedRoute>} />
        <Route path="/buses"      element={<ProtectedRoute><BusesPage /></ProtectedRoute>} />
        <Route path="/trips"      element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
        <Route path="/tickets"    element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
        <Route path="/customers"  element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/news"       element={<ProtectedRoute><NewsAdminPage /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
