// src/routes/Settings/Settings.tsx
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './settings.css';
import { useState } from 'react';

function Settings() {
  const [distance, setDistance] = useState(50);
  const [ageGap, setAgeGap] = useState(5);

  const handleDistanceChange = (e) => {
    setDistance(e.target.value);
  };

  const handleAgeGapChange = (e) => {
    setAgeGap(e.target.value);
  };

  return (
    <>
      <NavbarLogged />
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="card text-center p-4 shadow-lg settings-card">
          <h3 className="mb-4">Settings</h3>
          <div className="setting-item mb-3">
            <label htmlFor="distance" className="form-label">Distance (km)</label>
            <input
              type="range"
              id="distance"
              min="0"
              max="100"
              value={distance}
              onChange={handleDistanceChange}
              className="form-range"
            />
            <p>{distance} km</p>
          </div>

          <div className="setting-item mb-3">
            <label htmlFor="ageGap" className="form-label">Age Gap (years)</label>
            <input
              type="range"
              id="ageGap"
              min="0"
              max="20"
              value={ageGap}
              onChange={handleAgeGapChange}
              className="form-range"
            />
            <p>{ageGap} years</p>
          </div>

          <button className="btn btn-primary mt-3">Save Changes</button>
        </div>
      </div>
    </>
  );
}

export default Settings;
