// Page frame for signed-in staff: sidebar (drawer on mobile/zoom), top bar and the routed page.

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';

const DESKTOP_NAV_QUERY = '(min-width: 1101px)';

export default function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    const closeOnDesktop = () => {
      if (media.matches) setIsMenuOpen(false);
    };
    closeOnDesktop();
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMenuOpen]);

  return (
    <div className={`layout${isMenuOpen ? ' layout--menu-open' : ''}`}>
      <Sidebar isOpen={isMenuOpen} onNavigate={() => setIsMenuOpen(false)} />
      {isMenuOpen && <div className="drawer-backdrop" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />}
      <div className="layout__main">
        <Header onToggleMenu={() => setIsMenuOpen((open) => !open)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
