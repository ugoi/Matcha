// src/components/Navbar/Navbar.tsx
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/support">Support</a></li>
          <li className="dropdown">
            <button onClick={toggleDropdown} className="dropdown-button">
              Language
            </button>
            {dropdownOpen && (
              <div className="dropdown-content">
                <a href="#en">English</a>
                <a href="#es">Español</a>
                {/* Agrega más idiomas aquí */}
              </div>
            )}
          </li>
        </ul>
      </div>
      <button className="login-button">Login</button> {/* Login fuera del navbar */}
    </nav>
  );
};

export default Navbar;
