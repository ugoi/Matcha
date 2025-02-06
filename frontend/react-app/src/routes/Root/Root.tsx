import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./Root.css";

function Root() {
  return (
    <>
      <header className="hero">
      <Navbar />
        <div className="floating-polygon poly1"></div>
        <div className="floating-polygon poly2"></div>
        <div className="floating-polygon poly3"></div>
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Matcha!</h1>
          <p className="hero-subtitle">
            Discover your perfect match in a serene space crafted for calm and connection.
          </p>
          <Link to="/signup" className="hero-button">
            Create Account
          </Link>
        </div>
        <div className="slant-shape"></div>
      </header>
    </>
  );
}

export default Root;
