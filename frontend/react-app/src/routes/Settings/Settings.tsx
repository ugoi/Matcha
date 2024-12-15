import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './settings.css';
import { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';
import $ from 'jquery';

function Settings() {
  const [distance, setDistance] = useState<number>(50);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(30);
  const [email, setEmail] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [sexualPreference, setSexualPreference] = useState<string>('');

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const emailSettings = {
          url: "http://localhost:3000/api/users/me",
          method: "GET",
          timeout: 0,
        };

        $.ajax(emailSettings).done(function (response) {
          console.log(response);
          setEmail(response.data.user.email);
        });

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSaveChanges = () => {
    const emailSettings = {
      url: "http://localhost:3000/api/users/me",
      method: "PATCH",
      timeout: 0,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        email: email,
      }
    };

    $.ajax(emailSettings).done(function (response) {
      console.log(response);
      window.location.href = '/home';
    });

    const genderSettings: any = {
      url: "http://localhost:3000/api/profiles/me",
      method: "PATCH",
      timeout: 0,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {}
    };

    if (gender) {
      genderSettings.data.gender = gender;
    }

    if (sexualPreference) {
      genderSettings.data.sexual_preference = sexualPreference;
    }

    if (Object.keys(genderSettings.data).length > 0) {
      $.ajax(genderSettings).done(function (response) {
        console.log(response);
      });
    }
  };

  const handleUpdateGPS = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          var settings = {
            url: "http://localhost:3000/api/profiles/me",
            method: "PATCH",
            timeout: 0,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            data: {
              gps_longitude: longitude.toString(),
              gps_latitude: latitude.toString()
            }
          };
          $.ajax(settings).done(function (response) {
            console.log(response);
          });
        },
        async (error) => {
          console.error("Error getting browser location:", error);
          await getLocationByIP();
        },
        { timeout: 5000 }
      );
    } catch (error) {
      console.error("Error accessing geolocation:", error);
      await getLocationByIP();
    }
  };

  const getLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        var settings = {
          url: "http://localhost:3000/api/profiles/me",
          method: "PATCH",
          timeout: 0,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: {
            gps_longitude: data.longitude.toString(),
            gps_latitude: data.latitude.toString()
          }
        };
        $.ajax(settings).done(function (response) {
          console.log(response);
        });
      } else {
        throw new Error('Location data not available');
      }
    } catch (error) {
      console.error('Error getting IP location:', error);
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

          <div className="setting-item mb-3">
            <label htmlFor="Gender" className="form-label">Select your gender</label>
            <select
              id="Gender"
              className="form-control"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="setting-item mb-3">
            <label htmlFor="Preferences" className="form-label">Select your sexual preference</label>
            <select
              id="Preferences"
              className="form-control"
              value={sexualPreference}
              onChange={(e) => setSexualPreference(e.target.value)}
            >
              <option value="">Select...</option>
              <option value="heterosexual">Heterosexual</option>
              <option value="homosexual">Homosexual</option>
              <option value="bisexual">Bisexual</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="setting-item mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="form-control"
            />
          </div>

          <button 
            className="btn btn-primary mt-3" 
            onClick={handleSaveChanges}
          >
            Save Changes
          </button>
          <button 
            className="btn btn-secondary mt-3" 
            onClick={handleUpdateGPS}
          >
            Update location
          </button>
        </div>
      </div>
    </>
  );
}

export default Settings;
