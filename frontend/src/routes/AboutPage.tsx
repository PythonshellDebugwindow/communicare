import { useSetPageTitle } from '../utils';

export default function AboutPage() {
  useSetPageTitle("About");

  return (
    <section style={{ padding: "0 45px" }}>
      <h2 style={{ fontSize: "2.1em" }}>CommuniCare: Bridging the Medical Communication Gap</h2>

      <div style={{ padding: "0 10px", margin: "0" }}>
        <p>
          Waiting for specialist care in Canada can be frustrating and stressful. With national median wait
          times reaching 78 days—and one in four patients waiting 25 weeks or more—patients and healthcare
          professionals alike face significant challenges.
        </p>

        <h3 className="fade-in">Our Inspiration</h3>
        <p className="fade-in">
          The Canadian healthcare system struggles with a shortage of healthcare professionals to meet growing
          patient demand, leading to overcrowded clinics, long wait times, and dissatisfaction among patients
          and doctors. We decided to create CommuniCare because we want to improve this experience by enhancing
          how patients communicate their symptoms.
        </p>

        <h3 className="fade-in fade-in-delayed">What We Offer</h3>
        <p className="fade-in fade-in-delayed">
          Our innovative platform features an interactive human body map designed to make symptom
          communication easy and intuitive. Patients can simply click on relevant body areas and use visual
          aids to accurately describe what they're experiencing. This improved communication aims to streamline
          consultations, helping healthcare providers better understand and prioritise patient needs.
        </p>

        <p className="fade-in fade-in-delayed">
          <b>Let's make miscommunication and ridiculous wait times obsolete.</b>
        </p>
      </div>
    </section>
  );
}
