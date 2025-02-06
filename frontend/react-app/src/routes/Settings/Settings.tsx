import { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';
import { useNavigate } from 'react-router-dom';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './settings.css';

function Settings() {
  const [distance, setDistance] = useState(50);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(30);
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [sexualPreference, setSexualPreference] = useState('');
  const [minFameRating, setMinFameRating] = useState(0);
  const [maxFameRating, setMaxFameRating] = useState(5);

  // Existing tags/interest filters
  const [tagsInput, setTagsInput] = useState('');
  const [commonTags, setCommonTags] = useState<string[]>([]);

  // New field for minimum common interests
  const [minCommonInterests, setMinCommonInterests] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/api/users/me")
      .then((res) => res.json())
      .then((response) => {
        if (response?.data?.user?.email) {
          setEmail(response.data.user.email);
        }
      })
      .catch(() => {});

    fetch("http://localhost:3000/api/profiles/me", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result?.status === "success") {
          if (result.data.gender) setGender(result.data.gender);
          if (result.data.sexual_preference) setSexualPreference(result.data.sexual_preference);
          if (result.data.search_preferences) {
            const prefs = result.data.search_preferences;
            if (prefs.distance?.$lte) setDistance(prefs.distance.$lte);
            if (prefs.age) {
              if (prefs.age.$gte) setMinAge(prefs.age.$gte);
              if (prefs.age.$lte) setMaxAge(prefs.age.$lte);
            }
            if (prefs.fame_rating) {
              if (prefs.fame_rating.$gte !== undefined) setMinFameRating(prefs.fame_rating.$gte);
              if (prefs.fame_rating.$lte !== undefined) setMaxFameRating(prefs.fame_rating.$lte);
            }
            // If you want to read this minimum common interests from the backend as well,
            // you could do something like:
            // if (prefs.common_interests && prefs.common_interests.$gte) {
            //   setMinCommonInterests(prefs.common_interests.$gte);
            // }
            if (prefs.common_interests?.$in) {
              setCommonTags(prefs.common_interests.$in);
              setTagsInput(prefs.common_interests.$in.join(', '));
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleTagsBlur = () => {
    const parsed = tagsInput.split(',').map(t => t.trim()).filter(t => t.length);
    setCommonTags(parsed);
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDistance(Number(e.target.value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSaveChanges = async () => {
    // Patch user email
    const emailParams = new URLSearchParams();
    emailParams.append("email", email);
    await fetch("http://localhost:3000/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: emailParams,
    });

    // Patch profile preferences
    const profileParams = new URLSearchParams();
    profileParams.append("gender", gender || "");
    profileParams.append("sexual_preference", sexualPreference || "");
    profileParams.append("age_min", minAge.toString());
    profileParams.append("age_max", maxAge.toString());
    profileParams.append("location_radius", distance.toString());
    profileParams.append("fame_rating_min", minFameRating.toString());
    profileParams.append("fame_rating_max", maxFameRating.toString());
    profileParams.append("interests_filter", commonTags.join(','));

    // New minimum common interests field sent to backend
    profileParams.append("common_interests", minCommonInterests.toString());

    await fetch("http://localhost:3000/api/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: profileParams,
    });
    window.location.href = '/home';
  };

  const handleUpdateGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams();
        params.append("gps_longitude", longitude.toString());
        params.append("gps_latitude", latitude.toString());
        fetch("http://localhost:3000/api/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });
      },
      () => getLocationByIP(),
      { timeout: 5000 }
    );
  };

  const getLocationByIP = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const params = new URLSearchParams();
        params.append("gps_longitude", data.longitude.toString());
        params.append("gps_latitude", data.latitude.toString());
        await fetch("http://localhost:3000/api/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });
      }
    } catch {}
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    try {
      const res = await fetch("http://localhost:3000/api/users/me", {
        method: "DELETE",
        redirect: "follow",
      });
      const json = await res.json();
      if (json.status === "success") {
        navigate('/');
      }
    } catch {}
  };

  return (
    <>
      <div className="slant-shape1"></div>
      <NavbarLogged />
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="card text-center p-4 shadow-lg settings-card">
          <h3 className="mb-4">Settings</h3>

          {/* Distance */}
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

          {/* Age Range */}
          <div className="setting-item mb-3">
            <label className="form-label">Age Range</label>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              value={[minAge, maxAge]}
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

          {/* Fame Rating Range */}
          <div className="setting-item mb-3">
            <label className="form-label">Fame Rating Range</label>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              value={[minFameRating, maxFameRating]}
              ariaLabel={['Fame min', 'Fame max']}
              pearling
              minDistance={1}
              min={0}
              max={5}
              onChange={(value: number[]) => {
                setMinFameRating(value[0]);
                setMaxFameRating(value[1]);
              }}
            />
            <p className="slider-value">{minFameRating} - {maxFameRating}</p>
          </div>

          {/* Common Tags (string-based filters) */}
          <div className="setting-item mb-3">
            <label htmlFor="commonTags" className="form-label">Common Tags (comma-separated)</label>
            <input
              type="text"
              id="commonTags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onBlur={handleTagsBlur}
              className="form-control"
              placeholder="e.g. sport, music, coding"
            />
            {commonTags.length > 0 && (
              <p className="text-muted mt-2">Current tags: {commonTags.join(', ')}</p>
            )}
          </div>

          {/* Minimum Common Interests */}
          <div className="setting-item mb-3">
            <label htmlFor="minCommonInterests" className="form-label">Minimum common interests</label>
            <input
              type="number"
              id="minCommonInterests"
              value={minCommonInterests}
              onChange={(e) => setMinCommonInterests(Number(e.target.value))}
              className="form-control"
            />
          </div>

          {/* Gender */}
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

          {/* Sexual Preference */}
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

          {/* Email */}
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

          {/* Save Changes */}
          <button className="btn btn-primary mt-3" onClick={handleSaveChanges}>Save Changes</button>

          {/* Update location */}
          <button className="btn btn-secondary mt-3" onClick={handleUpdateGPS}>Update location</button>

          {/* Delete Account */}
          <button className="btn btn-danger mt-3" onClick={handleDeleteAccount}>Delete Account</button>
        </div>
      </div>
    </>
  );
}

export default Settings;
