// Header dropdown with the signed-in staff account and the logout button.

import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { formatEnum } from '../utils/format.js';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => event.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  // Signs out; the button shows progress because the server call can take a moment.
  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
  }

  const initial = user.email?.charAt(0)?.toUpperCase() ?? '?';
  const roleLabel = formatEnum(user.role);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={`user-menu__button${isOpen ? ' user-menu__button--open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="avatar avatar--placeholder user-menu__avatar">{initial}</span>
        <span className="user-menu__meta">
          <span className="user-menu__email">{user.email}</span>
          <span className="user-menu__role">{roleLabel}</span>
        </span>
        <ChevronDown size={15} strokeWidth={2.2} className="user-menu__chevron" aria-hidden />
      </button>
      {isOpen && (
        <div className="user-menu__dropdown" role="menu">
          <div className="user-menu__info">
            <span className="avatar avatar--placeholder user-menu__info-avatar">{initial}</span>
            <div className="user-menu__info-text">
              <strong>{user.email}</strong>
              <span className="user-menu__role-chip">{roleLabel}</span>
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="user-menu__logout"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={15} strokeWidth={2.1} aria-hidden />
            {isLoggingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}
