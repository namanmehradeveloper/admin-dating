// Page title with optional subtitle, back link and actions on the right.

import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, backTo, backLabel = 'Back', actions }) {
  return (
    <header className="page-header">
      <div>
        {backTo && (
          <Link to={backTo} className="back-link">
            ← {backLabel}
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
