// Grouped navigation links allowed for the signed-in role. On small screens it is a drawer.

import { NavLink } from 'react-router-dom';
import {
  Activity,
  Ban,
  Beaker,
  Bell,
  CreditCard,
  FileText,
  Flag,
  Gift,
  Heart,
  Headset,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Monitor,
  Phone,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { NAV_GROUPS, roleSatisfies } from '../utils/constants.js';

const NAV_ICONS = {
  '/dashboard': LayoutDashboard,
  '/users': Users,
  '/staff': Shield,
  '/verifications': ShieldCheck,
  '/matches': Heart,
  '/swipes': Sparkles,
  '/messaging': MessageSquare,
  '/blocks': Ban,
  '/calls': Phone,
  '/reports': Flag,
  '/fraud': ShieldAlert,
  '/subscriptions': CreditCard,
  '/payments': Wallet,
  '/coupons': Ticket,
  '/referrals': Gift,
  '/notifications': Bell,
  '/cms': FileText,
  '/experiments': Beaker,
  '/support': Headset,
  '/analytics': LineChart,
  '/monitoring': Monitor,
  '/audit-logs': ScrollText,
  '/security/login-activity': ShieldCheck,
  '/settings': Settings,
};

export default function Sidebar({ isOpen, onNavigate }) {
  const { user } = useAuth();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        roleSatisfies(user.role, item.roles) &&
        (!item.permission || user.permissionKeys?.includes(item.permission)),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className={isOpen ? 'sidebar sidebar--open' : 'sidebar'} aria-label="Main navigation">
      <div className="sidebar__inner">
        <NavLink to="/dashboard" className="sidebar__brand" onClick={onNavigate}>
          <span className="sidebar__mark" aria-hidden>
            <Heart size={15} strokeWidth={2.5} />
          </span>
          <div className="sidebar__brand-text">
            <strong>Dating Cloud</strong>
            <span>Admin</span>
          </div>
        </NavLink>

        <nav className="sidebar__nav">
          {groups.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-group__label">{group.label}</div>
              <div className="nav-group__items">
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.to] ?? Activity;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
                      onClick={onNavigate}
                    >
                      <span className="nav-link__icon" aria-hidden>
                        <Icon size={15} strokeWidth={2.1} />
                      </span>
                      <span className="nav-link__label">
                        {item.label}
                        {item.badge ? <span className="nav-link__soon">{item.badge}</span> : null}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
