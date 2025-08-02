import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { postBackend, useSetPageTitle } from '../utils';

export default function LogInPage() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [message, setMessage] = useState("");

  const { setToken } = useContext(AuthTokenContext);

  useSetPageTitle("Log Up");

  async function runLogIn() {
    setIsLoggingIn(true);
    
    const result = await postBackend('log-in', { username, password });
    setIsLoggingIn(false);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }
    setToken(result.body.token);
    navigate('/user');
  }

  return (
    <section>
      <h2>Log In</h2>
      <p>Continue with CommuniCare as a healthcare professional by logging into your doctor account below.</p>
      <p>
        If you don't have an account yet, you can <Link to="/sign-up">sign up</Link> instead.
      </p>
      <ErrorMessage message={message} />
      <form className="sign-up-form">
        <table>
          <tbody>
            <tr>
              <td>
                <label htmlFor="username">
                  Username:
                </label>
              </td>
              <td>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="password">
                  Password:
                </label>
              </td>
              <td>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
      <button
        type="button"
        onClick={runLogIn}
        disabled={isLoggingIn}
      >
        {isLoggingIn ? "Working..." : "Log In"}
      </button>
    </section>
  );
}
