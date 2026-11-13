// Page frame for signed-in staff: sidebar (drawer on mobile/zoom), top bar and the routed page.

import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';

const DESKTOP_NAV_QUERY = '(min-width: 1101px)';
const COLLAPSE_STORAGE_KEY = 'datingcloud.admin.sidebarCollapsed';

function readCollapsedPreference() {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopNav, setIsDesktopNav] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(DESKTOP_NAV_QUERY).matches;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readCollapsedPreference);
  const layoutRef = useRef(null);
  const collapsed = isSidebarCollapsed && isDesktopNav;

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    const syncViewport = () => {
      setIsDesktopNav(media.matches);
      if (media.matches) setIsMenuOpen(false);
    };
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, isSidebarCollapsed ? '1' : '0');
    } catch {
      // Ignore private-mode / blocked storage.
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trigger = document.activeElement;
    const panel = layoutRef.current?.querySelector('.sidebar');
    const focusables = () => [...(panel?.querySelectorAll('a[href], button:not([disabled])') ?? [])].filter((el) => el.getClientRects().length);
    focusables()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
      if (event.key !== 'Tab') return;
      const elements = focusables();
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={layoutRef}
      className={`layout${isMenuOpen ? ' layout--menu-open' : ''}${collapsed ? ' layout--sidebar-collapsed' : ''}`}
    >
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar
        isOpen={isMenuOpen}
        onNavigate={() => setIsMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={isDesktopNav ? () => setIsSidebarCollapsed((value) => !value) : undefined}
      />
      {isMenuOpen && <div className="drawer-backdrop" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />}
      <div className="layout__main" inert={isMenuOpen || undefined}>
        <Header isMenuOpen={isMenuOpen} onToggleMenu={() => setIsMenuOpen((open) => !open)} />
        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
