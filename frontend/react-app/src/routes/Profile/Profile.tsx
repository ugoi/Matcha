import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged'
import './Profile.css'

export interface UserProfile {
  first_name: string
  last_name: string
  age: number
  gender: string
  sexual_preference: string
  biography: string
  profile_picture: string
  gps_latitude: number
  gps_longitude: number
  nearest_location?: string
  pictures: { picture_id: string; picture_url: string }[]
  fame_rating: number
  interests?: { interest_id: string; interest_tag: string }[]
}

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profileImgSrc, setProfileImgSrc] = useState('https://via.placeholder.com/400x500?text=Unknown+1')
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState('')
  const [editedFirstName, setEditedFirstName] = useState('')
  const [editedLastName, setEditedLastName] = useState('')
  const [editedInterests, setEditedInterests] = useState('')
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    async function fetchProfileData() {
      try {
        const res = await fetch(`${window.location.origin}/api/profiles/me`)
        if (!res.ok) throw new Error('Failed to fetch profile data')
        const responseJson = await res.json()
        if (responseJson.status === "fail") {
          if (responseJson.data === "profile not found") {
            navigate('/create-profile')
            return
          }
          setError(responseJson.data)
          return
        }
        handleUpdateGPS();
        const { data } = responseJson
        let nearestLocation = 'Unknown location'
        if (
          typeof data.gps_latitude === 'number' &&
          !isNaN(data.gps_latitude) &&
          typeof data.gps_longitude === 'number' &&
          !isNaN(data.gps_longitude)
        ) {
          const locRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.gps_latitude}&lon=${data.gps_longitude}&zoom=10`,
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
          )
          const locData = await locRes.json()
          const city = locData.address?.city || locData.address?.town || locData.address?.village || 'Unknown location'
          const country = locData.address?.country || ''
          nearestLocation = `${city}${country ? `, ${country}` : ''}`
        }
        const userProfile: UserProfile = {
          first_name: data.first_name,
          last_name: data.last_name,
          age: data.age,
          gender: data.gender,
          sexual_preference: data.sexual_preference,
          biography: data.biography,
          profile_picture: data.profile_picture,
          gps_latitude: data.gps_latitude,
          gps_longitude: data.gps_longitude,
          nearest_location: nearestLocation,
          pictures: data.pictures,
          fame_rating: data.fame_rating,
          interests: data.interests || []
        }
        setUser(userProfile)
        const profilePicIndex = data.pictures.findIndex(
          (pic: { picture_url: string }) => pic.picture_url === data.profile_picture
        )
        if (profilePicIndex !== -1) setCurrentPhotoIndex(profilePicIndex)
        try {
          const imgRes = await fetch(data.profile_picture)
          if (imgRes.ok) setProfileImgSrc(data.profile_picture)
        } catch {
          setProfileImgSrc('https://via.placeholder.com/400x500?text=Unknown+1')
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchProfileData()
  }, [navigate])

  const handleEditClick = () => {
    if (!user) return
    setIsEditing(true)
    setEditedBio(user.biography)
    setEditedFirstName(user.first_name)
    setEditedLastName(user.last_name)
    setEditedInterests(user.interests?.map(i => i.interest_tag).join(', ') || '')
  }

  const handleSaveClick = async () => {
    if (!user) return
    try {
      const finalFirstName = (editedFirstName || '').trim() === '' ? user.first_name : (editedFirstName || '').trim()
      const finalLastName = (editedLastName || '').trim() === '' ? user.last_name : (editedLastName || '').trim()
      if (finalFirstName !== user.first_name || finalLastName !== user.last_name) {
        const formData = new URLSearchParams()
        if (finalFirstName !== user.first_name) formData.append('first_name', finalFirstName)
        if (finalLastName !== user.last_name) formData.append('last_name', finalLastName)
        const res = await fetch(`${window.location.origin}/api/users/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        })
        if (!res.ok) throw new Error('Failed to update name')
      }
      if (editedBio !== user.biography) {
        const res = await fetch(`${window.location.origin}/api/profiles/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ biography: editedBio })
        })
        if (!res.ok) throw new Error('Failed to update biography')
      }
      const newInterests = (editedInterests || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      if (newInterests.length > 5) {
        alert('Max 5 interests')
        return
      }
      const oldInterests = user.interests?.map(i => i.interest_tag) || []
      if (JSON.stringify(newInterests) !== JSON.stringify(oldInterests)) {
        const deleteBody = new URLSearchParams()
        oldInterests.forEach(interest => {
          deleteBody.append("interests", interest)
        })
        const deleteOptions = {
          method: "DELETE",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Bearer YOUR_JWT_TOKEN"
          },
          body: deleteBody.toString()
        }
        const delRes = await fetch(`${window.location.origin}/api/profiles/me/interests`, deleteOptions)
        if (!delRes.ok) throw new Error("Failed to delete interests")
        if (newInterests.length > 0) {
          const postBody = new URLSearchParams()
          newInterests.forEach(interest => {
            postBody.append("interests", interest)
          })
          const postOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: "Bearer YOUR_JWT_TOKEN"
            },
            body: postBody.toString()
          }
          const postRes = await fetch(`${window.location.origin}/api/profiles/me/interests`, postOptions)
          if (!postRes.ok) throw new Error("Failed to update interests")
        }
      }
      setUser({
        ...user,
        first_name: finalFirstName,
        last_name: finalLastName,
        biography: editedBio,
        interests: newInterests.map(tag => ({ interest_id: '', interest_tag: tag }))
      })
      setIsEditing(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handlePictureUpload = async (file: File) => {
    if (!file || !user) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('pictures', file)
      const response = await fetch(`${window.location.origin}/api/profiles/me/pictures/upload`, {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to upload picture')
      if (
        !result.data ||
        !result.data.pictures ||
        !Array.isArray(result.data.pictures) ||
        result.data.pictures.length === 0
      ) {
        throw new Error('No pictures returned from backend')
      }
      const newPic = result.data.pictures[0]
      setUser({ ...user, pictures: [...user.pictures, { picture_id: newPic.picture_id, picture_url: newPic.picture_url }] })
    } catch (error) {
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePicture = async (pictureId: string, pictureUrl: string) => {
    if (!user || user.pictures.length <= 3) {
      alert('You must maintain at least 3 pictures')
      return
    }
    try {
      const myHeaders = new Headers()
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded")
      const urlencoded = new URLSearchParams()
      urlencoded.append("pictures", pictureUrl)
      const requestOptions : any = {
        method: "DELETE",
        headers: myHeaders,
        body: urlencoded.toString(),
        redirect: "follow"
      }
      const res = await fetch(`${window.location.origin}/api/profiles/me/pictures`, requestOptions)
      if (!res.ok) throw new Error('Failed to delete picture')
      const newPics = user.pictures.filter(pic => pic.picture_id !== pictureId)
      let newProfilePicture = user.profile_picture
      if (user.profile_picture === pictureUrl && newPics.length > 0) {
        newProfilePicture = newPics[0].picture_url
        await fetch(`${window.location.origin}/api/profiles/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_picture: newProfilePicture })
        })
      }
      setUser({ ...user, pictures: newPics, profile_picture: newProfilePicture })
      if (currentPhotoIndex >= newPics.length) setCurrentPhotoIndex(0)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSetProfilePicture = async (pictureUrl: string) => {
    try {
      const res = await fetch(`${window.location.origin}/api/profiles/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_picture: pictureUrl })
      })
      if (!res.ok) throw new Error('Failed to update profile picture')
      setUser(prev => {
        if (!prev) return prev
        const idx = prev.pictures.findIndex(pic => pic.picture_url === pictureUrl)
        if (idx !== -1) setCurrentPhotoIndex(idx)
        return { ...prev, profile_picture: pictureUrl }
      })
    } catch (error) {
      console.error(error)
    }
  }

  if (error) {
    return (
      <main>
        <NavbarLogged />
        <section className="content d-flex flex-column align-items-center justify-content-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </section>
      </main>
    )
  }

  if (!user) return <p></p>
  return (
    <main>
      <div className="slant-shape1"></div>
      <NavbarLogged />
      <section className="content d-flex flex-column align-items-center justify-content-center">
        <article className="card text-center p-3 shadow-lg">
          <header className="profile-img-container position-relative">
            <img
              src={user.pictures[currentPhotoIndex]?.picture_url || profileImgSrc}
              className="card-img-top"
              alt={`${user.first_name} ${user.last_name}`}
              onError={() => setProfileImgSrc('https://via.placeholder.com/400x500?text=Unknown+1')}
            />
            {isEditing && (
              <div className="picture-management-overlay">
                <div className="uploaded-pictures-grid">
                  {[...user.pictures]
                    .sort((a, b) =>
                      a.picture_url === user.profile_picture ? -1 : b.picture_url === user.profile_picture ? 1 : 0
                    )
                    .map((pic, index) => (
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
                          onClick={() => handleDeletePicture(pic.picture_id, pic.picture_url)}
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
                      const file = e.target.files?.[0]
                      if (file) handlePictureUpload(file)
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
              <i className="bi bi-pencil-square"></i>
            </button>
            {user.pictures.length > 1 && (
              <div className="photo-navigation">
                <button
                  className="photo-arrow left-arrow"
                  onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + user.pictures.length) % user.pictures.length)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  className="photo-arrow right-arrow"
                  onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % user.pictures.length)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </header>
          <div className="card-body">
            <h4 className="card-title mb-2">
              {user.first_name} {user.last_name}, {user.age}
            </h4>
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
                      maxLength={20}
                    />
                  </div>
                  <div className="col">
                    <input
                      type="text"
                      className="form-control"
                      value={editedLastName}
                      onChange={(e) => setEditedLastName(e.target.value)}
                      placeholder="Last Name"
                      maxLength={20}
                    />
                  </div>
                </div>
                <textarea
                  className="form-control mb-2"
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  rows={4}
                  maxLength={100}
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  value={editedInterests}
                  onChange={(e) => setEditedInterests(e.target.value)}
                  placeholder="e.g. golf, cycling"
                  maxLength={40}
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
              <>
                <p className="card-text text-muted mb-3">{user.biography}</p>
                {user.interests && user.interests.length > 0 ? (
                  <p className="card-text text-muted">
                    <strong>Interests:</strong> {user.interests.map(i => " #" + i.interest_tag)}
                  </p>
                ) : (
                  <p className="card-text text-muted"></p>
                )}
              </>
            )}
            <p className="card-text text-muted mb-1">📍 {user.nearest_location}</p>
            <p className="card-text text-muted mb-1">Fame Rating: {user.fame_rating}</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default Profile
