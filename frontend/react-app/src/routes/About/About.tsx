// src/routes/About/About.tsx
import Navbar from '../../components/Navbar/Navbar';
import './About.css';

function About() {
    return (
      <>
        <Navbar />
        <div className="about-container content d-flex flex-column align-items-center justify-content-center">
          <h1 className="display-4 text-center mb-4">About Us</h1>
          <div className="team-photo mb-4">
            <img 
              src='https://i.ibb.co/3sH9kRy/smiling-business-partners-with-digital-tablet-252847-4548.jpg' 
              alt="Adrián and Stefan" 
              className="img-fluid rounded-circle shadow-lg"
            />
          </div>
          <div className="about-content text-center">
            <p className="lead">
              We are a passionate team of two, Adrián and Stefan, students at 42Lausanne. 
              Currently, we are working on an exciting project called <strong>Matcha</strong>.
            </p>
            <p>
              Matcha is a modern dating app designed to bring people closer together. Our goal is to create 
              a platform that not only focuses on finding a match but also fosters meaningful connections 
              and interactions.
            </p>
          </div>
        </div>
      </>
    );
}

export default About;
