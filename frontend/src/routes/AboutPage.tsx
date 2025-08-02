import { useSetPageTitle } from '../utils';

export default function AboutPage() {
  useSetPageTitle("About");

  return (
    <section>
      <h2>About CommuniCare</h2>
      <p>About.</p>
    </section>
  );
}
