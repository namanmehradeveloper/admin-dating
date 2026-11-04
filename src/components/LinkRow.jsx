// Table row that opens a detail page on click, or on Enter when focused with the keyboard.

import { useNavigate } from 'react-router-dom';

export default function LinkRow({ to, children }) {
  const navigate = useNavigate();

  // Opens the row's page unless the click landed on a link or button inside the row.
  function handleClick(event) {
    if (event.target.closest('a, button')) return;
    navigate(to);
  }

  // Lets keyboard users open the row with Enter.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && event.target === event.currentTarget) navigate(to);
  }

  return (
    <tr className="table__row--link" tabIndex={0} role="link" onClick={handleClick} onKeyDown={handleKeyDown}>
      {children}
    </tr>
  );
}
