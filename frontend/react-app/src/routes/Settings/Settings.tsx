import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './settings.css';
import { useState, useEffect } from 'react';

function Settings() {
  const [distance, setDistance] = useState<number>(50);
  const [ageGap, setAgeGap] = useState<number>(5);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`);
        const result = await response.json();
        
        if (result.status === "fail" && result.data === "profile not found") {
          window.location.href = '/create-profile';
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        window.location.href = '/create-profile';
      }
    };

    checkProfile();
  }, []);

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDistance(Number(e.target.value));
  };

  const handleAgeGapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgeGap(Number(e.target.value));
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/logout`, {
        method: 'POST', // or 'GET', depending on your backend implementation
        credentials: 'include', // if you need to send cookies with the request
      });
  
      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
          <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}

export default Settings;
