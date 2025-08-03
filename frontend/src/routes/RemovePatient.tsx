import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { IPatientData } from '../types';
import { getBackend, postBackend, useSetPageTitle } from '../utils';

export default function RemovePatient() {
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const [patient, setPatient] = useState<IPatientData | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState("");

  const patientKey = searchParams.get('id');

  const { token } = useContext(AuthTokenContext);

  useSetPageTitle("Remove Patient");

  useEffect(() => {
    if(!token) {
      navigate('/log-in');
      return;
    }
    if(!patientKey) {
      setMessage("No patient ID was provided.");
      return;
    }
    setTimeout(async () => {
      const result = await getBackend('doctor-patients', token);
      if(!result.ok) {
        setMessage(result.body.message || `Error ${result.status}.`);
        return;
      }
      const thePatient = (result.body as IPatientData[]).find(p => p.shareKey === patientKey);
      if(!thePatient) {
        setMessage("The given patient ID was not found.");
        return;
      }
      setPatient(thePatient);
    });
  }, []);

  async function addPatient() {
    if(!token) {
      return;
    }
    
    setIsRemoving(true);
    
    const result = await postBackend('remove-patient', { key: patientKey }, token);
    setIsRemoving(false);
    if(!result.ok) {
      setMessage(result.body.message || `Error ${result.status}.`);
      return;
    }
    navigate('/patients');
  }
  
  return (
    <section>
      <h2>Remove Patient</h2>
      <ErrorMessage message={message} />
      {patient && (
        <>
          <p>Remove patient {patient.name} (ID {patient.shareKey})?</p>
          <button onClick={addPatient} disabled={isRemoving}>
            {isRemoving ? "Working..." : "Remove Patient"}
          </button>
          <div style={{ height: "1em" }} />
          <button onClick={() => navigate(-1)} disabled={isRemoving}>
            Cancel
          </button>
        </>
      )}
    </section>
  );
}
