// Avatar and name of a member card ({ id, displayName, photoUrl }) linking to the user page.
// Optional `subtitle` (e.g. email) stacks under the name for denser list rows.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function UserCell({ user, link = true, subtitle }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [user?.photoUrl]);

  if (!user) return <span className="muted">—</span>;
  const initial = user.displayName?.charAt(0)?.toUpperCase() ?? '?';
  const label = subtitle ? (
    <span className="user-cell__text">
      <span className="user-cell__name">{user.displayName}</span>
      <span className="user-cell__subtitle">{subtitle}</span>
    </span>
  ) : (
    <span>{user.displayName}</span>
  );
  const showPhoto = Boolean(user.photoUrl) && !photoFailed;
  const content = (
    <>
      {showPhoto ? (
        <img className="avatar" src={user.photoUrl} alt="" loading="lazy" onError={() => setPhotoFailed(true)} />
      ) : (
        <span className="avatar avatar--placeholder">{initial}</span>
      )}
      {label}
    </>
  );
  if (!link || user.status === 'DELETED') return <span className="user-cell">{content}</span>;
  return (
    <Link className="user-cell" to={`/users/${user.id}`}>
      {content}
    </Link>
  );
}
