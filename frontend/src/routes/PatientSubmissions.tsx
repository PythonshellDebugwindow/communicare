import { useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';

import { BACKEND_URL, getBackend, useSetPageTitle } from '../utils';
import ErrorMessage from '../components/ErrorMessage';
import AuthTokenContext from '../AuthTokenContext';
import { useNavigate } from 'react-router';

interface IPatientSubmission {
  patientId: string;
  patientName: string;
  imagePath: string;
  symptoms: string[];
  additional: string;
  diagnosis: string;
}

export default function PatientSubmissions() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<IPatientSubmission[] | null>(null);
  const [message, setMessage] = useState("");

  const { token } = useContext(AuthTokenContext);

  useEffect(() => {
    if(!token) {
      navigate('/log-in');
      return;
    }

    setTimeout(async () => {
      const result = await getBackend('patient-submissions', token);
      if(!result.ok) {
        setMessage(result.body.message || `Error ${result.status}.`);
        return;
      }
      setSubmissions(result.body);
    });
  }, []);

  useSetPageTitle("Patient Submissions");

  return (
    <section>
      <h2>Patient Submissions</h2>
      <ErrorMessage message={message} />
      {!submissions && !message && <p>Working...</p>}
      {submissions && submissions.length === 0 && <p>No patient submissions found.</p>}
      {submissions && submissions.length > 0 && (
        <div>
          {submissions.map((submission, i) => (
            <div className="patient-submission" key={i}>
              <h3 style={{ marginBottom: "5px", fontSize: "2.2em" }}>
                Submission by {submission.patientName}
              </h3>
              <div style={{ display: "flex", justifyContent: "center", textAlign: "left" }}>
                <img
                  src={BACKEND_URL + submission.imagePath}
                  style={{ height: "500px", marginRight: "20px" }}
                />
                <div style={{ marginRight: "25px"}}>
                  <p style={{ marginTop: "0" }}>
                    <u><b>Symptoms:</b></u>
                    <br />
                    {
                      submission.symptoms.length > 0
                        ? submission.symptoms.join(", ")
                        : "none indicated"
                    }
                  </p>
                  {submission.additional && (
                    <p>
                      <u><b>Additional User Notes:</b></u>
                      <br />
                      {submission.additional}
                    </p>
                  )}
                  <div>
                    <p style={{ fontSize: "1.2em", marginBottom: "0" }}>
                      <u><b>Evaluation and Diagnosis:</b></u>
                    </p>
                    <div className="markdown-container">
                      <Markdown>
                        {submission.diagnosis}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
