// src/routes/Home/Home.tsx

import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './home.css';
import { useState, useEffect } from 'react';
import $ from 'jquery';

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

  const fetchProfilesWithPreferences = async (prefs: any) => {
    let query = 'http://localhost:3000/api/profiles';
    if (prefs) {
      const queryParams = new URLSearchParams();
      queryParams.append('filter_by', JSON.stringify(prefs));
      query = `${query}?${queryParams.toString()}`;
    }
    const settings = {
      url: query,
      method: 'GET',
      timeout: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    $.ajax(settings).done(function (response) {
      if (response?.data?.profiles) {
        const formattedUsers = response.data.profiles.map((data: any) => ({
          profile_id: data.user_id,
          name: `${data.first_name} ${data.last_name}`,
          age: data.age,
          gender: data.gender,
          sexual_preference: data.sexual_preference,
          biography: data.biography,
          profile_picture: data.profile_picture,
          gps_latitude: data.gps_latitude,
          gps_longitude: data.gps_longitude,
          nearest_location: '',
          pictures: data.pictures,
          interests: data.interests,
          fame_rating: data.fame_rating
        }));
        setUsers(formattedUsers);
      }
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/profiles/me`);
        const result = await res.json();
        if (result.status === 'fail' && result.data === 'profile not found') {
          window.location.href = '/create-profile';
        } else {
          const userData = result.data;
          const userGender = userData.gender;
          const userPreference = userData.sexual_preference;
          let combinedPreferences = userData.search_preferences || {};
          if (userGender === 'male' && userPreference === 'heterosexual') {
            combinedPreferences = { ...combinedPreferences, gender: { '$eq': 'female' } };
          } else if (userGender === 'female' && userPreference === 'heterosexual') {
            combinedPreferences = { ...combinedPreferences, gender: { '$eq': 'male' } };
          } else if (userGender === 'male' && userPreference === 'homosexual') {
            combinedPreferences = { ...combinedPreferences, gender: { '$eq': 'male' } };
          } else if (userGender === 'female' && userPreference === 'homosexual') {
            combinedPreferences = { ...combinedPreferences, gender: { '$eq': 'female' } };
          } else if (userPreference === 'bisexual') {
            combinedPreferences = { ...combinedPreferences, gender: { '$in': ['male', 'female'] } };
          }
          setPreferences(combinedPreferences);
        }
      } catch (error) {
        window.location.href = '/create-profile';
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (preferences !== null) {
      fetchProfilesWithPreferences(preferences);
    }
  }, [preferences]);

  const handleLikeUser = async () => {
    if (!users[currentIndex]) return;
    const userId = users[currentIndex].profile_id;
    try {
      await fetch(`http://localhost:3000/api/profiles/${userId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
    setCurrentIndex((prev) => (prev + 1) % users.length);
    setPhotoIndex(0);
  };

  const handleDislikeUser = async () => {
    if (!users[currentIndex]) return;
    const userId = users[currentIndex].profile_id;
    try {
      await fetch(`http://localhost:3000/api/profiles/${userId}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
    setCurrentIndex((prev) => (prev - 1 + users.length) % users.length);
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
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5 position-relative">
        {currentUser ? (
          <div className="card text-center p-3 shadow-lg">
            <img
              src={currentPhoto}
              className="card-img-top"
              alt={`${currentUser.name}`}
            />
            <div className="card-body">
              <h4 className="card-title mb-2">{currentUser.name}, {currentUser.age}</h4>
              <p className="card-text text-muted mb-3">{currentUser.biography}</p>
              {currentUser.interests && currentUser.interests.length > 0 && (
                <p className="card-text mb-3">
                  <strong>Interests:</strong>{' '}
                  {currentUser.interests.map((item: any) => {
                    if (typeof item === 'object' && item !== null) {
                      return item.interest_tag || '';
                    }
                    return item;
                  }).join(', ')}
                </p>
              )}
              <p className="card-text text-muted mb-1">Fame Rating: {currentUser.fame_rating}</p>
              <div className="d-flex justify-content-around">
                <button
                  className="btn dislike-button rounded-circle shadow-sm"
                  onClick={handleDislikeUser}
                >
                  <i className="bi bi-x"></i>
                </button>
                <button
                  className="btn like-button rounded-circle shadow-sm"
                  onClick={handleLikeUser}
                >
                  <i className="bi bi-heart-fill"></i>
                </button>
              </div>
            </div>
            <div className="photo-navigation">
              <button
                className="photo-arrow left-arrow"
                onClick={handlePreviousPhoto}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button
                className="photo-arrow right-arrow"
                onClick={handleNextPhoto}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
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
