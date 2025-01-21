// src/routes/Settings/Settings.tsx

import { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';
import $ from 'jquery';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './settings.css';

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
        const settings = {
          url: "http://localhost:3000/api/users/me",
          method: "GET",
          timeout: 0
        };
        $.ajax(settings).done(function (response) {
          setEmail(response.data.user.email);
        });
      } catch (error) {
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
        email: email
      }
    };
    $.ajax(emailSettings).done(function () {});

    const profileData = {
      gender: gender || undefined,
      sexual_preference: sexualPreference || undefined,
      search_preferences: {
        distance: { "$lte": distance },
        age: { "$gte": minAge, "$lte": maxAge }
      }
    };

    const profileSettings = {
      url: "http://localhost:3000/api/profiles/me",
      method: "PATCH",
      timeout: 0,
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify(profileData)
    };

    $.ajax(profileSettings).done(function () {
      window.location.href = '/home';
    });
  };

  const handleUpdateGPS = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const settings = {
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
          $.ajax(settings).done(function () {});
        },
        async () => {
          await getLocationByIP();
        },
        { timeout: 5000 }
      );
    } catch (error) {
      await getLocationByIP();
    }
  };

  const getLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.latitude && data.longitude) {
        const settings = {
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
        $.ajax(settings).done(function () {});
      }
    } catch {}
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    const settings = {
      url: "http://localhost:3000/api/users/me",
      method: "DELETE",
      timeout: 0
    };
    $.ajax(settings)
      .done(() => {
        window.location.href = '/';
      })
      .fail(() => {});
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
          <button className="btn btn-primary mt-3" onClick={handleSaveChanges}>
            Save Changes
          </button>
          <button className="btn btn-secondary mt-3" onClick={handleUpdateGPS}>
            Update location
          </button>
          <button
            className="btn btn-danger mt-3"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
      </div>
    </>
  );
}

export default Settings;
