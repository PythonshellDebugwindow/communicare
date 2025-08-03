import { useContext } from 'react';
import { useNavigate } from 'react-router';

import AuthTokenContext from '../AuthTokenContext';
import { useSetPageTitle } from '../utils';

export default function LogOutPage() {
  const navigate = useNavigate();

  const { setToken } = useContext(AuthTokenContext);

  useSetPageTitle("Log Out");

  async function runLogOut() {
    setToken(null);
    navigate('/');
  }

  return (
    <section>
      <h2>Log Out</h2>
      <p>Log out of your doctor account?</p>
      <button onClick={runLogOut}>
        Log Out
      </button>
      <div style={{ height: "1em" }} />
      <button onClick={() => navigate(-1)}>
        Cancel
      </button>
    </section>
  );
}
