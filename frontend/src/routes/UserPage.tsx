import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import ErrorMessage from '../components/ErrorMessage';

import AuthTokenContext from '../AuthTokenContext';
import { IDoctorData } from '../types';
import { getBackend, useSetPageTitle } from '../utils';

function UserPageData({ userData }: { userData: IDoctorData }) {
  return (
    <>
      <p>Name: {userData.name}</p>
      <p>Email: {userData.email}</p>
      <p>
        <Link to="/patients">View and manage your patients</Link>
      </p>
      <p>
        <Link to="/patient-submissions">View your patients' submissions</Link>
      </p>
      <p>
        <Link to="/edit-user">Edit your name or email</Link>
      </p>
    </>
  );
}

export default function UserPage() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState<IDoctorData | null>(null);
  const [message, setMessage] = useState("");

  const { token, setToken } = useContext(AuthTokenContext);

  useSetPageTitle("Doctor Hub");

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
      setUserData(response.body);
    });
  }, []);

  return (
    <section>
      <h2>Doctor Hub</h2>
      <ErrorMessage message={message} />
      {!userData && !message && <p>Working...</p>}
      {userData && token && (
        <UserPageData userData={userData} />
      )}
    </section>
  );
}
