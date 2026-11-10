// Shared page identity, including a route-specific icon on every admin screen.
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getPagePresentation } from './navigation.js';

export default function PageHeader({ title, subtitle, backTo, backLabel = 'Back', actions }) {
  const { pathname } = useLocation();
  const { Icon, group } = getPagePresentation(pathname);
  return (
    <header className="page-header">
      <div className="page-header__identity">
        {backTo && <Link to={backTo} className="back-link"><ArrowLeft size={15} aria-hidden />{backLabel}</Link>}
        <div className="page-header__heading">
          <span className="page-header__icon" aria-hidden><Icon size={23} strokeWidth={1.8} /></span>
          <div className="page-header__copy"><span className="page-header__eyebrow">{group}</span><h1>{title}</h1></div>
        </div>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
