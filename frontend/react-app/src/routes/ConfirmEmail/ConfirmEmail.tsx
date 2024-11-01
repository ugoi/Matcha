import { useEffect, useState } from "react";
import { Container, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function ConfirmEmail() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const userEmail = "user@example.com";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/check-auth", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (data.status === "success" && data.message === "Authenticated") {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate("/createprofile");
  }, [isAuthenticated, navigate]);

  const handleResend = async () => {
    setIsSending(true);
    setError(""); // Clear previous error messages
    setMessage(""); // Clear previous success message
    try {
      const response = await fetch("http://localhost:3000/api/resend-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setMessage("Verification email has been resent.");
      } else {
        // Show a more specific message if available from the backend
        setError(data.data?.message || "Failed to resend verification email.");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Container className="mt-5 text-center">
      <Alert variant="info">
        A verification email has been sent. Please check your inbox and follow the instructions to verify your email.
      </Alert>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Button onClick={handleResend} disabled={isSending} variant="primary" className="mt-3">
        {isSending ? "Sending..." : "Resend Verification Email"}
      </Button>
    </Container>
  );
}

export default ConfirmEmail;
