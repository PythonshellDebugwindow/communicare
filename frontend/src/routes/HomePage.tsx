import { useEffect } from 'react';
import { Link } from 'react-router';

export default function HomePage() {
  useEffect(() => {
    document.title = "CommuniCare";
  }, []);
  
  return (
    <section className="fade-in">
      <h2>Language shouldn't be a barrier.</h2>
      <p className="fade-in">
        CommuniCare is a website which allows people to communicate.
      </p>
      <p className="fade-in fade-in-delayed">
        To get started, <Link to="/sign-up">sign up</Link>.
      </p>
    </section>
  );
}
