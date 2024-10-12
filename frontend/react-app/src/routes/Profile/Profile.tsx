// src/routes/Profile/Profile.tsx
import { Link } from 'react-router-dom';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './Profile.css';

function Profile() {
  return (
    <>
      <NavbarLogged />
      <h1 className="display-4 text-center mb-3">Profile</h1>
      <div className="content d-flex flex-column align-items-center justify-content-center">
      </div>
    </>
  );
}

export default Profile;
