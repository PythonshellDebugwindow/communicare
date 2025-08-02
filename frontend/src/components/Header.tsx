import { Link, Outlet } from 'react-router-dom';

export default function Header() {
  return (
    <>
      <header className="header">
        <h1>
          <Link to="/">
            <img src="/logo.png" />
            CommuniCare
          </Link>
        </h1>
        <ul>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/log-in">Log In</Link>
          </li>
          <li>
            <Link to="/sign-up">Sign Up</Link>
          </li>
        </ul>
      </header>
      <Outlet />
    </>
  );
}
