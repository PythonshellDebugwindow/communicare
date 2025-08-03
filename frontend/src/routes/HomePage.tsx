import { useEffect } from 'react';
import { Link } from 'react-router';

export default function HomePage() {
  useEffect(() => {
    document.title = "CommuniCare";
  }, []);
  
  return (
    <section className="fade-in" style={{ paddingLeft: "40px", paddingRight: "40px" }}>
      <h2>Better Communication Drives Better Healthcare.</h2>
      <p className="fade-in">
        In today's healthcare system, healthcare time is limited, but demand is not. 
        CommuniCare addresses this imbalance by streamlining communication between medical 
        professionals and patients. Through pre-appointment surveys, our platform gathers 
        essential and useful information in advance, reducing appointment time and letting 
        medical professionals prioritise what truly matters rather than spending excessive
        time on small details.
      </p>
      <div className="fade-in fade-in-delayed">
        <h3>For doctors</h3>
        <p>
          To get started, please <Link to="/sign-up">sign up</Link> if you haven't.
          If you already have an account, you can <Link to="/log-in">log in</Link>.
        </p>
      </div>
      <div className="fade-in fade-in-delayed-2">
        <h3>For patients</h3>
        <p>
          If your doctor uses CommuniCare, you'll receive a link to a short survey 
          before your appointment. Filling it out helps streamline your visit and 
          supports a faster, more focused diagnosis.
        </p>
        <h3>We wish you the best of luck with your appointment!</h3>
      </div>
    </section>
  );
}
