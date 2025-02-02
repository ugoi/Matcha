import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Form, Button, Container, Row, Col, Alert } from "react-bootstrap";
import Navbar from "../../components/Navbar/Navbar";
import "./ResetPassword.css"; // Optional: include your custom styles

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState({ message: "", variant: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback({ message: "", variant: "" });

    // Basic client-side check
    if (password !== confirmPassword) {
      setFeedback({ message: "Passwords do not match.", variant: "warning" });
      return;
    }
    if (!token) {
      setFeedback({ message: "Invalid or missing token.", variant: "danger" });
      return;
    }
    setIsLoading(true);

    // Set up the PATCH request to update the password
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("token", token);
    urlencoded.append("password", password);

    const requestOptions: RequestInit = {
      method: "PATCH",
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
        setFeedback({ message: json.message || "An error occurred while resetting your password.", variant: "danger" });
      } else if (status === "fail") {
        setFeedback({ message: json.message || "Failed to reset password. Please try again.", variant: "warning" });
      } else if (status === "success") {
        setFeedback({ message: "Password successfully updated! Please log in with your new password.", variant: "success" });
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
      <Container className="reset-password-container mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <h1 className="text-center mb-4">Reset Password</h1>
            {feedback.message && (
              <Alert variant={feedback.variant}>
                {feedback.message}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="password" className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group controlId="confirmPassword" className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
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

export default ResetPassword;
