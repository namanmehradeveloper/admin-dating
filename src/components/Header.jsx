// Top bar: menu button for the mobile drawer, brand, theme toggle and user menu.

import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import UserMenu from './UserMenu.jsx';

export default function Header({ onToggleMenu }) {
  return (
    <header className="topbar">
      <div className="topbar__leading">
        <button type="button" className="topbar__menu" onClick={onToggleMenu} aria-label="Open navigation">
          <Menu size={20} strokeWidth={2.2} aria-hidden />
        </button>
        <div className="topbar__context">
          <span className="topbar__eyebrow">Admin</span>
          <span className="topbar__title">Dating Cloud</span>
        </div>
      </div>
      <div className="topbar__actions">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
