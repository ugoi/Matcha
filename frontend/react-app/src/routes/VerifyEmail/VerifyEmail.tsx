import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Container } from 'react-bootstrap';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      if (!token) return;
  
      try {
          const response = await fetch("http://localhost:3000/api/verify-email", {
              method: "PATCH",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ token }),
          });
          
          if (response.status === 404) {
              setStatus("Token not found or already used. Request a new verification email.");
          } else {
              const data = await response.json();
              setStatus(data.status === "success" ? "Email verified! You can now sign in." : "Verification failed.");
          }
      } catch {
          setStatus("An error occurred.");
      }
    };
    verifyEmail();
  }, [searchParams]);

  return (
    <Container className="mt-5">
      {status && <Alert variant={status.includes("failed") ? "danger" : "success"}>{status}</Alert>}
    </Container>
  );
}

export default VerifyEmail;
