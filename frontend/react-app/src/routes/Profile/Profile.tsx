import { useEffect, useState } from 'react';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './profile.css';

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  sexual_preference: string;
  biography: string;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
}

function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileImgSrc, setProfileImgSrc] = useState<string>('/src/assets/unknown_picture.png'); // Default placeholder

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const result = await response.json();
        
        // if (result.status === "fail" && result.data === "profile not found") {
        //   window.location.href = '/create-profile';
        //   return;
        // }

        const data = result.data;

        // Map the API response to the UserProfile interface
        const userProfile: UserProfile = {
          name: `${data.first_name} ${data.last_name}`, // Combine first and last name
          age: data.age,
          gender: data.gender,
          sexual_preference: data.sexual_preference,
          biography: data.biography,
          profile_picture: data.profile_picture,
          gps_latitude: data.gps_latitude,
          gps_longitude: data.gps_longitude,
        };

        setUser(userProfile);
        await checkImage(data.profile_picture); // Check if the profile picture is valid
      } catch (error) {
        console.error('Error fetching profile data:', error);
        window.location.href = '/create-profile';
      }
    };

    fetchProfileData();
  }, []);

  // Function to check if the image URL is valid
  const checkImage = async (url: string) => {
    try {
      console.log('Checking image URL:', url);
      const res = await fetch(url);
      if (res.ok) {
        setProfileImgSrc(url);
      } else {
        console.error('Image not found, using placeholder');
        setProfileImgSrc('/src/assets/unknown_picture.png');
      }
    } catch (error) {
      console.error('Error fetching image:', error); 
      setProfileImgSrc('/src/assets/unknown_picture.png');
    }
  };

  if (!user) {
    return <p></p>;
  }

  return (
    <>
      <NavbarLogged />
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="card text-center p-3 shadow-lg">
          <div className="profile-img-container position-relative">
            <img
              src={profileImgSrc}
              className="card-img-top"
              alt={`${user.name}`}
              onError={() => setProfileImgSrc('/src/assets/unknown_picture.png')}
            />
            <button className="edit-button">
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          </div>
          <div className="card-body">
            <h4 className="card-title mb-2">{user.name}, {user.age}</h4>
            <p className="card-text text-muted mb-3">{user.biography}</p>
            <p className="card-text text-muted mb-1">GPS Coordinates: {user.gps_latitude}, {user.gps_longitude}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
