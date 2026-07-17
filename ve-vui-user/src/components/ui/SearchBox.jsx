// components/ui/SearchBox.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiUsers, FiMapPin, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useBooking } from '../../context/BookingContext';
import { cityApi, tripApi } from '../../services/api';
import './SearchBox.css';

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const MiniCalendar = ({ availableDates, selected, onSelect }) => {
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const availableSet = useMemo(() => new Set(availableDates || []), [availableDates]);

  const yearMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthLabel = `Tháng ${viewMonth + 1} / ${viewYear}`;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background:'#fff', border:'1px solid var(--gray-200)', borderRadius:8, padding:'8px', width:'100%', maxWidth:320 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, padding:'0 4px' }}>
        <button type="button" onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', padding:4, borderRadius:4, display:'flex' }}><FiChevronLeft size={16}/></button>
        <span style={{ fontWeight:700, fontSize:'0.85rem' }}>{monthLabel}</span>
        <button type="button" onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', padding:4, borderRadius:4, display:'flex' }}><FiChevronRight size={16}/></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:2, textAlign:'center' }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--gray-400)', padding:'2px 0' }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`}/>;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          const hasTrip = availableSet.has(dateStr);
          const isSelected = dateStr === selected;
          const isDisabled = isPast || !hasTrip;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(dateStr)}
              style={{
                width:32, height:32, borderRadius:6, border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                background: isSelected ? 'var(--primary)' : isDisabled ? 'transparent' : hasTrip ? '#ECFDF5' : 'transparent',
                color: isSelected ? '#fff' : isDisabled ? 'var(--gray-300)' : hasTrip ? '#059669' : 'var(--gray-400)',
                fontWeight: isSelected ? 800 : hasTrip ? 700 : 400,
                fontSize:'0.8rem', cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition:'all 0.15s',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      {availableDates.length > 0 && (
        <div style={{ fontSize:'0.7rem', color:'var(--gray-400)', textAlign:'center', marginTop:4 }}>
          Green = có chuyến
        </div>
      )}
    </div>
  );
};

const SearchBox = ({ compact = false }) => {
  const navigate    = useNavigate();
  const { setSearch } = useBooking();
  const [cities, setCities] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showCal, setShowCal] = useState(false);

  const [form, setForm] = useState({
    from: '',
    to: '',
    date: todayStr,
    passengers: 1,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    cityApi.getAll().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setCities(data);
        setForm(f => ({
          ...f,
          from: f.from || data[0]?.name || '',
          to: f.to || (data.length > 1 ? data[1]?.name : data[0]?.name) || '',
        }));
      }
    }).catch(() => {});
  }, []);

  const loadAvailableDates = useCallback(async (from, to) => {
    if (!from || !to || from === to) { setAvailableDates([]); return; }
    setLoadingDates(true);
    try {
      const data = await tripApi.getAvailableDates(from, to);
      setAvailableDates(Array.isArray(data) ? data.map(d => d.date) : []);
    } catch { setAvailableDates([]); }
    setLoadingDates(false);
  }, []);

  useEffect(() => {
    if (form.from && form.to && form.from !== form.to) {
      loadAvailableDates(form.from, form.to);
    }
  }, [form.from, form.to, loadAvailableDates]);

  const swap = () => setForm(f => ({ ...f, from: f.to, to: f.from }));

  const handle = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const selectDate = (dateStr) => {
    setForm(f => ({ ...f, date: dateStr }));
    setShowCal(false);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Chọn ngày';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit', year:'numeric' });
  };

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
            {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
            {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="search-divider" />

        {/* Date */}
        <div className="search-field" style={{ position:'relative' }}>
          <label className="search-field-label">
            <FiCalendar className="sf-icon" /> Ngày đi
            {loadingDates && <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginLeft: 4 }}>đang tải...</span>}
          </label>
          <button
            type="button"
            className="search-field-input"
            onClick={() => setShowCal(c => !c)}
            style={{ textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', background: showCal ? '#fff' : undefined, borderColor: showCal ? 'var(--primary)' : undefined }}
            id="search-date"
          >
            <span>{form.date ? formatDateDisplay(form.date) : 'Chọn ngày'}</span>
            <FiCalendar size={14} style={{ color:'var(--gray-400)' }} />
          </button>
          {showCal && (
            <div style={{ position:'absolute', top:'100%', left:0, zIndex:100, marginTop:4, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', borderRadius:8 }}>
              <MiniCalendar availableDates={availableDates} selected={form.date} onSelect={selectDate} />
            </div>
          )}
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
