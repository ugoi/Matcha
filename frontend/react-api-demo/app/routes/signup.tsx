import React, { useState } from "react";
import "./signup.css"; // Make sure to create and import this CSS file

export default function SignUp() {
  const [status, setStatus] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    username: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("firstName", formData.firstName);
    urlencoded.append("username", formData.username);
    urlencoded.append("lastName", formData.lastName);
    urlencoded.append("email", formData.email);
    urlencoded.append("password", formData.password);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        "http://localhost:3000/api/signup",
        requestOptions
      );

      const json = await response.json();
      console.log(json);
      const status = json.status;
      if (status === "error") {
        setStatus("error");
      } else if (status === "fail") {
        setStatus("fail");
      } else if (status === "success") {
        setStatus("success");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="signup-page">
      <div className="gradient-background"></div>
      <div className="form-container">
        <h1 className="form-title">Join Us</h1>
        <p className="form-subtitle">
          Create your account to unlock new adventures
        </p>
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="form-input"
            />
          </div>
          <button type="submit" className="submit-button">
            Sign Up
          </button>
        </form>
        {status === "success" && (
          <p className="success-message">Success! Welcome aboard.</p>
        )}
        {status === "error" && (
          <p className="error-message">Error! Please try again.</p>
        )}
        {status === "fail" && (
          <p className="error-message">
            Error! Username or email already exists.
          </p>
        )}
      </div>
    </div>
  );
}
