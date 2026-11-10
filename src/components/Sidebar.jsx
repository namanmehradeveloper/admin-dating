// Grouped navigation links allowed for the signed-in role. On small screens it is a drawer.

import { NavLink } from 'react-router-dom';
import { Heart, Activity, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { NAV_GROUPS, roleSatisfies } from '../utils/constants.js';
import { NAV_ICONS } from './navigation.js';

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
    <aside id="admin-navigation" className={isOpen ? 'sidebar sidebar--open' : 'sidebar'} aria-label="Main navigation">
      <div className="sidebar__inner">
        <div className="sidebar__brand-row">
        <NavLink to="/dashboard" className="sidebar__brand" onClick={onNavigate}>
          <span className="sidebar__mark" aria-hidden>
            <Heart size={21} strokeWidth={2} />
          </span>
          <div className="sidebar__brand-text">
            <strong>Dating<span className="sidebar__brand-accent">Cloud</span></strong>
            <span>Administration</span>
          </div>
        </NavLink>
        <button type="button" className="sidebar__close" onClick={onNavigate} aria-label="Close navigation"><X size={19} aria-hidden /></button>
        </div>
        <div className="sidebar__workspace"><span className="sidebar__workspace-icon"><ShieldCheck size={18} aria-hidden /></span><div><strong>Admin workspace</strong><span>Community management</span></div></div>
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
                        <Icon size={18} strokeWidth={1.8} />
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
        <div className="sidebar__footer"><ShieldCheck size={16} aria-hidden /><span>Staff access only</span></div>
      </div>
    </aside>
  );
}
