import { useEffect, useState } from "react";
import { Container, Alert, Button, Form, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function ConfirmEmail() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('verificationEmail') || "";
  });
  const [cooldown, setCooldown] = useState(() => {
    const storedCooldownEnd = localStorage.getItem('emailVerificationCooldown');
    if (storedCooldownEnd) {
      const remainingTime = Math.ceil((parseInt(storedCooldownEnd) - Date.now()) / 1000);
      return remainingTime > 0 ? remainingTime : 0;
    }
    return 0;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/check-auth`, {
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
    if (isAuthenticated) navigate("/create-profile");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
        if (cooldown - 1 <= 0) {
          localStorage.removeItem('emailVerificationCooldown');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (email) {
      localStorage.setItem('verificationEmail', email);
    } else {
      localStorage.removeItem('verificationEmail');
    }
  }, [email]);

  const handleResend = async () => {
    setIsSending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${window.location.origin}/api/resend-verification-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setMessage("Verification email has been resent.");
        const cooldownEnd = Date.now() + (60 * 1000); // 60 seconds from now
        localStorage.setItem('emailVerificationCooldown', cooldownEnd.toString());
        setCooldown(60);
      } else if (data.status === "fail" && data.data?.errors?.includes("email already verified")) {
        navigate("/login?message=already_verified");
      } else {
        setError(data.data?.errors?.[0] || data.data?.message || "Failed to resend verification email.");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <div className="text-center mb-4">
            <h2>Email Verification</h2>
            <Alert variant="info" className="mt-3">
              Please enter your email address to resend the verification email.
            </Alert>
          </div>
          
          <Form className="mt-4">
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
          </Form>

          {message && <Alert variant="success" className="mt-3">{message}</Alert>}
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          
          <div className="text-center">
            <Button 
              onClick={handleResend} 
              disabled={isSending || !email || cooldown > 0} 
              variant="primary" 
              size="lg"
              className="mt-3 px-4"
            >
              {isSending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : cooldown > 0 ? (
                `Wait ${cooldown}s to resend`
              ) : (
                "Resend Verification Email"
              )}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ConfirmEmail;
