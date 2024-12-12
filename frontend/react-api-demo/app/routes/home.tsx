import React, { useState } from "react";
import "./Home.css";
import Header from "../components/Header";

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    // Additional logout logic here (e.g., clearing tokens)
  };

  return (
    <div className="home-page">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="home-content">
        <h1>Welcome to MyApp!</h1>
        <p>Explore the app using the navigation menu above.</p>
        {!isLoggedIn && <p>Log in or sign up to access more features!</p>}
      </div>
    </div>
  );
};

export default Home;
