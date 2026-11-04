// Root component: shows a loader while the saved session is restored, then the routes.

import AppRoutes from './routes/AppRoutes.jsx';
import { useAuth } from './hooks/useAuth.js';
import LoadingState from './components/LoadingState.jsx';

export default function App() {
  const { isRestoring } = useAuth();
  if (isRestoring) return <LoadingState label="Restoring your session…" fullScreen />;
  return <AppRoutes />;
}
