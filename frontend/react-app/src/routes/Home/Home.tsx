// src/routes/Home/Home.tsx
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './home.css';
import { useState } from 'react';

const users = [
  {
    id: 1,
    name: 'Alice',
    age: 24,
    bio: 'Loves hiking and outdoor adventures.',
    images: [
      'https://via.placeholder.com/400x500?text=Alice+1',
      'https://via.placeholder.com/400x500?text=Alice+2',
      'https://via.placeholder.com/400x500?text=Alice+3',
    ],
  },
  {
    id: 2,
    name: 'Bob',
    age: 28,
    bio: 'Tech enthusiast and coffee lover.',
    images: [
      'https://via.placeholder.com/400x500?text=Bob+1',
      'https://via.placeholder.com/400x500?text=Bob+2',
      'https://via.placeholder.com/400x500?text=Bob+3',
    ],
  },
  {
    id: 3,
    name: 'Charlie',
    age: 26,
    bio: 'Enjoys music and long road trips.',
    images: [
      'https://via.placeholder.com/400x500?text=Charlie+1',
      'https://via.placeholder.com/400x500?text=Charlie+2',
      'https://via.placeholder.com/400x500?text=Charlie+3',
    ],
  },
];

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  const handleNextUser = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % users.length);
    setPhotoIndex(0);
  };

  const handlePreviousUser = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + users.length) % users.length);
    setPhotoIndex(0);
  };

  const handleNextPhoto = () => {
    setPhotoIndex((prevIndex) => (prevIndex + 1) % users[currentIndex].images.length);
  };

  const handlePreviousPhoto = () => {
    setPhotoIndex((prevIndex) => (prevIndex - 1 + users[currentIndex].images.length) % users[currentIndex].images.length);
  };

  const currentUser = users[currentIndex];
  const currentPhoto = currentUser.images[photoIndex];

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
              <p className="card-text text-muted mb-3">{currentUser.bio}</p>
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
