import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './home.css';

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
  });
  const [actedUserIds, setActedUserIds] = useState<Set<number>>(new Set());
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const res = await fetch(`${window.location.origin}/api/profiles/me`, { credentials: 'include' });
        const result = await res.json();
        if (result.status === 'success') {
          setPreferences(buildPreferences(result.data));
          setMyProfile(result.data);
        } else {
          navigate('/profile');
        }
      } catch (error) {
        navigate('/profile');
      }
    }
    fetchUserProfile();
  }, [navigate]);

  const buildPreferences = (userData: any) => {
    const { gender, sexual_preference, search_preferences = {} } = userData;
    if (sexual_preference === 'heterosexual') {
      return { ...search_preferences, gender: gender === 'male' ? { '$eq': 'female' } : { '$eq': 'male' } };
    } else if (sexual_preference === 'homosexual') {
      return { ...search_preferences, gender: { '$eq': gender } };
    } else if (sexual_preference === 'bisexual') {
      return { ...search_preferences, gender: { '$in': ['male', 'female'] } };
    }
    return search_preferences;
  };

  useEffect(() => {
    async function fetchProfiles(prefs: any, sort?: Record<string, { $order: "asc" | "desc" }>) {
      const params = new URLSearchParams();
      if (prefs) params.append("filter_by", JSON.stringify(prefs));
      if (sort && Object.keys(sort).length > 0) {
        params.append("sort_by", JSON.stringify(sort));
      }
      try {
        const res = await fetch(`http://localhost:3000/api/profiles?${params.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data?.profiles)) {
          const formatted = data.data.profiles.map((d: any) => ({
            profile_id: d.user_id,
            name: `${d.first_name} ${d.last_name}`,
            age: d.age,
            gender: d.gender,
            sexual_preference: d.sexual_preference,
            biography: d.biography,
            profile_picture: d.profile_picture,
            gps_latitude: d.gps_latitude,
            gps_longitude: d.gps_longitude,
            nearest_location: d.nearest_location || '',
            pictures: d.pictures,
            interests: d.interests,
            fame_rating: d.fame_rating,
          }));
          setUsers(formatted);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
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
    fetch(`http://localhost:3000/api/profiles/${currentUser.profile_id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    }).catch(err => console.error("Error recording visit:", err));
  }, [currentIndex, users]);

  const toggleSort = (field: string, defaultOrder: "asc" | "desc") => {
    setSortCriteria(prev => {
      if (prev[field]) {
        const newOrder = prev[field].$order === "asc" ? "desc" : "asc";
        return { [field]: { $order: newOrder } };
      }
      return { [field]: { $order: defaultOrder } };
    });
  };

  const handleLikeUser = async () => {
    if (!users[currentIndex]) return;
    const currentUser = users[currentIndex];
    if (actedUserIds.has(currentUser.profile_id)) return;
    setIsActionLoading(true);
    try {
      await fetch(`http://localhost:3000/api/profiles/${currentUser.profile_id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      setActedUserIds(prev => new Set(prev).add(currentUser.profile_id));
      if (myProfile && myProfile.likes && myProfile.likes.includes(currentUser.profile_id)) {
        setShowMatchAnimation(true);
        setTimeout(() => setShowMatchAnimation(false), 3000);
      }
    } catch (error) {
      console.error('Error liking user:', error);
    }
    setIsActionLoading(false);
    setCurrentIndex(prev => (prev + 1) % users.length);
    setPhotoIndex(0);
  };

  const handleDislikeUser = async () => {
    if (!users[currentIndex]) return;
    const currentUser = users[currentIndex];
    if (actedUserIds.has(currentUser.profile_id)) return;
    setIsActionLoading(true);
    try {
      await fetch(`http://localhost:3000/api/profiles/${currentUser.profile_id}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      setActedUserIds(prev => new Set(prev).add(currentUser.profile_id));
    } catch (error) {
      console.error('Error disliking user:', error);
    }
    setIsActionLoading(false);
    setCurrentIndex(prev => (prev + 1) % users.length);
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
      <NavbarLogged />
      {showMatchAnimation && (
        <div className="match-animation-overlay">
          <div className="match-animation">
            <i className="bi bi-heart-fill match-icon"></i>
            <h2>It's a Match!</h2>
          </div>
        </div>
      )}
      <div className="sort-container d-flex justify-content-center gap-2 my-3">
        <button className="btn btn-outline-primary" onClick={() => toggleSort("age", "asc")}>Sort by Age</button>
        <button className="btn btn-outline-primary" onClick={() => toggleSort("distance", "desc")}>Sort by Distance</button>
        <button className="btn btn-outline-primary" onClick={() => toggleSort("fame_rating", "desc")}>Sort by Fame Rating</button>
        <button className="btn btn-outline-primary" onClick={() => toggleSort("common_interests", "desc")}>Sort by Common Interests</button>
      </div>
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        {currentUser ? (
          <div className="card text-center p-3 shadow-lg position-relative">
            <div className="image-container position-relative">
              <img src={currentPhoto} className="card-img-top" alt={currentUser.name} />
              {currentUser.pictures.length > 1 && (
                <>
                  <button className="photo-arrow left-arrow position-absolute top-50 start-0 translate-middle-y btn btn-light" onClick={handlePreviousPhoto}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button className="photo-arrow right-arrow position-absolute top-50 end-0 translate-middle-y btn btn-light" onClick={handleNextPhoto}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
            <div className="card-body">
              <h4 className="card-title mb-2">{currentUser.name}, {currentUser.age}</h4>
              <p className="card-text text-muted mb-3">{currentUser.biography}</p>
              {currentUser.interests && currentUser.interests.length > 0 && (
                <p className="card-text mb-3">
                  <strong>Interests:</strong> {currentUser.interests.map((item: any) => (typeof item === 'object' ? item.interest_tag || '' : item)).filter(Boolean).join(', ')}
                </p>
              )}
              <p className="card-text text-muted mb-1">Fame Rating: {currentUser.fame_rating}</p>
              <div className="action-buttons d-flex justify-content-around mt-3">
                <button className="btn dislike-button rounded-circle shadow-sm" onClick={handleDislikeUser} title="Reject" disabled={isActionLoading || actedUserIds.has(currentUser.profile_id)}>
                  <i className="bi bi-x text-danger"></i>
                </button>
                <button className="btn like-button rounded-circle shadow-sm" onClick={handleLikeUser} title="Like" disabled={isActionLoading || actedUserIds.has(currentUser.profile_id)}>
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
