// Row / drawer action menu: view, warn, suspend, ban, schedule deletion, open full page.
// Dropdown is portaled + fixed so table overflow does not clip it.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, Eye, ExternalLink, MoreHorizontal, ShieldAlert, ShieldOff, Trash2, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { formatEnum } from '../../utils/format.js';
import { allowedStatuses } from './UserStatusDialog.jsx';

const QUICK_ACTIONS = [
  { status: 'ACTIVE', label: 'Set Active', icon: ShieldOff },
  { status: 'SUSPENDED', label: 'Set Inactive', icon: UserX },
  { status: 'WARNED', label: 'Warn', icon: ShieldAlert },
  { status: 'BANNED', label: 'Ban', icon: Ban },
];

const MENU_WIDTH = 240;

export default function UserActionsMenu({
  account,
  staff,
  onView,
  onStatusAction,
  onDeleteAction,
  align = 'right',
}) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const options = allowedStatuses(staff, account);
  const actions = QUICK_ACTIONS.filter((action) => options.includes(action.status) && action.status !== account.status);
  const canDelete =
    Boolean(onDeleteAction) &&
    isAdmin &&
    account?.role === 'USER' &&
    !account?.deletionScheduled &&
    account?.deletion?.status !== 'SCHEDULED';

  function updatePosition() {
    const trigger = rootRef.current?.querySelector('.action-menu__trigger');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight;
    const top = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
    const left =
      align === 'left'
        ? Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)
        : Math.max(8, rect.right - MENU_WIDTH);
    setCoords({ top: Math.max(8, top), left });
  }

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      const inTrigger = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!account) return null;

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className="action-menu__dropdown action-menu__dropdown--portal"
          role="menu"
          style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
        >
          {onView && (
            <button
              type="button"
              className="action-menu__item"
              role="menuitem"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                onView(account);
              }}
            >
              <Eye size={14} aria-hidden />
              View
            </button>
          )}
          <Link
            to={`/users/${account.id}`}
            className="action-menu__item"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
          >
            <ExternalLink size={14} aria-hidden />
            Open full page
          </Link>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.status}
                type="button"
                className={`action-menu__item ${action.status === 'BANNED' || action.status === 'SUSPENDED' ? 'action-menu__item--danger' : ''}`}
                role="menuitem"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(false);
                  onStatusAction(action.status);
                }}
              >
                <Icon size={14} aria-hidden />
                {action.label}
                <span className="muted small">→ {formatEnum(action.status)}</span>
              </button>
            );
          })}
          {canDelete && (
            <button
              type="button"
              className="action-menu__item action-menu__item--danger"
              role="menuitem"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                onDeleteAction(account);
              }}
            >
              <Trash2 size={14} aria-hidden />
              Delete user
              <span className="muted small">14-day grace</span>
            </button>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={`action-menu action-menu--${align}`} ref={rootRef}>
      <button
        type="button"
        className="button button--secondary button--small action-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal size={16} aria-hidden />
        <span className="sr-only">Actions</span>
      </button>
      {menu}
    </div>
  );
}
