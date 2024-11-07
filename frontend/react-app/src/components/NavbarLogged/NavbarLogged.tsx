// src/components/NavbarLogged/NavbarLogged.tsx
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import './NavbarLogged.css';

function NavbarLogged() {
  return (
    <>
      <div className="navbar-container">
        <Navbar collapseOnSelect expand="lg" className="custom-navbar">
          <Container>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="mx-auto">
                <Nav.Link href="/home">Home</Nav.Link>
                <Nav.Link href="/profile">Profile</Nav.Link>
                <Nav.Link href="/chat">Chat</Nav.Link>
                <Nav.Link href="/settings">Settings</Nav.Link>
                <NavDropdown title="Language" id="collapsible-nav-dropdown">
                  <NavDropdown.Item href="">English</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>
    </>
  );
}

export default NavbarLogged;
