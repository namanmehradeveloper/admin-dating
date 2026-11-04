// Quick Active / Inactive buttons for the users table (Inactive = suspend / deactivate).

import { UserCheck, UserMinus } from 'lucide-react';
import { allowedStatuses } from './UserStatusDialog.jsx';

export default function UserActiveButtons({ account, staff, onStatusAction }) {
  const options = allowedStatuses(staff, account);
  const canActivate = options.includes('ACTIVE') && account.status !== 'ACTIVE';
  const canDeactivate = options.includes('SUSPENDED') && account.status !== 'SUSPENDED' && account.status !== 'BANNED';

  if (!canActivate && !canDeactivate) return null;

  return (
    <div className="user-active-buttons">
      {canActivate && (
        <button
          type="button"
          className="users-action-btn users-action-btn--active"
          title="Set account to Active"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStatusAction('ACTIVE');
          }}
        >
          <UserCheck size={14} aria-hidden />
          Active
        </button>
      )}
      {canDeactivate && (
        <button
          type="button"
          className="users-action-btn users-action-btn--inactive"
          title="Deactivate account (suspend)"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStatusAction('SUSPENDED');
          }}
        >
          <UserMinus size={14} aria-hidden />
          Inactive
        </button>
      )}
    </div>
  );
}
