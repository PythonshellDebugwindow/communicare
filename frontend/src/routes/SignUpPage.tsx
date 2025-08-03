import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { postBackend, useSetPageTitle } from '../utils';

export default function SignUpPage() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [message, setMessage] = useState("");

  const { setToken } = useContext(AuthTokenContext);

  useSetPageTitle("Sign Up");

  async function runSignUp() {
    setIsSigningUp(true);
    
    const result = await postBackend('sign-up', { name: username, email, password });
    setIsSigningUp(false);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }
    setToken(result.body.token);
    navigate('/user');
  }

  return (
    <section>
      <h2>Sign Up</h2>
      <p>Get started with CommuniCare as a healthcare professional by creating a doctor account below.</p>
      <p>
        If you already have an account, you can <Link to="/log-in">log in</Link> instead.
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
                <label htmlFor="email">
                  Email:
                </label>
              </td>
              <td>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
        onClick={runSignUp}
        disabled={isSigningUp}
      >
        {isSigningUp ? "Working..." : "Sign Up"}
      </button>
    </section>
  );
}
