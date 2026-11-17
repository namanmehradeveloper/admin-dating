// Staff sign-in with email/password. Member accounts are refused.

import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, LockKeyhole, ShieldCheck } from 'lucide-react';
import { AccessDeniedError } from '../context/AuthContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../utils/errors.js';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <aside className="login__panel">
        <div className="login__media" aria-hidden>
          <img src="/images/couple.jpg" alt="" className="login__photo" />
          <div className="login__wash" />
          <div className="login__grain" />
        </div>

        <div className="login__panel-inner">
          <div className="login__brand">
            <span className="login__mark" aria-hidden>
              <Heart size={20} strokeWidth={2.4} fill="currentColor" />
            </span>
            <div className="login__brand-text">
              <strong>Dating Cloud</strong>
              <span>Admin</span>
            </div>
          </div>

          <div className="login__hero">
            <h1>
              Keep the
              <em> community </em>
              trusted.
            </h1>
            <p>Staff tools for members, safety, and the day-to-day of Dating Cloud.</p>
          </div>

          <p className="login__panel-foot">
            <LockKeyhole size={14} aria-hidden />
            Restricted console · authorized staff only
          </p>
        </div>
      </aside>

      <main className="login__main">
        <form className="login__card" onSubmit={handleSubmit} noValidate>
          <div className="login__form-brand" aria-hidden>
            <span className="login__mark login__mark--soft">
              <Heart size={18} strokeWidth={2.4} fill="currentColor" />
            </span>
          </div>

          <span className="login__eyebrow">Staff sign in</span>
          <h2>Welcome back</h2>
          <p className="muted">Enter your work email and password to open the admin console.</p>

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
            <div className="login__password">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="login__reveal"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="button button--primary button--block" disabled={isSubmitting || !email || !password}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="login__footnote">
            <ShieldCheck size={14} aria-hidden />
            Authorized staff access only
          </p>
        </form>
      </main>
    </div>
  );
}
