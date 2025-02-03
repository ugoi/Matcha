import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged'
import './home.css'

type User = {
  profile_id: number
  name: string
  age: number
  gender: string
  sexual_preference: string
  biography: string
  profile_picture: string
  gps_latitude: number
  gps_longitude: number
  nearest_location: string
  pictures: { picture_url: string }[]
  interests: any[]
  fame_rating: number
}

function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [preferences, setPreferences] = useState<any>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [visitedUserIds, setVisitedUserIds] = useState<Set<number>>(new Set())
  const [likedUserIds, setLikedUserIds] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const res = await fetch(`${window.location.origin}/api/profiles/me`, { credentials: 'include' })
        const result = await res.json()
        if (result.status === 'success') {
          setPreferences(buildPreferences(result.data))
        } else {
          navigate('/profile')
        }
      } catch (error) {
        navigate('/profile')
      }
    }
    fetchUserProfile()
  }, [navigate])

  const buildPreferences = (userData: any) => {
    const { gender, sexual_preference, search_preferences = {} } = userData
    if (sexual_preference === 'heterosexual') {
      return { ...search_preferences, gender: gender === 'male' ? { '$eq': 'female' } : { '$eq': 'male' } }
    } else if (sexual_preference === 'homosexual') {
      return { ...search_preferences, gender: { '$eq': gender } }
    } else if (sexual_preference === 'bisexual') {
      return { ...search_preferences, gender: { '$in': ['male', 'female'] } }
    }
    return search_preferences
  }

  useEffect(() => {
    async function fetchProfiles(prefs: any, sort?: string) {
      const params = new URLSearchParams()
      if (prefs) params.append('filter_by', JSON.stringify(prefs))
      if (sort) params.append('sort_by', JSON.stringify({ [sort]: { '$order': 'asc' } }))
      try {
        const res = await fetch(`http://localhost:3000/api/profiles?${params.toString()}`, { credentials: 'include' })
        const data = await res.json()
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
            fame_rating: d.fame_rating
          }))
          setUsers(formatted)
        } else {
          setUsers([])
        }
      } catch (error) {
        setUsers([])
      }
    }
    if (preferences !== null) {
      fetchProfiles(preferences, sortField || undefined)
    }
  }, [preferences, sortField])

  // Automatically record a visit when a new profile is shown.
  useEffect(() => {
    const currentUser = users[currentIndex]
    if (!currentUser) return
    if (!visitedUserIds.has(currentUser.profile_id)) {
      fetch(`http://localhost:3000/api/profiles/${currentUser.profile_id}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      setVisitedUserIds(prev => {
        const newSet = new Set(prev)
        newSet.add(currentUser.profile_id)
        return newSet
      })
    }
  }, [currentIndex, users, visitedUserIds])

  const handleLikeUser = async () => {
    if (!users[currentIndex]) return
    const currentUser = users[currentIndex]
    if (likedUserIds.has(currentUser.profile_id)) {
      setCurrentIndex(prev => (prev + 1) % users.length)
      setPhotoIndex(0)
      return
    }
    try {
      const res = await fetch(`http://localhost:3000/api/profiles/${currentUser.profile_id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      if (res.ok) {
        setLikedUserIds(prev => {
          const newSet = new Set(prev)
          newSet.add(currentUser.profile_id)
          return newSet
        })
      } else {
        const err = await res.json()
        console.error('Error liking user:', err)
      }
    } catch (error) {
      console.error('Error liking user:', error)
    }
    setCurrentIndex(prev => (prev + 1) % users.length)
    setPhotoIndex(0)
  }

  const handleDislikeUser = async () => {
    if (!users[currentIndex]) return
    const currentUser = users[currentIndex]
    try {
      await fetch(`http://localhost:3000/api/profiles/${currentUser.profile_id}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
    setCurrentIndex(prev => (prev + 1) % users.length)
    setPhotoIndex(0)
  }

  const handleNextPhoto = () => {
    if (!users[currentIndex]) return
    setPhotoIndex(prev => (prev + 1) % users[currentIndex].pictures.length)
  }

  const handlePreviousPhoto = () => {
    if (!users[currentIndex]) return
    setPhotoIndex(prev => (prev - 1 + users[currentIndex].pictures.length) % users[currentIndex].pictures.length)
  }

  const currentUser = users[currentIndex]
  const currentPhoto = currentUser ? currentUser.pictures[photoIndex]?.picture_url : ''

  return (
    <>
      <NavbarLogged />
      <div className="d-flex justify-content-center gap-2 my-3">
        <button className="btn btn-outline-primary" onClick={() => setSortField('age')}>
          Sort by Age
        </button>
        <button className="btn btn-outline-primary" onClick={() => setSortField('distance')}>
          Sort by Location
        </button>
        <button className="btn btn-outline-primary" onClick={() => setSortField('fame_rating')}>
          Sort by Fame Rating
        </button>
        <button className="btn btn-outline-primary" onClick={() => setSortField('common_interests')}>
          Sort by Common Tags
        </button>
      </div>
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5 position-relative">
        {currentUser ? (
          <div className="card text-center p-3 shadow-lg">
            <div className="position-relative">
              <img src={currentPhoto} className="card-img-top" alt={currentUser.name} />
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
                    .map((item: any) => (typeof item === 'object' ? item.interest_tag || '' : item))
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              <p className="card-text text-muted mb-1">Fame Rating: {currentUser.fame_rating}</p>
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
                  disabled={likedUserIds.has(currentUser.profile_id)}
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
  )
}

export default Home
