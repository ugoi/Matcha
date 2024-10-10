// src/routes/About/About.tsx
import Navbar from '../../components/Navbar/Navbar';
import './About.css';

function About() {
    return (
      <>
        <Navbar />
        <div className="content d-flex flex-column align-items-center justify-content-center">
          <h1 className="display-4 text-center mb-3">About</h1>
        </div>
      </>
    );
}

export default About;
