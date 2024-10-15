// src/routes/Profile/Profile.tsx
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './profile.css';

function Profile() {
  const user = {
    name: 'Adrián González Serrano',
    age: 22,
    bio: 'Computer Science student, passionate about technology, sports, and outdoor adventures.',
    image: 'https://via.placeholder.com/400x500',
  };

  return (
    <>
      <NavbarLogged />
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="card text-center p-3 shadow-lg">
          <div className="profile-img-container position-relative">
            <img
              src={user.image}
              className="card-img-top"
              alt={`${user.name}`}
            />
            <button className="edit-button">
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          </div>
          <div className="card-body">
            <h4 className="card-title mb-2">{user.name}, {user.age}</h4>
            <p className="card-text text-muted mb-3">{user.bio}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
