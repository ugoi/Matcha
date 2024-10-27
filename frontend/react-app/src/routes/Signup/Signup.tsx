// src/routes/Signup/Signup.tsx
import { useState } from "react";
import "./Signup.css";
import Navbar from '../../components/Navbar/Navbar';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

function Signup() {
  const [errorTitle, setErrorTitle] = useState("");

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams(formData as any);

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
      const result = await response.json();

      if (result.status === "fail") {
        let errors = result.data?.errors;
        let invalid = "";
        if (errors) {
          invalid = errors.map((error: any) => error.path).toString();
        }

        setErrorTitle(`${result.data.title} ${invalid}`);
        return;
      }

      if (result.status === "error") {
        setErrorTitle(result.data.title);
        return;
      }
      setErrorTitle("Success");
    } catch (error) {
      setErrorTitle("Some error");
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />
      <Container className="signup-container mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <h1 className="text-center mb-4">Sign Up</h1>
            {errorTitle && <Alert variant="danger">{errorTitle}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="firstName" className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="firstName" 
                  placeholder="Enter your first name" 
                  required 
                />
              </Form.Group>
              <Form.Group controlId="lastName" className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="lastName" 
                  placeholder="Enter your last name" 
                  required 
                />
              </Form.Group>
              <Form.Group controlId="username" className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control 
                  type="text" 
                  name="username" 
                  placeholder="Choose a username" 
                  required 
                />
              </Form.Group>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  required 
                />
              </Form.Group>
              <Form.Group controlId="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  name="password" 
                  placeholder="Create a password" 
                  required 
                />
              </Form.Group>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mb-3"
              >
                Register
              </Button>
            </Form>
            <p className="text-center">or</p>
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-danger" 
                href="/api/login/google" 
                className="w-45"
              >
                Sign up with Google
              </Button>
              <Button 
                variant="outline-primary" 
                href="/api/login/facebook" 
                className="w-45"
              >
                Sign up with Facebook
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Signup;
