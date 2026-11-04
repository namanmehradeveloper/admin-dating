// Shown for unknown admin URLs.

import { Heart, LayoutDashboard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-card__mark" aria-hidden>
          <Heart size={20} strokeWidth={2.4} />
        </span>
        <h1>Page not found</h1>
        <p>That admin route does not exist, or you may not have access to it.</p>
        <div className="not-found-card__actions">
          <Link to="/dashboard" className="button button--primary">
            <LayoutDashboard size={15} aria-hidden />
            Dashboard
          </Link>
          <Link to="/users" className="button button--secondary">
            <Users size={15} aria-hidden />
            Members
          </Link>
        </div>
      </div>
    </div>
  );
}
