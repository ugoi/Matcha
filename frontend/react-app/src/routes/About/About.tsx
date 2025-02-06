import Navbar from '../../components/Navbar/Navbar';
import './About.css';

function About() {
  return (
    <>
      <Navbar />
      <div className="slant-shape1"></div>
      <section className="about-section">
        <div className="about-wrapper">
          <h1 className="about-title">About Us</h1>
          <div className="team-photo">
            <img 
              src="https://i.ibb.co/3sH9kRy/smiling-business-partners-with-digital-tablet-252847-4548.jpg" 
              alt="Adrián and Stefan" 
              className="team-image"
            />
          </div>
          <div className="about-text">
            <p>
              We are a passionate team of two, Adrián and Stefan, students at 42Lausanne.
              Currently, we are working on an exciting project called <strong>Matcha</strong>.
            </p>
            <p>
              Matcha is a modern dating app designed to bring people closer together.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
