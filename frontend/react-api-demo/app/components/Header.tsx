import React from "react";
import "./Header.css";
import { Link, useNavigate } from "react-router";

const Header: React.FC<{ isLoggedIn: boolean; onLogout: () => void }> = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <header className="header">
      <nav className="nav-container">
        <div className="nav-logo">
          <Link to="/">MyApp</Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
        <div className="auth-buttons">
          {!isLoggedIn ? (
            <>
              <button className="nav-button" onClick={() => navigate("/login")}>Log In</button>
              <button className="nav-button signup-button" onClick={() => navigate("/signup")}>Sign Up</button>
            </>
          ) : (
            <button className="nav-button logout-button" onClick={handleLogout}>Log Out</button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
