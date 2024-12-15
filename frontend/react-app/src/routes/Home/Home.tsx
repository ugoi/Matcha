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
  interests: string[];
  fame_rating: number;
};

function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      var settings = {
        "url": "http://localhost:3000/api/profiles",
        "method": "GET",
        "timeout": 0,
        "headers": {
          "Content-Type": "application/json"
        },
      };

      $.ajax(settings).done(function (response) {
        console.log(response);
        const formattedUsers = response.data.profiles.map((data: any) => ({
          profile_id: data.profile_id,
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
          fame_rating: data.fame_rating,
        }));
        setUsers(formattedUsers);
      });
    };

    fetchUsers();

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

  const handleNextUser = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % users.length);
    setPhotoIndex(0);
  };

  const handlePreviousUser = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + users.length) % users.length);
    setPhotoIndex(0);
  };

  const handleNextPhoto = () => {
    setPhotoIndex((prevIndex) => (prevIndex + 1) % users[currentIndex].pictures.length);
  };

  const handlePreviousPhoto = () => {
    setPhotoIndex((prevIndex) => (prevIndex - 1 + users[currentIndex].pictures.length) % users[currentIndex].pictures.length);
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
              <div className="d-flex justify-content-around">
                <button
                  className="btn dislike-button rounded-circle shadow-sm"
                  onClick={handlePreviousUser}
                >
                  <i className="bi bi-x"></i>
                </button>
                <button
                  className="btn like-button rounded-circle shadow-sm"
                  onClick={handleNextUser}
                >
                  <i className="bi bi-heart-fill"></i>
                </button>
              </div>
            </div>
            <div className="photo-navigation">
              <button className="photo-arrow left-arrow" onClick={handlePreviousPhoto}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <button className="photo-arrow right-arrow" onClick={handleNextPhoto}>
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
