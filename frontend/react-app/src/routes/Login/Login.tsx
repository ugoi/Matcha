import { useState, useEffect } from "react";
import "./Login.css";
import Navbar from '../../components/Navbar/Navbar';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

function Login() {
  const [error, setError] = useState(false);
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      switch (message) {
        case "verification_success":
          setStatusMessage("Email successfully verified! Please login to continue.");
          break;
        case "already_verified":
          setStatusMessage("This email is already verified. Please login to continue.");
          break;
        case "verification_failed":
          setStatusMessage("Email verification failed. Please request a new verification email.");
          break;
        case "verification_error":
          setStatusMessage("An error occurred during verification. Please try again.");
          break;
      }
    }
  }, [searchParams]);

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
      const response = await fetch(`${window.location.origin}/api/login`, requestOptions);
      const result = await response.json();
  
      if (response.ok && result.status === 'success' && result.data.token) {
        const profileResponse = await fetch(`${window.location.origin}/api/profiles/me`, {
          headers: { "Authorization": `Bearer ${result.data.token}` },
          credentials: 'include',
        });
        const profileResult = await profileResponse.json();

        if (profileResponse.ok && profileResult.data && profileResult.data.age) {
          window.location.href = "/home";
        } else {
          window.location.href = "/create-profile";
        }
      } else {
        setError(true);
      }
    } catch (error) {
      setError(true);
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
            {statusMessage && (
              <Alert 
                variant={statusMessage.includes("success") ? "success" : "info"}
                className="mb-3"
              >
                {statusMessage}
              </Alert>
            )}
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
                  className={error ? "error-border" : ""}
                />
                {error && <p className="error-text">Incorrect login or password!</p>}
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
                className="w-45 social-button"
              >
                Sign in with Google
              </Button>
              <Button 
                variant="outline-primary" 
                href="/api/login/facebook" 
                className="w-45 social-button"
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
