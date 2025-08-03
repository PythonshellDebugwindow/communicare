import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { getBackend, postBackend, useSetPageTitle } from '../utils';

export default function EditUserPage() {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { token, setToken } = useContext(AuthTokenContext);

  useSetPageTitle("Edit User Data");
  
  useEffect(() => {
    if(!token) {
      navigate('/log-in');
      return;
    }
    setTimeout(async () => {
      const response = await getBackend('user-data', token);
      if(!response.ok) {
        if(response.body.message === "Please log in") {
          navigate('/log-in');
          setToken(null);
        } else {
          setMessage(response.body.message);
        }
        return;
      }
      setName(response.body.name);
      setEmail(response.body.email);
    });
  }, []);

  async function runEditUser() {
    if(!token) {
      return;
    }

    setIsSaving(true);
    
    const result = await postBackend('edit-user', { name, email }, token);
    setIsSaving(false);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }
    navigate('/user');
  }

  return (
    <section>
      <h2>Edit User</h2>
      <p>Edit your username and password.</p>
      <ErrorMessage message={message} />
      <form className="sign-up-form">
        <table>
          <tbody>
            <tr>
              <td>
                <label htmlFor="name">
                  Name:
                </label>
              </td>
              <td>
                <input
                  type="text"
                  id="username"
                  value={name}
                  onChange={e => setName(e.target.value)}
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
          </tbody>
        </table>
      </form>
      <button
        type="button"
        onClick={runEditUser}
        disabled={isSaving}
      >
        {isSaving ? "Working..." : "Save Changes"}
      </button>
    </section>
  );
}
