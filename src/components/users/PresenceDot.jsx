// Online / offline indicator next to a member name.

export default function PresenceDot({ online, lastActiveAt }) {
  return (
    <span
      className={`presence-dot ${online ? 'presence-dot--online' : 'presence-dot--offline'}`}
      title={online ? 'Online now' : lastActiveAt ? `Last active ${lastActiveAt}` : 'Offline'}
      aria-label={online ? 'Online' : 'Offline'}
    />
  );
}
