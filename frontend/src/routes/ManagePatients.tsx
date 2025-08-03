import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { IPatientData } from '../types';
import { getBackend, postBackend } from '../utils';

function ViewPatients({ token }: { token: string }) {
  const [patients, setPatients] = useState<IPatientData[] | null>(null);
  const [lastCopied, setLastCopied] = useState(-1);
  const [message, setMessage] = useState("");

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  useEffect(() => {
    setTimeout(async () => {
      const result = await getBackend('doctor-patients', token);
      if(!result.ok) {
        setMessage(result.body.message || `Error ${result.status}.`);
        return;
      }
      setPatients(result.body);
    });
  }, []);

  return (
    <>
      <h3>Patients</h3>
      <ErrorMessage message={message} />
      {!patients && !message && <p>Working...</p>}
      {patients && patients.length === 0 && <p>You do not have any patients right now.</p>}
      {patients && patients.length > 0 && (
        <ul
          style={{ textAlign: "left", width: "fit-content", margin: "0 auto 15px", fontSize: "1.1em" }}
        >
          {patients.map((patient, i) => (
            <li key={i}>
              {patient.name} - {patient.shareKey}
              {" "}
              <a
                onClick={async e => {
                  await copyText(`${location.origin}/body?share=${patient.shareKey}`);
                  setLastCopied(i);
                  e.preventDefault();
                  return false;
                }}
                style={{ cursor: "pointer" }}
              >
                {i === lastCopied ? "(share link copied)" : "(copy share link)"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ManagePatients() {
  const navigate = useNavigate();
  const [pname, setPname] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");

  const { token } = useContext(AuthTokenContext);

  useEffect(() => {
    if(!token) {
      navigate('/log-in');
      return;
    }
  }, []);

  async function addPatient() {
    if(!token) {
      return;
    }
    
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
    <section>
      <h2>Manage Patients</h2>
      <p>
        <Link to="/user">Back to your hub</Link>
      </p>
      {token && <ViewPatients token={token} />}
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
            required
          />
        </label>
      </form>
      <button onClick={addPatient}>
        {isAdding ? "Working..." : "Add Patient"}
      </button>
    </section>
  );
}
