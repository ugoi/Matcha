// src/routes/Home/Home.tsx

import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './home.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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


  const [sortField, setSortField] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.status === 'success') {
          setPreferences(buildPreferences(result.data));
        } else {
          navigate('/create-profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        navigate('/create-profile');
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const buildPreferences = (userData: any) => {
    const { gender, sexual_preference, search_preferences } = userData;
    let combinedPreferences = search_preferences || {};

    switch (sexual_preference) {
      case 'heterosexual':
        combinedPreferences = {
          ...combinedPreferences,
          gender: gender === 'male' ? { '$eq': 'female' } : { '$eq': 'male' },
        };
        break;
      case 'homosexual':
        combinedPreferences = {
          ...combinedPreferences,
          gender: { '$eq': gender },
        };
        break;
      case 'bisexual':
        combinedPreferences = {
          ...combinedPreferences,
          gender: { '$in': ['male', 'female'] },
        };
        break;
      default:
        break;
    }

    return combinedPreferences;
  };

  useEffect(() => {
    const fetchProfilesWithPreferences = async (prefs: any, sortField?: string) => {
      const queryParams = new URLSearchParams();

      if (prefs) {
        queryParams.append('filter_by', JSON.stringify(prefs));
      }
      if (sortField) {
        const sortObj = {
          [sortField]: { '$order': 'asc' },
        };
        queryParams.append('sort_by', JSON.stringify(sortObj));
      }

      let queryUrl = `http://localhost:3000/api/profiles?${queryParams.toString()}`;

      try {
        const response = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (data?.status === 'success' && Array.isArray(data.data?.profiles)) {
          const formattedUsers = data.data.profiles.map((data: any) => ({
            profile_id: data.user_id,
            name: `${data.first_name} ${data.last_name}`,
            age: data.age,
            gender: data.gender,
            sexual_preference: data.sexual_preference,
            biography: data.biography,
            profile_picture: data.profile_picture,
            gps_latitude: data.gps_latitude,
            gps_longitude: data.gps_longitude,
            nearest_location: data.nearest_location || '',
            pictures: data.pictures,
            interests: data.interests,
            fame_rating: data.fame_rating
          }));
          setUsers(formattedUsers);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setUsers([]);
      }
    };

    if (preferences !== null) {
      fetchProfilesWithPreferences(preferences, sortField || undefined);
    }
  }, [preferences, sortField]);

  const handleLikeUser = async () => {
    if (!users[currentIndex]) return;
    const userId = users[currentIndex].profile_id;
    try {
      const response = await fetch(`http://localhost:3000/api/profiles/${userId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error liking user:', errorData);
      } else {
        console.log(`Successfully liked user with ID: ${userId}`);
      }
    } catch (error) {
      console.error('Error liking user:', error);
    }

    setCurrentIndex((prev) => (prev + 1) % users.length);
    setPhotoIndex(0);
  };

  const handleDislikeUser = async () => {
    if (!users[currentIndex]) return;
    const userId = users[currentIndex].profile_id;

    try {
      const visitResponse = await fetch(`http://localhost:3000/api/profiles/${userId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visited_user_id: userId }),
        credentials: 'include',
      });

      if (!visitResponse.ok) {
        const errorData = await visitResponse.json();
        console.error('Error logging visit:', errorData);
        alert(`Error logging visit: ${errorData.message || 'Unknown error'}`);
        return; 
      } else {
        console.log(`Successfully logged visit for user ID: ${userId}`);
      }

      const dislikeResponse = await fetch(`http://localhost:3000/api/profiles/${userId}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!dislikeResponse.ok) {
        const errorData = await dislikeResponse.json();
        console.error('Error disliking user:', errorData);
      } else {
        console.log(`Successfully disliked user with ID: ${userId}`);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    }

    setCurrentIndex((prev) => (prev + 1) % users.length);
    setPhotoIndex(0);
  };
  const handleNextPhoto = () => {
    if (!users[currentIndex]) return;
    setPhotoIndex((prev) => (prev + 1) % users[currentIndex].pictures.length);
  };

  const handlePreviousPhoto = () => {
    if (!users[currentIndex]) return;
    setPhotoIndex((prev) => (prev - 1 + users[currentIndex].pictures.length) % users[currentIndex].pictures.length);
  };

  const currentUser = users[currentIndex];
  const currentPhoto = currentUser ? currentUser.pictures[photoIndex]?.picture_url : '';

  return (
    <>
      <NavbarLogged />

      <div className="d-flex justify-content-center gap-2 my-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => setSortField('age')}
        >
          Sort by Age
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setSortField('distance')}
        >
          Sort by Location
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setSortField('fame_rating')}
        >
          Sort by Fame Rating
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setSortField('common_interests')}
        >
          Sort by Common Tags
        </button>
      </div>

      <div className="content d-flex flex-column align-items-center justify-content-center mt-5 position-relative">
        {currentUser ? (
          <div className="card text-center p-3 shadow-lg">
            <div className="position-relative">
              <img
                src={currentPhoto}
                className="card-img-top"
                alt={`${currentUser.name}`}
              />
              {/* Photo Navigation Buttons */}
              {currentUser.pictures.length > 1 && (
                <>
                  <button
                    className="photo-arrow left-arrow position-absolute top-50 start-0 translate-middle-y btn btn-light"
                    onClick={handlePreviousPhoto}
                    style={{ zIndex: 1 }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    className="photo-arrow right-arrow position-absolute top-50 end-0 translate-middle-y btn btn-light"
                    onClick={handleNextPhoto}
                    style={{ zIndex: 1 }}
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
                  <strong>Interests:</strong>{' '}
                  {currentUser.interests
                    .map((item: any) => {
                      if (typeof item === 'object' && item !== null) {
                        return item.interest_tag || '';
                      }
                      return item;
                    })
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              <p className="card-text text-muted mb-1">
                Fame Rating: {currentUser.fame_rating}
              </p>
              <div className="d-flex justify-content-around mt-3">
                <button
                  className="btn dislike-button rounded-circle shadow-sm"
                  onClick={handleDislikeUser}
                  title="Reject"
                >
                  <i className="bi bi-x text-danger"></i>
                </button>
                <button
                  className="btn like-button rounded-circle shadow-sm"
                  onClick={handleLikeUser}
                  title="Like"
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
