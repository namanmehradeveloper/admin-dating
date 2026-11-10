// Contextual breadcrumbs; existing theme and account controls are preserved.
import { ChevronRight, Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import UserMenu from './UserMenu.jsx';
import { getPagePresentation } from './navigation.js';

export default function Header({ onToggleMenu, isMenuOpen = false }) {
  const { pathname } = useLocation();
  const page = getPagePresentation(pathname);
  return (
    <header className="topbar">
      <div className="topbar__leading">
        <button type="button" className="topbar__menu" onClick={onToggleMenu}
          aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMenuOpen} aria-controls="admin-navigation">
          {isMenuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
        <div className="topbar__breadcrumb" aria-label="Current section">
          <span className="topbar__workspace">Workspace</span>
          <ChevronRight size={14} aria-hidden />
          <span className="topbar__title">{page.label}</span>
        </div>
      </div>
      <div className="topbar__actions">
        <span className="topbar__environment">Admin console</span>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
