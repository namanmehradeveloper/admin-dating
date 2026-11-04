// Persists light/dark preference on documentElement.

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dc_admin_theme';

function readTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => (typeof window === 'undefined' ? 'light' : readTheme()));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="topbar__icon-btn"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
    >
      {isDark ? <Sun size={17} strokeWidth={2.1} aria-hidden /> : <Moon size={17} strokeWidth={2.1} aria-hidden />}
    </button>
  );
}
