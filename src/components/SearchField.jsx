// Shared admin search control — icon, clear, consistent focus chrome.

import { Search, X } from 'lucide-react';

export default function SearchField({
  value,
  onChange,
  onClear,
  placeholder = 'Search…',
  label,
  maxLength = 100,
  grow = true,
  id,
  name = 'q',
  className = '',
}) {
  const hasValue = Boolean(String(value ?? '').length);

  function handleClear(event) {
    event.preventDefault();
    onChange('');
    onClear?.();
  }

  const control = (
    <span className={`admin-search${grow ? ' admin-search--grow' : ''}${className ? ` ${className}` : ''}`}>
      <Search size={15} strokeWidth={2.2} className="admin-search__icon" aria-hidden />
      <input
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
      />
      {hasValue ? (
        <button type="button" className="admin-search__clear" onClick={handleClear} aria-label="Clear search">
          <X size={14} strokeWidth={2.2} />
        </button>
      ) : null}
    </span>
  );

  if (label) {
    return (
      <label className={`field field--inline${grow ? ' field--grow' : ''}`}>
        <span>{label}</span>
        {control}
      </label>
    );
  }

  return <label className={`admin-search-label${grow ? ' admin-search-label--grow' : ''}`}>{control}</label>;
}
