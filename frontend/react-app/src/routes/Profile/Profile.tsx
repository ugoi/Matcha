import { useEffect, useState } from 'react';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './profile.css';

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  sexual_preference: string;
  biography: string;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
  nearest_location?: string;
  pictures: Array<{
    picture_id: string;
    picture_url: string;
  }>;
}

function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileImgSrc, setProfileImgSrc] = useState<string>('https://via.placeholder.com/400x500?text=Unknown+1');
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`);
        if (!response.ok) throw new Error('Failed to fetch profile data');
        const result = await response.json();
        const data = result.data;
        const tempElement = document.createElement('div');
        tempElement.innerHTML = data.profile_picture;
        const decodedProfilePicture = tempElement.textContent || tempElement.innerText;

        const userProfile: UserProfile = {
          name: `${data.first_name} ${data.last_name}`,
          age: data.age,
          gender: data.gender,
          sexual_preference: data.sexual_preference,
          biography: data.biography,
          profile_picture: decodedProfilePicture,
          gps_latitude: data.gps_latitude,
          gps_longitude: data.gps_longitude,
          nearest_location: await fetchNearestLocation(data.gps_latitude, data.gps_longitude),
          pictures: data.pictures,
        };

        setUser(userProfile);
        const profilePicIndex = data.pictures.findIndex((pic: { picture_url: string }) => 
          pic.picture_url === decodedProfilePicture
        );
        if (profilePicIndex !== -1) setCurrentPhotoIndex(profilePicIndex);
        await checkImage(decodedProfilePicture);
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
      const tempElement = document.createElement('div');
      tempElement.innerHTML = url;
      const decodedUrl = tempElement.textContent || tempElement.innerText;
      const res = await fetch(decodedUrl);
      if (res.ok) {
        setProfileImgSrc(decodedUrl);
      } else {
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
      const userFormData = new URLSearchParams();
      const currentName = user?.name.split(' ');
      let nameUpdated = false;
      
      if (editedFirstName !== currentName?.[0]) {
        userFormData.append('first_name', editedFirstName);
        nameUpdated = true;
      }
      if (editedLastName !== currentName?.[1]) {
        userFormData.append('last_name', editedLastName);
        nameUpdated = true;
      }

      if (nameUpdated) {
        const userResponse = await fetch(`${window.location.origin}/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: userFormData.toString(),
        });

        if (!userResponse.ok) throw new Error('Failed to update user data');
      }

      if (editedBio !== user?.biography) {
        const profileResponse = await fetch(`${window.location.origin}/api/profiles/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ biography: editedBio }),
        });

        if (!profileResponse.ok) throw new Error('Failed to update profile');
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

  const handlePictureUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload?key=90d36ad33552879ee7c36bb4ba197e92', {
        method: 'POST',
        body: formData,
      });

      const imgbbResult = await imgbbResponse.json();
      if (!imgbbResponse.ok) throw new Error(imgbbResult.message || 'Failed to upload picture');

      const response = await fetch(`${window.location.origin}/api/profiles/me/pictures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pictures: [imgbbResult.data.url] }),
      });

      if (!response.ok) throw new Error('Failed to save picture to backend');
      
      const result = await response.json();
      setUser(prev => prev ? {
        ...prev,
        pictures: [...prev.pictures, { 
          picture_id: result.picture_id, 
          picture_url: imgbbResult.data.url 
        }]
      } : null);
    } catch (error) {
      console.error('Error uploading picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePicture = async (pictureId: string) => {
    if (!user || user.pictures.length <= 3) {
      alert('You must maintain at least 3 pictures');
      return;
    }

    try {
      const response = await fetch(`${window.location.origin}/api/profiles/me/pictures/${pictureId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete picture');

      setUser(prev => prev ? {
        ...prev,
        pictures: prev.pictures.filter(pic => pic.picture_id !== pictureId)
      } : null);

      if (currentPhotoIndex >= user!.pictures.length - 1) {
        setCurrentPhotoIndex(0);
      }
    } catch (error) {
      console.error('Error deleting picture:', error);
    }
  };

  const handleSetProfilePicture = async (pictureUrl: string) => {
    try {
      const response = await fetch(`${window.location.origin}/api/profiles/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile_picture: pictureUrl }),
      });

      if (!response.ok) throw new Error('Failed to update profile picture');
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  };

  if (!user) return <p></p>;

  return (
    <main>
      <NavbarLogged />
      <section className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <article className="card text-center p-3 shadow-lg">
          <header className="profile-img-container position-relative">
            <img
              src={user.pictures[currentPhotoIndex]?.picture_url || profileImgSrc}
              className="card-img-top"
              alt={`${user.name}`}
              onError={() => setProfileImgSrc('https://via.placeholder.com/400x500?text=Unknown+1')}
            />
            {isEditing && (
              <div className="picture-management-overlay">
                <div className="uploaded-pictures-grid">
                  {[...user.pictures].sort((a, b) => 
                    a.picture_url === user.profile_picture ? -1 : 
                    b.picture_url === user.profile_picture ? 1 : 0
                  ).map((pic, index) => (
                    <div 
                      key={pic.picture_id} 
                      className={`picture-container ${index === currentPhotoIndex ? 'selected' : ''} ${pic.picture_url === user.profile_picture ? 'profile-picture' : ''}`}
                    >
                      <img 
                        src={pic.picture_url} 
                        alt={`Upload ${index + 1}`} 
                        className="uploaded-thumbnail"
                        onClick={() => setCurrentPhotoIndex(index)}
                      />
                      <button
                        className="remove-picture-btn"
                        onClick={() => handleDeletePicture(pic.picture_id)}
                        type="button"
                        disabled={user.pictures.length <= 3}
                      >
                        ×
                      </button>
                      {pic.picture_url !== user.profile_picture && (
                        <button
                          className="set-profile-btn"
                          onClick={() => handleSetProfilePicture(pic.picture_url)}
                          type="button"
                        >
                          Set as Profile
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isUploading && (
                  <div className="upload-spinner">
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Uploading...</span>
                    </div>
                  </div>
                )}
                <div className="picture-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePictureUpload(file);
                    }}
                    className="picture-input"
                    disabled={isUploading || user.pictures.length >= 5}
                  />
                  <small className="text-light d-block mt-2">
                    {user.pictures.length}/5 pictures uploaded (minimum 3 required)
                  </small>
                </div>
              </div>
            )}
            <button className="edit-button" onClick={handleEditClick}>
              <i className="bi bi-pencil-square"></i> Edit
            </button>
            {user.pictures.length > 1 && (
              <div className="photo-navigation">
                <button 
                  className="photo-arrow left-arrow" 
                  onClick={() => setCurrentPhotoIndex((prev) => 
                    (prev - 1 + user.pictures.length) % user.pictures.length
                  )}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button 
                  className="photo-arrow right-arrow" 
                  onClick={() => setCurrentPhotoIndex((prev) => 
                    (prev + 1) % user.pictures.length
                  )}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </header>
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
        </article>
      </section>
    </main>
  );
}

export default Profile;