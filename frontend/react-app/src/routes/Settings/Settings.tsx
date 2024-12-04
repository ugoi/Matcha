import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './settings.css';
import { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';

function Settings() {
  const [distance, setDistance] = useState<number>(50);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(30);

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

  const handleLogout = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/logout`, {
        method: 'POST',
        credentials: 'include',
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

  const handleSaveChanges = () => {
    //call the api to send the data changed
    window.location.href = '/home';
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
              min="3"
              max="100"
              value={distance}
              onChange={handleDistanceChange}
              className="form-range"
            />
            <p className="slider-value">{distance} km</p>
          </div>

          <div className="setting-item mb-3">
            <label className="form-label">Age Range</label>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              defaultValue={[minAge, maxAge]}
              ariaLabel={['Lower thumb', 'Upper thumb']}
              pearling
              minDistance={1}
              min={18}
              max={90}
              onChange={(value: number[]) => {
                setMinAge(value[0]);
                setMaxAge(value[1]);
              }}
            />
            <p className="slider-value">{minAge} - {maxAge} years</p>
          </div>

          <button 
            className="btn btn-primary mt-3" 
            onClick={handleSaveChanges}
          >
            Save Changes
          </button>
          <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}

export default Settings;
