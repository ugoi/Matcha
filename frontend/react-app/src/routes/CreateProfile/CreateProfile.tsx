// src/routes/About/About.tsx
import './CreateProfile.css';

function CreateProfile() {
    return (
      <>
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <h3 className="mb-4">Create Profile</h3>
        <div className="card text-center p-4 shadow-lg settings-card">
          <div className="setting-item mb-3">
            <label htmlFor="Name" className="form-label">Introduce your name</label>
            <input
              type="text"
              id="Name"
            />
          </div>
        </div>
      </div>
    </>
    );
}

export default CreateProfile;
