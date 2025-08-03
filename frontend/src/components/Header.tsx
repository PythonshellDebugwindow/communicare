import { useContext } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import AuthTokenContext from '../AuthTokenContext';

export default function Header() {
  const routerLocation = useLocation();

  const { token } = useContext(AuthTokenContext);

  const hide = routerLocation.pathname === '/body';

  return (
    <>
      <header className="header">
        <h1>
          <Link to={hide ? location.href : "/"}>
            <img src="/logo.png" />
            CommuniCare
          </Link>
        </h1>
        <ul style={hide ? { display: "none" } : undefined}>
          <li>
            <Link to="/about">About</Link>
          </li>
          {!token && (
            <>
              <li>
                <Link to="/log-in">Log In</Link>
              </li>
              <li>
                <Link to="/sign-up">Sign Up</Link>
              </li>
            </>
          )}
          {token && (
            <>
              <li>
                <Link to="/user">Your Hub</Link>
              </li>
              <li>
                <Link to="/log-out">Log Out</Link>
              </li>
            </>
          )}
        </ul>
      </header>
      <Outlet />
    </>
  );
}
