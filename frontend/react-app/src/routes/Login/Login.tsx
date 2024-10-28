// src/routes/Login/Login.tsx
import { useState } from "react";
import "./Login.css";
import Navbar from '../../components/Navbar/Navbar';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";

function Login() {
  const [errorTitle, setErrorTitle] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  
    const urlencoded = new URLSearchParams();
    urlencoded.append("username", formData.get("username") as string);
    urlencoded.append("password", formData.get("password") as string);
  
    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      credentials: 'include',
      redirect: "follow",
    };
  
    try {
      const response = await fetch("http://localhost:3000/api/login", requestOptions);
      const result = await response.json();
  
      if (response.ok && result.status === 'success' && result.data.token) {
        navigate("/home");
      } else {
        let errorMessage = result?.message || "Login failed";
        setErrorTitle(errorMessage);
      }
    } catch (error) {
      setErrorTitle("An unexpected error occurred. Please try again.");
      console.error(error);
    }
  };
  

  return (
    <>
      <Navbar />
      <Container className="login-container mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <h1 className="text-center mb-4">Login</h1>
            {errorTitle && <Alert variant="danger">{errorTitle}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="username" className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control 
                  type="text" 
                  name="username" 
                  placeholder="Enter your username" 
                  required 
                />
              </Form.Group>
              <Form.Group controlId="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  name="password" 
                  placeholder="Enter your password" 
                  required 
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mb-3"
              >
                Login
              </Button>
            </Form>
            <p className="text-center">or</p>
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-danger" 
                href="/api/login/google" 
                className="w-45"
              >
                Sign in with Google
              </Button>
              <Button 
                variant="outline-primary" 
                href="/api/login/facebook" 
                className="w-45"
              >
                Sign in with Facebook
              </Button>
            </div>
            <div className="mt-4 text-center">
              <p>
                Don't have an account? <a href="/signup">Sign up here!</a>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Login;
