import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './Home.css';

type User = {
  profile_id: number;
  name: string;
  age: number;
  gender: string;
  sexual_preference: string;
  biography: string;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
  nearest_location: string;
  pictures: { picture_url: string }[];
  interests: any[];
  fame_rating: number;
};

function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [preferences, setPreferences] = useState<any>(null);
  const [sortCriteria, setSortCriteria] = useState<Record<string, { $order: "asc" | "desc" }>>({
    distance: { $order: "desc" },
    age: { $order: "asc" },
    fame_rating: { $order: "desc" },
    common_interests: { $order: "desc" },
  });
  const [actedUserIds, setActedUserIds] = useState<Set<number>>(new Set());
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);
  const navigate = useNavigate();

  const handleUpdateGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams();
        params.append("gps_longitude", longitude.toString());
        params.append("gps_latitude", latitude.toString());
        fetch(`${window.location.origin}/api/profiles/me`, {
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
        await fetch(`${window.location.origin}/api/profiles/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });
      }
    } catch {}
  };

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const res = await fetch(`${window.location.origin}/api/profiles/me`, {
          credentials: 'include',
        });
        const result = await res.json();
        if (result.status === 'success') {
          handleUpdateGPS();
          setPreferences(buildPreferences(result.data));
          setMyProfile(result.data);
        } else {
          navigate('/profile');
        }
      } catch {
        navigate('/profile');
      }
    }
    fetchUserProfile();
  }, [navigate]);

  function buildPreferences(userData: any) {
    const { gender, sexual_preference, search_preferences = {} } = userData;
    const filterObject: any = {};
    if (search_preferences.location_radius !== undefined) {
      filterObject.distance = { $lte: String(search_preferences.location_radius) };
    }
    if (search_preferences.age_min !== undefined || search_preferences.age_max !== undefined) {
      filterObject.age = {};
      if (search_preferences.age_min !== undefined) {
        filterObject.age.$gte = String(search_preferences.age_min);
      }
      if (search_preferences.age_max !== undefined) {
        filterObject.age.$lte = String(search_preferences.age_max);
      }
    }
    if (search_preferences.fame_rating_min !== undefined || search_preferences.fame_rating_max !== undefined) {
      filterObject.fame_rating = {};
      if (search_preferences.fame_rating_min !== undefined) {
        filterObject.fame_rating.$gte = String(search_preferences.fame_rating_min);
      }
      if (search_preferences.fame_rating_max !== undefined) {
        filterObject.fame_rating.$lte = String(search_preferences.fame_rating_max);
      }
    }
    if (search_preferences.interests_filter) {
      filterObject.interests = { $overlap: search_preferences.interests_filter.split(',').map((t: string) => t.trim()) };
    }
    if (search_preferences.common_interests !== undefined) {
      filterObject.common_interests = { $gte: String(search_preferences.common_interests) };
    }
    if (sexual_preference === 'heterosexual') {
      filterObject.gender = gender === 'male' ? { $eq: 'female' } : { $eq: 'male' };
    } else if (sexual_preference === 'homosexual') {
      filterObject.gender = { $eq: gender };
    } else if (sexual_preference === 'bisexual') {
      filterObject.gender = { $in: ['male', 'female'] };
    }
    return filterObject;
  }

  useEffect(() => {
    async function fetchProfiles(prefs: any, sort?: Record<string, { $order: "asc" | "desc" }>) {
      const params = new URLSearchParams();
      if (prefs) {
        params.append("filter_by", JSON.stringify(prefs));
      }
      if (sort && Object.keys(sort).length > 0) {
        params.append("sort_by", JSON.stringify(sort));
      }
      params.append("limit", "100");
      try {
        const res = await fetch(`${window.location.origin}/api/profiles?${params.toString()}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data?.profiles)) {
          const formatted = data.data.profiles.map((d: any) => {
            const originalPictures = d.pictures || [];
            const pictures = d.profile_picture
              ? [{ picture_url: d.profile_picture }, ...originalPictures.filter((pic: any) => pic.picture_url !== d.profile_picture)]
              : originalPictures;
            return {
              profile_id: d.user_id,
              name: `${d.first_name} ${d.last_name || ""}`,
              age: d.age,
              gender: d.gender,
              sexual_preference: d.sexual_preference,
              biography: d.biography,
              profile_picture: d.profile_picture,
              gps_latitude: d.gps_latitude,
              gps_longitude: d.gps_longitude,
              nearest_location: d.nearest_location || '',
              pictures,
              interests: d.interests,
              fame_rating: d.fame_rating,
            };
          });
          setUsers(formatted);
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      }
    }
    if (preferences !== null) {
      fetchProfiles(preferences, sortCriteria);
    }
  }, [preferences, sortCriteria]);

  useEffect(() => {
    const currentUser = users[currentIndex];
    if (!currentUser) return;
    fetch(`${window.location.origin}/api/profiles/${currentUser.profile_id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    }).catch(() => {});
  }, [currentIndex, users]);

  const updateSort = (field: string, order: "asc" | "desc") => {
    setSortCriteria(prev => ({ ...prev, [field]: { $order: order } }));
  };

  const handleLikeUser = async () => {
    if (!users[currentIndex]) return;
    const currentUser = users[currentIndex];
    if (actedUserIds.has(currentUser.profile_id)) return;
    setIsActionLoading(true);
    try {
      await fetch(`${window.location.origin}/api/profiles/${currentUser.profile_id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      setActedUserIds(prev => new Set(prev).add(currentUser.profile_id));
      if (myProfile && myProfile.likes && myProfile.likes.includes(currentUser.profile_id)) {
        setShowMatchAnimation(true);
        setTimeout(() => setShowMatchAnimation(false), 3000);
      }
    } catch {}
    setIsActionLoading(false);
    setCurrentIndex(prev => prev + 1);
    setPhotoIndex(0);
  };

  const handleDislikeUser = async () => {
    if (!users[currentIndex]) return;
    const currentUser = users[currentIndex];
    if (actedUserIds.has(currentUser.profile_id)) return;
    setIsActionLoading(true);
    try {
      await fetch(`${window.location.origin}/api/profiles/${currentUser.profile_id}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      setActedUserIds(prev => new Set(prev).add(currentUser.profile_id));
    } catch {}
    setIsActionLoading(false);
    setCurrentIndex(prev => prev + 1);
    setPhotoIndex(0);
  };

  const handleNextPhoto = () => {
    if (!users[currentIndex]) return;
    setPhotoIndex(prev => (prev + 1) % users[currentIndex].pictures.length);
  };

  const handlePreviousPhoto = () => {
    if (!users[currentIndex]) return;
    setPhotoIndex(prev => (prev - 1 + users[currentIndex].pictures.length) % users[currentIndex].pictures.length);
  };

  const currentUser = users[currentIndex];
  const currentPhoto = currentUser ? currentUser.pictures[photoIndex]?.picture_url : '';

  return (
    <>
      <div className="slant-shape1"></div>
      <NavbarLogged />
      {showMatchAnimation && (
        <div className="match-animation-overlay">
          <div className="match-animation">
            <i className="bi bi-heart-fill match-icon"></i>
            <h2>It's a Match!</h2>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-center gap-3 my-3">
        <div className="d-flex flex-column align-items-center">
          <small>Age</small>
          <div className="btn-group" role="group" aria-label="Sort by age">
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.age?.$order === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("age", "asc")}
            >
              ↑
            </button>
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.age?.$order === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("age", "desc")}
            >
              ↓
            </button>
          </div>
        </div>
        <div className="d-flex flex-column align-items-center">
          <small>Distance</small>
          <div className="btn-group" role="group" aria-label="Sort by distance">
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.distance?.$order === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("distance", "asc")}
            >
              ↑
            </button>
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.distance?.$order === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("distance", "desc")}
            >
              ↓
            </button>
          </div>
        </div>
        <div className="d-flex flex-column align-items-center">
          <small>Fame</small>
          <div className="btn-group" role="group" aria-label="Sort by fame rating">
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.fame_rating?.$order === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("fame_rating", "asc")}
            >
              ↑
            </button>
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.fame_rating?.$order === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("fame_rating", "desc")}
            >
              ↓
            </button>
          </div>
        </div>
        <div className="d-flex flex-column align-items-center">
          <small>Interests</small>
          <div className="btn-group" role="group" aria-label="Sort by interests">
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.common_interests?.$order === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("common_interests", "asc")}
            >
              ↑
            </button>
            <button
              type="button"
              className={`btn btn-sm ${sortCriteria.common_interests?.$order === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => updateSort("common_interests", "desc")}
            >
              ↓
            </button>
          </div>
        </div>
      </div>
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        {currentUser ? (
          <div className="card text-center p-3 shadow-lg position-relative">
            <div className="image-container position-relative">
              <img src={currentPhoto} className="card-img-top" alt={currentUser.name} />
              {currentUser.pictures.length > 1 && (
                <>
                  <button
                    className="photo-arrow left-arrow position-absolute top-50 start-0 translate-middle-y btn btn-light"
                    onClick={handlePreviousPhoto}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    className="photo-arrow right-arrow position-absolute top-50 end-0 translate-middle-y btn btn-light"
                    onClick={handleNextPhoto}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
            <div className="card-body">
              <h4 className="card-title mb-2">
                {currentUser.name}, {currentUser.age}
              </h4>
              <p className="card-text text-muted mb-3">{currentUser.biography}</p>
              {currentUser.interests && currentUser.interests.length > 0 && (
                <p className="card-text mb-3">
                  <strong>Interests:</strong> {currentUser.interests
                    .map((item: any) => {
                      const tag = typeof item === 'object' ? item.interest_tag || '' : item;
                      return tag.startsWith('#') ? tag : '#' + tag;
                    })
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              <p className="card-text text-muted mb-1">
                Fame Rating: {currentUser.fame_rating}
              </p>
              <div className="action-buttons d-flex justify-content-around mt-3">
                <button
                  className="btn dislike-button rounded-circle shadow-sm"
                  onClick={handleDislikeUser}
                  title="Reject"
                  disabled={isActionLoading || actedUserIds.has(currentUser.profile_id)}
                >
                  <i className="bi bi-x text-danger"></i>
                </button>
                <button
                  className="btn like-button rounded-circle shadow-sm"
                  onClick={handleLikeUser}
                  title="Like"
                  disabled={isActionLoading || actedUserIds.has(currentUser.profile_id)}
                >
                  <i className="bi bi-heart-fill text-danger"></i>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <h2 className="text-center">No more users to show</h2>
        )}
      </div>
    </>
  );
}

export default Home;
