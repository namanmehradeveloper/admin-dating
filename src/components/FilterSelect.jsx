// Labelled <select> for list filters. The first option means "no filter".

import { formatEnum } from '../utils/format.js';

export default function FilterSelect({ label, value, options, onChange, allLabel = 'All' }) {
  return (
    <label className="field field--inline">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatEnum(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
