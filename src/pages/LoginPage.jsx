// Staff sign-in with email/password. Member accounts are refused.

import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck, Users, Activity } from 'lucide-react';
import { AccessDeniedError } from '../context/AuthContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../utils/errors.js';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.state?.reason === 'expired' ? 'Your session expired. Please sign in again.' : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from ?? '/dashboard'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof AccessDeniedError ? loginError.message : getErrorMessage(loginError));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__panel" aria-hidden="false">
        <div className="login__glow login__glow--one" aria-hidden />
        <div className="login__glow login__glow--two" aria-hidden />
        <div className="login__panel-inner">
          <div className="login__brand">
            <span className="login__mark" aria-hidden>
              <Heart size={22} strokeWidth={2.4} />
            </span>
            <div className="login__brand-text">
              <strong>Dating Cloud</strong>
              <span>Admin console</span>
            </div>
          </div>

          <div className="login__hero">
            <h1>A better space for meaningful connections.</h1>
            <p>Your workspace for a trusted community. Manage members, support your team, and keep every connection moving forward.</p>
          </div>

          <ul className="login__points">
            <li>
              <span className="login__point-icon" aria-hidden>
                <Users size={16} strokeWidth={2.2} />
              </span>
              <div>
                <strong>Member oversight</strong>
                <span>Profiles, bans, and account actions</span>
              </div>
            </li>
            <li>
              <span className="login__point-icon" aria-hidden>
                <ShieldCheck size={16} strokeWidth={2.2} />
              </span>
              <div>
                <strong>Trust &amp; safety</strong>
                <span>Reports, blocks, and photo review</span>
              </div>
            </li>
            <li>
              <span className="login__point-icon" aria-hidden>
                <Activity size={16} strokeWidth={2.2} />
              </span>
              <div>
                <strong>Platform oversight</strong>
                <span>Dashboards and staff tools</span>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <main className="login__main">
        <form className="login__card" onSubmit={handleSubmit} noValidate>
          <span className="login__eyebrow">STAFF SIGN IN</span>
          <h2>Welcome back.</h2>
          <p className="muted">Welcome to DatingCloud. Enter your staff credentials to continue.</p>

          <label className="field">
            <span>Work email</span>
            <input
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button button--primary button--block" disabled={isSubmitting || !email || !password}>
            {isSubmitting ? 'Signing in…' : 'Sign in to your workspace'}
          </button>
          <p className="login__footnote"><ShieldCheck size={14} aria-hidden /> Authorized staff access only</p>
        </form>
      </main>
    </div>
  );
}
