import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import './Navbar.css';

function CollapsibleExample() {
  return (
    <>
      <div className="navbar-container">
        <Navbar collapseOnSelect expand="lg" className="custom-navbar">
          <Container>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mx-auto">
                <Nav.Link href="/">Home</Nav.Link>
                <Nav.Link href="/about">About</Nav.Link>
                <NavDropdown title="Language" id="collapsible-nav-dropdown">
                  <NavDropdown.Item href="">English</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Nav className="login-container2">
          <Nav.Link className="login-button" href="/login">Login</Nav.Link>
        </Nav>
      </div>
    </>
  );
}

export default CollapsibleExample;
