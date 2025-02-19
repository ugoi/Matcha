import { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';
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
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [minCommonInterests, setMinCommonInterests] = useState(1);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://${window.location.origin}/api/users/me")
      .then((res) => res.json())
      .then((response) => {
        if (response?.data?.user?.email) {
          setEmail(response.data.user.email);
        }
      })
      .catch(() => {});

    fetch("http://${window.location.origin}/api/profiles/me", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result?.status === "success") {
          if (result.data.gender) setGender(result.data.gender);
          if (result.data.sexual_preference) setSexualPreference(result.data.sexual_preference);
          if (result.data.search_preferences) {
            const prefs = result.data.search_preferences;
            if (prefs.location_radius !== undefined) setDistance(prefs.location_radius);
            if (prefs.age_min !== undefined) setMinAge(prefs.age_min);
            if (prefs.age_max !== undefined) setMaxAge(prefs.age_max);
            if (prefs.fame_rating_min !== undefined) setMinFameRating(prefs.fame_rating_min);
            if (prefs.fame_rating_max !== undefined) setMaxFameRating(prefs.fame_rating_max);
            const tagsString = prefs.interests_filter || prefs.intereses || '';
            const tags = tagsString
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t.length);
            setCommonTags(tags);
            if (prefs.common_interests !== undefined) setMinCommonInterests(prefs.common_interests);
          }
          if (result.data.interests) {
            const interestsArr = result.data.interests.map((item: any) => {
              let tag = item.interest_tag;
              if (!tag.startsWith('#')) {
                tag = '#' + tag;
              }
              return tag;
            });
            setAvailableInterests(interestsArr);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDistance(Number(e.target.value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSaveChanges = async () => {
    const emailParams = new URLSearchParams();
    emailParams.append("email", email);
    await fetch("http://${window.location.origin}/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: emailParams,
    });

    const profileParams = new URLSearchParams();
    profileParams.append("gender", gender || "");
    profileParams.append("sexual_preference", sexualPreference || "");
    profileParams.append("age_min", minAge.toString());
    profileParams.append("age_max", maxAge.toString());
    profileParams.append("location_radius", distance.toString());
    profileParams.append("fame_rating_min", minFameRating.toString());
    profileParams.append("fame_rating_max", maxFameRating.toString());
    profileParams.append(
      "interests_filter",
      commonTags.map(t => t.replace(/^#/, '')).join(', ')
    );
    profileParams.append("common_interests", minCommonInterests.toString());

    await fetch("http://${window.location.origin}/api/profiles/me", {
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
        fetch("http://${window.location.origin}/api/profiles/me", {
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
        await fetch("http://${window.location.origin}/api/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });
      }
    } catch {}
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
      return;
    }
    try {
      const res = await fetch("http://${window.location.origin}/api/users/me", {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.status === "success") {
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Error deleting account', error);
    }
  };

  const toggleCommonTag = (tag: string) => {
    const normalizedTag = tag.replace(/^#/, '');
    if (commonTags.includes(normalizedTag)) {
      setCommonTags(commonTags.filter(t => t !== normalizedTag));
    } else {
      if (commonTags.length < 5) {
        setCommonTags([...commonTags, normalizedTag]);
      } else {
        alert("Maximum 5 tags allowed");
      }
    }
  };

  return (
    <>
      <div className="slant-shape1"></div>
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
              max={100}
              onChange={(value: number[]) => {
                setMinFameRating(value[0]);
                setMaxFameRating(value[1]);
              }}
            />
            <p className="slider-value">{minFameRating} - {maxFameRating}</p>
          </div>
          <div className="setting-item mb-3">
            <label className="form-label">Common Tags</label>
            <div className="checkbox-group">
              {availableInterests.map((tag, idx) => (
                <div key={idx} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`tag-${idx}`}
                    value={tag}
                    checked={commonTags.includes(tag.replace(/^#/, ''))}
                    onChange={() => toggleCommonTag(tag)}
                  />
                  <label className="form-check-label" htmlFor={`tag-${idx}`}>
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="setting-item mb-3">
            <label htmlFor="minCommonInterests" className="form-label">Minimum common interests</label>
            <ReactSlider
              className="horizontal-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              value={minCommonInterests}
              ariaLabel={['Minimum common interests']}
              min={0}
              max={3}
              onChange={(value: number | number[]) => {
                if (typeof value === 'number') {
                  setMinCommonInterests(value);
                } else {
                  setMinCommonInterests(value[0]);
                }
              }}
            />
            <p className="slider-value">{minCommonInterests}</p>
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
          <div className="d-flex flex-column align-items-center">
            <button className="btn btn-primary mt-3" onClick={handleSaveChanges}>
              Save Changes
            </button>
            <button className="btn btn-secondary mt-3" onClick={handleUpdateGPS}>
              Update location
            </button>
            <button className="btn btn-danger mt-3" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
