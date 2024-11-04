import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Container } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";


function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      if (!token) return;
  
      try {
          const response = await fetch(`${window.location.origin}/api/verify-email`, {
              method: "PATCH",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ token }),
          });
          
          if (response.status === 404) {
              setStatus("Token not found or already used. Request a new verification email.");
              navigate("/login?message=verification_failed");
          } else {
              const data = await response.json();
              setStatus(data.status === "success" ? "Email verified! You can now sign in." : "Verification failed.");
              navigate("/login?message=verification_success");
          }
      } catch {
          setStatus("An error occurred.");
          navigate("/login?message=verification_error");
      }
    };
    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <Container className="mt-5">
      {status && <Alert variant={status.includes("failed") ? "danger" : "success"}>{status}</Alert>}
    </Container>
  );
}

export default VerifyEmail;
