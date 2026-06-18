// components/ui/SearchBox.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiUsers, FiMapPin, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useBooking } from '../../context/BookingContext';
import { PROVINCES } from '../../constants/routes';
import './SearchBox.css';

const today = new Date().toISOString().split('T')[0];

const SearchBox = ({ compact = false }) => {
  const navigate    = useNavigate();
  const { setSearch } = useBooking();

  const [form, setForm] = useState({
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Lạt',
    date: today,
    passengers: 1,
  });
  const [error, setError] = useState('');

  const swap = () => setForm(f => ({ ...f, from: f.to, to: f.from }));

  const handle = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.from || !form.to) { setError('Vui lòng chọn điểm đi và điểm đến'); return; }
    if (form.from === form.to) { setError('Điểm đi và điểm đến không được giống nhau'); return; }
    if (!form.date) { setError('Vui lòng chọn ngày đi'); return; }
    setError('');
    setSearch(form);
    navigate(`/tim-chuyen?from=${encodeURIComponent(form.from)}&to=${encodeURIComponent(form.to)}&date=${form.date}&passengers=${form.passengers}`);
  };

  return (
    <form
      onSubmit={submit}
      className={`search-box ${compact ? 'search-box-compact' : ''}`}
      id="search-form"
    >
      <div className="search-box-inner">
        {/* From */}
        <div className="search-field">
          <label className="search-field-label">
            <FiMapPin className="sf-icon sf-icon-from" /> Điểm đi
          </label>
          <select
            className="search-field-input form-select"
            value={form.from}
            onChange={handle('from')}
            id="search-from"
          >
            <option value="">-- Chọn điểm đi --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Swap button */}
        <button
          type="button"
          className="search-swap"
          onClick={swap}
          aria-label="Đổi điểm đi/đến"
        >
          <FiRefreshCw size={18} />
        </button>

        {/* To */}
        <div className="search-field">
          <label className="search-field-label">
            <FiMapPin className="sf-icon sf-icon-to" /> Điểm đến
          </label>
          <select
            className="search-field-input form-select"
            value={form.to}
            onChange={handle('to')}
            id="search-to"
          >
            <option value="">-- Chọn điểm đến --</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="search-divider" />

        {/* Date */}
        <div className="search-field">
          <label className="search-field-label">
            <FiCalendar className="sf-icon" /> Ngày đi
          </label>
          <input
            type="date"
            className="search-field-input"
            value={form.date}
            min={today}
            onChange={handle('date')}
            id="search-date"
          />
        </div>

        <div className="search-divider" />

        {/* Passengers */}
        <div className="search-field search-field-sm">
          <label className="search-field-label">
            <FiUsers className="sf-icon" /> Số khách
          </label>
          <div className="passenger-counter">
            <button type="button" onClick={() => setForm(f => ({ ...f, passengers: Math.max(1, f.passengers - 1) }))} disabled={form.passengers <= 1}>−</button>
            <span>{form.passengers}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, passengers: Math.min(10, f.passengers + 1) }))} disabled={form.passengers >= 10}>+</button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="search-submit btn btn-primary" id="search-btn">
          <FiSearch size={18} />
          <span>{compact ? 'Tìm' : 'Tìm chuyến'}</span>
        </button>
      </div>

      {error && <p className="search-error"><span>⚠️</span> {error}</p>}
    </form>
  );
};

export default SearchBox;
