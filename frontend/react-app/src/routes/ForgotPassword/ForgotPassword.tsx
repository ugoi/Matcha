import { useState } from "react";
import { Form, Button, Container, Row, Col, Alert } from "react-bootstrap";
import Navbar from "../../components/Navbar/Navbar";
import "./ForgotPassword.css"; // Optional: include your custom styles

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState({ message: "", variant: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback({ message: "", variant: "" });
    setIsLoading(true);

    // Set up the POST request for reset password (email request)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("email", email);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${window.location.origin}/api/reset-password`,
        requestOptions
      );
      const json = await response.json();
      console.log(json);
      const status = json.status;
      if (status === "error") {
        setFeedback({ message: "An error occurred while processing your request.", variant: "danger" });
      } else if (status === "fail") {
        setFeedback({ message: "Unable to process your request. Please verify your email and try again.", variant: "warning" });
      } else if (status === "success") {
        setFeedback({ message: "Reset password email has been sent. Please check your inbox.", variant: "success" });
      }
    } catch (error) {
      console.error("Error:", error);
      setFeedback({ message: "An unexpected error occurred. Please try again later.", variant: "danger" });
    }
    setIsLoading(false);
  };

  return (
    <>
      <Navbar />
      <Container className="forgot-password-container mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <h1 className="text-center mb-4">Forgot Password</h1>
            {feedback.message && (
              <Alert variant={feedback.variant}>
                {feedback.message}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Password Email"}
              </Button>
            </Form>
            <div className="mt-3 text-center">
              <a href="/login">Back to Login</a>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default ForgotPassword;
