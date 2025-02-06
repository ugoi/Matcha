// src/components/NavbarLogged/NavbarLogged.tsx
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import $ from 'jquery';
// import NotificationHandler from '../NotificationHandler';
import './NavbarLogged.css';

const handleLogout = () => {
  const settings = {
    url: "http://localhost:3000/api/logout",
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings)
    .done(function (response) {
      console.log(response);
      window.location.href = '/';
    })
    .fail(function (jqXHR) {
      console.error('Logout failed:', jqXHR.statusText);
    });
};

function NavbarLogged() {
  return (
    <div className="navbar-container">
      <Navbar collapseOnSelect expand="lg" className="custom-navbar">
        <Container>
          <Navbar.Brand href="/chat">
            <i className="bi-bell-fill"></i>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mx-auto align-items-center">
              <Nav.Link href="/home">Home</Nav.Link>
              <Nav.Link href="/profile">Profile</Nav.Link>
              <Nav.Link href="/chat">Chat</Nav.Link>
              <Nav.Link href="/settings">Settings</Nav.Link>
              <Nav.Link onClick={handleLogout} className="logout-link">
                Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}

export default NavbarLogged;
