// src/routes/Root/Root.tsx
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './Root.css';

function App() {
  return (
    <>
      <Navbar />
      <Container className="text-center mt-5">
        <Row>
          <Col>
            <h1 className="display-4 mb-4">Welcome to Matcha!</h1>
            <p className="lead mb-4">
              Join our community and find your perfect match. Sign up now to start your journey!
            </p>
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Create Account
              </Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
