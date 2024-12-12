import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("username", username);
    urlencoded.append("password", password);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        "http://localhost:3000/api/login",
        requestOptions
      );
      const json = await response.json();
      if (json.status === "success") {
        setMessage("Logged in successfully!");
        navigate("/"); // Add this line
      } else if (json.status === "fail") {
        setMessage("Login failed: " + json.data.errors.join(", "));
      } else {
        setMessage("Error: " + json.message);
      }
    } catch (error) {
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <div className="login-page">
      <div className="form-container">
        <h2 className="form-title">Login</h2>
        <p className="form-subtitle">
          Enter your credentials to access your account
        </p>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Login
          </button>
        </form>
        {message && (
          <p
            className={
              message.startsWith("Error") || message.startsWith("Login failed")
                ? "error-message"
                : "success-message"
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
