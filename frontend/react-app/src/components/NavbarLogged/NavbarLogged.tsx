// NavbarLogged.tsx
import { Link } from "react-router-dom";
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import $ from 'jquery'
import NotificationHandler from '../NotificationHandler'
import './NavbarLogged.css'

const handleLogout = () => {
  const settings = {
    url: "http://${window.location.origin}/api/logout",
    method: "GET",
    timeout: 0,
  }
  $.ajax(settings)
    .done(function (response) {
      console.log(response)
      window.location.href = '/'
    })
    .fail(function (jqXHR) {
      console.error("Logout failed:", jqXHR.statusText)
    })
}

function NavbarLogged() {
  return (
    <div className="navbar-container">
      <Navbar collapseOnSelect expand="lg" className="custom-navbar">
        <Container>
          <Navbar.Brand href="/chat">
            <NotificationHandler />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mx-auto align-items-center">
              <Link to="/home" className="navbar-links">Home</Link>
              <Link to="/profile" className="navbar-links">Profile</Link>
              <Link to="/chat" className="navbar-links">Chat</Link>
              <Link to="/settings" className="navbar-links">Settings</Link>
              <Nav.Link onClick={handleLogout} className="logout-link">
                Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  )
}

export default NavbarLogged
