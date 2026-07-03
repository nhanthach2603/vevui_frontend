import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchInput = ({ value, onChange, debounceMs = 300, placeholder, ...props }) => {
  const [local, setLocal] = useState(value || '');
  const timer = useRef(null);

  useEffect(() => { setLocal(value || ''); }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounceMs);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:220 }}>
      <FiSearch style={{ color:'var(--gray-400)', flexShrink:0 }} />
      <input
        className="a-input"
        placeholder={placeholder || 'Tim kiem...'}
        value={local}
        onChange={handleChange}
        style={{ border:'none', boxShadow:'none', padding:'4px 0' }}
        {...props}
      />
    </div>
  );
};

export default SearchInput;
