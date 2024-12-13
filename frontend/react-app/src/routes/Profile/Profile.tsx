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
  nearest_location?: string;
}

function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileImgSrc, setProfileImgSrc] = useState<string>('https://via.placeholder.com/400x500?text=Unknown+1');
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const result = await response.json();
        const data = result.data;

        const userProfile: UserProfile = {
          name: `${data.first_name} ${data.last_name}`,
          age: data.age,
          gender: data.gender,
          sexual_preference: data.sexual_preference,
          biography: data.biography,
          profile_picture: data.profile_picture,
          gps_latitude: data.gps_latitude,
          gps_longitude: data.gps_longitude,
          nearest_location: await fetchNearestLocation(data.gps_latitude, data.gps_longitude),
        };

        setUser(userProfile);
        await checkImage(data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        window.location.href = '/create-profile';
      }
    };

    fetchProfileData();
  }, []);

  const fetchNearestLocation = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown location';
      const country = data.address?.country || '';
      return `${city}${country ? `, ${country}` : ''}`;
    } catch (error) {
      console.error('Error fetching location:', error);
      return 'Unknown location';
    }
  };

  const checkImage = async (url: string) => {
    try {
      console.log('Checking image URL:', url);
      const res = await fetch(url);
      if (res.ok) {
        setProfileImgSrc(url);
      } else {
        console.error('Image not found, using placeholder');
        setProfileImgSrc('https://via.placeholder.com/400x500?text=Unknown+1');
      }
    } catch (error) {
      console.error('Error fetching image:', error); 
      setProfileImgSrc('https://via.placeholder.com/400x500?text=Unknown+1');
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedBio(user?.biography || '');
    const [firstName, lastName] = user?.name.split(' ') || ['', ''];
    setEditedFirstName(firstName);
    setEditedLastName(lastName);
  };

  const handleSaveClick = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          biography: editedBio,
          first_name: editedFirstName,
          last_name: editedLastName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setUser(prev => prev ? {
        ...prev,
        biography: editedBio,
        name: `${editedFirstName} ${editedLastName}`,
      } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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
              onError={() => setProfileImgSrc('https://via.placeholder.com/400x500?text=Unknown+1')}
            />
            <button className="edit-button" onClick={handleEditClick}>
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          </div>
          <div className="card-body">
            <h4 className="card-title mb-2">{user.name}, {user.age}</h4>
            
            {isEditing ? (
              <div className="mb-3">
                <div className="row mb-2">
                  <div className="col">
                    <input
                      type="text"
                      className="form-control"
                      value={editedFirstName}
                      onChange={(e) => setEditedFirstName(e.target.value)}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control"
                      value={editedLastName}
                      onChange={(e) => setEditedLastName(e.target.value)}
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                <textarea
                  className="form-control mb-2"
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={4}
                />
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-primary" onClick={handleSaveClick}>
                    Save
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="card-text text-muted mb-3">{user.biography}</p>
            )}

            <p className="card-text text-muted mb-1">
              📍 {user.nearest_location}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
