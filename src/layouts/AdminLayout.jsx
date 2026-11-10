// Page frame for signed-in staff: sidebar (drawer on mobile/zoom), top bar and the routed page.

import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';

const DESKTOP_NAV_QUERY = '(min-width: 1101px)';

export default function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const layoutRef = useRef(null);

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
    <div ref={layoutRef} className={`layout${isMenuOpen ? ' layout--menu-open' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar isOpen={isMenuOpen} onNavigate={() => setIsMenuOpen(false)} />
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
