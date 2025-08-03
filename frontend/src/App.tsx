import { useContext, useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router-dom';

import Header from './components/Header';

import AboutPage from './routes/AboutPage';
import BodyPage from './routes/BodyPage';
import EditUserPage from './routes/EditUserPage';
import HomePage from './routes/HomePage';
import LogInPage from './routes/LogInPage';
import LogOutPage from './routes/LogOutPage';
import ManagePatients from './routes/ManagePatients';
import PatientSubmissions from './routes/PatientSubmissions';
import RemovePatient from './routes/RemovePatient';
import SignUpPage from './routes/SignUpPage';
import UserPage from './routes/UserPage';

import AuthTokenContext from './AuthTokenContext';

import './App.css';

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Header />,
    children: [
      {
        path: "",
        element: <HomePage />
      },
      {
        path: "about",
        element: <AboutPage />
      },
      {
        path: "body",
        element: <BodyPage />
      },
      {
        path: "edit-user",
        element: <EditUserPage />
      },
      {
        path: "log-in",
        element: <LogInPage />
      },
      {
        path: "log-out",
        element: <LogOutPage />
      },
      {
        path: "patient-submissions",
        element: <PatientSubmissions />
      },
      {
        path: "patients",
        element: <ManagePatients />
      },
      {
        path: "remove-patient",
        element: <RemovePatient />
      },
      {
        path: "sign-up",
        element: <SignUpPage />
      },
      {
        path: "user",
        element: <UserPage />
      }
    ]
  }
]);

export default function App() {
  const [ token, setToken ] = useState<string | null>(useContext(AuthTokenContext).token);

  function setTokenWrapper(token: string | null) {
    if(token === null) {
      localStorage.removeItem('authtoken');
    } else {
      localStorage.setItem('authtoken', token);
    }
    setToken(token);
  }
  
  return (
    <AuthTokenContext.Provider value={{ token, setToken: setTokenWrapper }}>
      <RouterProvider router={appRouter} />
    </AuthTokenContext.Provider>
  );
}
