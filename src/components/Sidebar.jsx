// Grouped navigation links allowed for the signed-in role. On small screens it is a drawer.
// Collapse state is visual only — routes, roles and permissions stay unchanged.

import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  ChevronDown,
  Heart,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { NAV_GROUPS, roleSatisfies } from '../utils/constants.js';
import { NAV_ICONS } from './navigation.js';

function groupContainsPath(group, pathname) {
  return group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

export default function Sidebar({ isOpen, onNavigate, collapsed = false, onToggleCollapse }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            roleSatisfies(user.role, item.roles) &&
            (!item.permission || user.permissionKeys?.includes(item.permission)),
        ),
      })).filter((group) => group.items.length > 0),
    [user.permissionKeys, user.role],
  );

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    for (const group of NAV_GROUPS) {
      initial[group.label] = true;
    }
    return initial;
  });

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current };
      let changed = false;
      for (const group of groups) {
        if (groupContainsPath(group, pathname) && !next[group.label]) {
          next[group.label] = true;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [groups, pathname]);

  const toggleGroup = (label) => {
    if (collapsed) return;
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
  };

  return (
    <aside
      id="admin-navigation"
      className={`sidebar${isOpen ? ' sidebar--open' : ''}${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Main navigation"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className="sidebar__inner">
        <div className="sidebar__brand-row">
          <NavLink
            to="/dashboard"
            className="sidebar__brand"
            onClick={onNavigate}
            title={collapsed ? 'DatingCloud Administration' : undefined}
          >
            <span className="sidebar__mark" aria-hidden>
              <Heart size={18} strokeWidth={2.2} fill="currentColor" />
            </span>
            <div className="sidebar__brand-text">
              <strong>
                Dating<span className="sidebar__brand-accent">Cloud</span>
              </strong>
              <span>Admin console</span>
            </div>
          </NavLink>
          <button type="button" className="sidebar__close" onClick={onNavigate} aria-label="Close navigation">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="sidebar__workspace" title={collapsed ? 'Admin workspace' : undefined}>
          <span className="sidebar__workspace-icon" aria-hidden>
            <ShieldCheck size={16} strokeWidth={2} />
          </span>
          <div className="sidebar__workspace-copy">
            <strong>Admin workspace</strong>
            <span>Community operations</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {groups.map((group) => {
            const isGroupOpen = collapsed || openGroups[group.label] !== false;
            const hasActive = groupContainsPath(group, pathname);

            return (
              <div
                key={group.label}
                className={`nav-group${isGroupOpen ? ' nav-group--open' : ''}${hasActive ? ' nav-group--active' : ''}`}
              >
                <button
                  type="button"
                  className="nav-group__label"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isGroupOpen}
                  disabled={collapsed}
                  title={collapsed ? group.label : undefined}
                >
                  <span>{group.label}</span>
                  <ChevronDown size={14} className="nav-group__chevron" aria-hidden />
                </button>

                <div
                  className={`nav-group__panel${isGroupOpen ? ' nav-group__panel--open' : ''}`}
                  aria-hidden={!isGroupOpen}
                >
                  <div className="nav-group__panel-inner">
                    <div className="nav-group__items">
                      {group.items.map((item) => {
                        const Icon = NAV_ICONS[item.to] ?? Activity;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
                            onClick={onNavigate}
                            title={collapsed ? item.label : undefined}
                            data-tooltip={item.label}
                          >
                            <span className="nav-link__icon" aria-hidden>
                              <Icon size={18} strokeWidth={1.85} />
                            </span>
                            <span className="nav-link__label">
                              {item.label}
                              {item.badge ? <span className="nav-link__soon">{item.badge}</span> : null}
                            </span>
                            {collapsed ? (
                              <span className="nav-link__tooltip" role="tooltip">
                                {item.label}
                                {item.badge ? ` · ${item.badge}` : ''}
                              </span>
                            ) : null}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__footer-meta">
            <ShieldCheck size={15} aria-hidden />
            <span>Staff access only</span>
          </div>
          {typeof onToggleCollapse === 'function' ? (
            <button
              type="button"
              className="sidebar__collapse"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={17} aria-hidden /> : <PanelLeftClose size={17} aria-hidden />}
              <span>{collapsed ? 'Expand' : 'Collapse'}</span>
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
