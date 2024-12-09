import React, { useState } from "react";

export default function SignUp() {

  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append(
      "Cookie",
      "jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMWIzMmZhZC1kYjc2LTQ5YzUtOWFjNC04ZTQwMDEyZjk3NmMiLCJpc3MiOiJtYXRjaGEiLCJhdWQiOiJtYXRjaGEiLCJpYXQiOjE3MzM3NTkwMTEsImV4cCI6MTczNjM1MTAxMX0.i6hnJvPm4GoHHgGJRJclqM2HddIQHyToIjPGP5txGIc"
    );

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
      redirect: 'follow',
    };

    fetch("http://localhost:3000/api/signup", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result)
        setIsSuccess(true);
      })
      .catch((error) => console.error(error));
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            First Name:
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Last Name:
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password:
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <button type="submit">Sign Up</button>
      </form>
      {isSuccess && <p>Success!</p>}
    </div>
  );
}
