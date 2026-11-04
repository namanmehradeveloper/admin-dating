// Compact pill-style switch between a few options (e.g. 7d / 30d / 90d).

export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="segmented-control" role="tablist" aria-label={label}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`segmented-control__option${isActive ? ' segmented-control__option--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
