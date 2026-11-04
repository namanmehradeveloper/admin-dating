// Lets signed-in staff through; others go to /login. With `roles`, staff without one of those
// roles see an access-denied message (the API refuses them anyway). SUPER_ADMIN inherits ADMIN.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { roleSatisfies } from '../utils/constants.js';

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roleSatisfies(user.role, roles)) {
    return (
      <div className="state state--error" role="alert">
        You do not have access to this page. It requires the {roles.join(' or ')} role.
      </div>
    );
  }
  return <Outlet />;
}
