import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import Navbar from '../../components/Navbar/Navbar';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

function Signup() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [errorFields, setErrorFields] = useState<Record<keyof FormData, boolean>>({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
    password: false,
  });

  const [errorMessages, setErrorMessages] = useState<Record<keyof FormData, string | null>>({
    firstName: null,
    lastName: null,
    username: null,
    email: null,
    password: null,
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorFields((prev) => ({ ...prev, [name as keyof FormData]: false })); // Reset error for the field
    setErrorMessages((prev) => ({ ...prev, [name as keyof FormData]: null })); // Reset message for the field
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const hasErrors = Object.values(formData).some(value => !value);

    if (hasErrors) {
      const errors: Record<keyof FormData, boolean> = {
        firstName: !formData.firstName,
        lastName: !formData.lastName,
        username: !formData.username,
        email: !formData.email,
        password: !formData.password,
      };
      setErrorFields(errors);
      return;
    }

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    };

    try {
      const response = await fetch("http://${window.location.origin}/api/signup", requestOptions);
      const result = await response.json();

      if (result.status === "success") {
        navigate("/confirmemail");
      } else {
        const errors = result.data?.errors || [];
        const newErrorFields: Record<keyof FormData, boolean> = {
          firstName: false,
          lastName: false,
          username: false,
          email: false,
          password: false,
        };
        const newErrorMessages: Record<keyof FormData, string | null> = {
          firstName: null,
          lastName: null,
          username: null,
          email: null,
          password: null,
        };

        errors.forEach((error: { path: keyof FormData }) => {
          newErrorFields[error.path] = true;
          
          if (error.path === "username") {
            newErrorMessages.username = "This username is already taken.";
          } else if (error.path === "email") {
            newErrorMessages.email = "This email is already used.";
          }
        });

        setErrorFields(newErrorFields);
        setErrorMessages(newErrorMessages);
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <>
      <div className="slant-shape1"></div>
      <Navbar />
      <Container className="signup-container mt-5">
        <Row className="justify-content-center">
          <Col md={9}>
            <h1 className="text-center mb-4">Sign Up</h1>
            <Form onSubmit={handleSubmit}>
              {["firstName", "lastName", "username", "email", "password"].map((field) => (
                <Form.Group controlId={field} className="mb-3" key={field}>
                  <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                  <Form.Control
                    type={field === "email" ? "email" : field === "password" ? "password" : "text"}
                    name={field as keyof FormData}
                    placeholder={`Enter your ${field}`}
                    required
                    isInvalid={errorFields[field as keyof FormData]}
                    value={formData[field as keyof FormData]}
                    onChange={handleChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errorMessages[field as keyof FormData]}
                  </Form.Control.Feedback>
                </Form.Group>
              ))}
              <Button variant="primary" type="submit" className="w-100 mb-3">
                Register
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Signup;