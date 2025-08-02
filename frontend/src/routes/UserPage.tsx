import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { getBackend, postBackend } from '../utils';

function UserPageData({ userData, token }: { userData: IUserData, token: string }) {
  const [pname, setPname] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");

  async function addPatient() {
    setIsAdding(true);
    
    const result = await postBackend('add-patient-data', { name: pname }, token);
    setIsAdding(false);
    if(!result.ok) {
      setMessage(result.body.message || `Error ${result.status}.`);
      return;
    }
    location.reload();
  }
  
  return (
    <>
      <p>Name: {userData.name}</p>
      <h3>Add Patient</h3>
      <ErrorMessage message={message} />
      <form style={{ marginBottom: "20px" }}>
        <label>
          Name:
          <input
            type="text"
            value={pname}
            onChange={e => setPname(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
        </label>
      </form>
      <button onClick={addPatient}>
        {isAdding ? "Working..." : "Add Patient"}
      </button>
    </>
  );
}

interface IUserData {
  name: string;
}

export default function UserPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [message, setMessage] = useState("");

  const { token } = useContext(AuthTokenContext);

  useEffect(() => {
    if(!token) {
      navigate('/log-in');
      return;
    }
    setTimeout(async () => {
      const response = await getBackend('user-data', token);
      if(!response.ok) {
        setMessage(response.body.message);
        return;
      }
      setUserData(response.body);
    });
  }, []);

  return (
    <section>
      <h2>View User (Doctor)</h2>
      <ErrorMessage message={message} />
      {!userData && !message && <p>Working...</p>}
      {userData && token && (
        <UserPageData
          userData={userData}
          token={token}
        />
      )}
    </section>
  );
}
