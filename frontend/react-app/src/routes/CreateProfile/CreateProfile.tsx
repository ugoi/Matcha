import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateProfile.css';

interface ErrorState {
  age?: string;
  interests?: string;
  pictures?: string;
  general?: string;
}

interface ErrorDetail {
  path: string;
  msg: string;
}

function CreateProfile() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState(18);
  const [gender, setGender] = useState('');
  const [sexualPreference, setSexualPreference] = useState('');
  const [biography, setBiography] = useState('');
  const [interests, setInterests] = useState('');
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ErrorState>({});
  const [uploadedPictures, setUploadedPictures] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });

  const getLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.latitude && data.longitude) {
        setCoordinates({ latitude: data.latitude, longitude: data.longitude });
      } else {
        throw new Error('Location data not available');
      }
    } catch (error) {
      setCoordinates({ latitude: 40.7128, longitude: -74.0060 });
      setErrors(prev => ({ ...prev, location: 'Using approximate location.' }));
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        async () => {
          await getLocationByIP();
        },
        { timeout: 5000 }
      );
    } else {
      getLocationByIP();
    }
  }, []);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (uploadedPictures.length + newFiles.length > 5) {
        setErrors({ pictures: 'Maximum 5 pictures allowed' });
        return;
      }
      setIsUploading(true);
      try {
        for (const file of newFiles) {
          const formData = new FormData();
          formData.append('image', file);
          const response = await fetch('https://api.imgbb.com/1/upload?key=90d36ad33552879ee7c36bb4ba197e92', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Failed to upload picture');
          const backendResponse = await fetch(`${window.location.origin}/api/profiles/me/pictures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pictures: [result.data.url] }),
          });
          if (!backendResponse.ok) {
            const errorData = await backendResponse.json();
            throw new Error(errorData.message || 'Failed to save picture URL to backend');
          }
          setUploadedPictures(prev => [...prev, result.data.url]);
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, pictures: error instanceof Error ? error.message : 'Failed to upload pictures' }));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemovePicture = async (urlToRemove: string, index: number) => {
    try {
      const response = await fetch(`${window.location.origin}/api/profiles/me/pictures`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToRemove }),
      });
      if (!response.ok) throw new Error('Failed to remove picture');
      setUploadedPictures(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      setErrors(prev => ({ ...prev, pictures: error instanceof Error ? error.message : 'Failed to remove picture' }));
    }
  };

  const handleNextStep = () => {
    setErrors({});
    if (step === 4) {
      let splitted = interests.split(',').map(t => t.trim()).filter(Boolean);
      splitted = splitted.map(item => (item.startsWith('#') ? item : `#${item}`));
      if (splitted.length > 5) {
        setErrors({ interests: 'Maximum 5 interests allowed' });
        return;
      }
      setInterests(splitted.join(', '));
    }
    if (canProceedToNext()) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    try {
      if (uploadedPictures.length < 3) {
        setErrors({ pictures: 'At least 3 pictures are required' });
        return;
      }
      let splitted = interests.split(',').map(t => t.trim()).filter(Boolean);
      splitted = splitted.map(item => (item.startsWith('#') ? item : `#${item}`));
      if (splitted.length > 5) {
        setErrors({ interests: 'Maximum 5 interests allowed' });
        return;
      }
      const formData = new URLSearchParams();
      formData.append('first_name', name);
      formData.append('age', age.toString());
      formData.append('gender', gender.toLowerCase());
      formData.append('sexual_preference', sexualPreference.toLowerCase());
      formData.append('biography', biography);
      formData.append('profile_picture', uploadedPictures[0]);
      formData.append('gps_latitude', coordinates.latitude.toString());
      formData.append('gps_longitude', coordinates.longitude.toString());
      formData.append('age_min', '18');
      formData.append('age_max', '90');
      formData.append('location_radius', '50');
      formData.append('fame_rating_min', '0');
      formData.append('fame_rating_max', '100');
      formData.append('common_interests', '0');
      const response = await fetch(`${window.location.origin}/api/profiles/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.status === 'fail' && result.data?.errors) {
          const newErrors: Record<string, string> = {};
          result.data.errors.forEach((error: ErrorDetail) => {
            newErrors[error.path] = error.msg;
          });
          setErrors(newErrors);
          return;
        }
        throw new Error(result.data?.title || 'Something went wrong');
      }
      if (splitted.length > 0) {
        const headers = new Headers();
        headers.append("Content-Type", "application/x-www-form-urlencoded");
        headers.append("Authorization", "Bearer YOUR_JWT_TOKEN");
        const urlencoded = new URLSearchParams();
        for (const interest of splitted) {
          const cleanInterest = interest.startsWith('#') ? interest.substring(1) : interest;
          urlencoded.append("interests", cleanInterest);
        }
        const requestOptions = {
          method: "POST",
          headers: headers,
          body: urlencoded,
        };
        const interestsResponse = await fetch(`${window.location.origin}/api/profiles/me/interests`, requestOptions);
        if (!interestsResponse.ok) {
          throw new Error("Failed to update interests");
        }
      }
      navigate('/profile');
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'An unexpected error occurred' });
    }
  };

  const isNameValid = name.length >= 2 && name.length <= 50;
  const isAgeValid = age >= 18 && age <= 99;
  const isGenderValid = gender !== '';
  const isSexualPreferenceValid = sexualPreference !== '';
  const isBiographyValid = biography.length >= 15 && biography.length <= 300;
  const isInterestsFilled = interests.trim().length > 0;

  const canProceedToNext = () => {
    if (step === 1) return isNameValid && isAgeValid;
    if (step === 2) return isGenderValid && isSexualPreferenceValid;
    if (step === 3) return isBiographyValid;
    if (step === 4) return isInterestsFilled;
    if (step === 5) return uploadedPictures.length > 0;
    return false;
  };

  return (
    <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
      <h3 className="mb-4">Create Profile</h3>
      <div className="card text-center p-4 shadow-lg settings-card">
        {step === 1 && (
          <div className="setting-item mb-3">
            <label htmlFor="Name" className="form-label">Introduce your name</label>
            <input type="text" id="Name" className="form-control" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
            <label htmlFor="Age" className="form-label mt-3">Enter your age</label>
            <input type="number" id="Age" className={`form-control ${errors.age ? 'is-invalid' : ''}`} placeholder="Enter your age" min="18" max="99" value={age} onChange={(e) => setAge(parseInt(e.target.value))} />
            {errors.age && <div className="invalid-feedback">{errors.age}</div>}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep} disabled={step === 1}>Back</button>
              <button className="btn btn-primary" onClick={handleNextStep} disabled={!canProceedToNext()}>Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="setting-item mb-3">
            <label htmlFor="Gender" className="form-label">Select your gender</label>
            <select id="Gender" className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <label htmlFor="Preferences" className="form-label mt-3">Show me</label>
            <select id="Preferences" className="form-control" value={sexualPreference} onChange={(e) => setSexualPreference(e.target.value)}>
              <option value="">Select...</option>
              <option value="Heterosexual">Heterosexual</option>
              <option value="Homosexual">Homosexual</option>
              <option value="Bisexual">Bisexual</option>
            </select>
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep}>Back</button>
              <button className="btn btn-primary" onClick={handleNextStep} disabled={!canProceedToNext()}>Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="setting-item mb-3">
            <label htmlFor="Biography" className="form-label">Write your biography</label>
            <textarea id="Biography" className="form-control" rows={4} placeholder="Tell us about yourself" value={biography} onChange={(e) => setBiography(e.target.value)} maxLength={300} />
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep}>Back</button>
              <button className="btn btn-primary" onClick={handleNextStep} disabled={!canProceedToNext()}>Next</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="setting-item mb-3">
            <label htmlFor="Interests" className="form-label">Select your interests (comma-separated). Example: #vegan, #geek</label>
            <input type="text" id="Interests" className={`form-control ${errors.interests ? 'is-invalid' : ''}`} placeholder="Enter up to 5 interests" value={interests} onChange={(e) => setInterests(e.target.value)} maxLength={100} />
            {errors.interests && <div className="invalid-feedback">{errors.interests}</div>}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep}>Back</button>
              <button className="btn btn-primary" onClick={handleNextStep} disabled={!canProceedToNext()}>Next</button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="setting-item mb-3">
            <label className="form-label">Upload 3-5 pictures</label>
            <input type="file" className={`form-control ${errors.pictures ? 'is-invalid' : ''}`} accept="image/*" multiple onChange={handleFileChange} disabled={isUploading || uploadedPictures.length >= 5} />
            {errors.pictures && <div className="invalid-feedback">{errors.pictures}</div>}
            {isUploading && (
              <div className="text-center mt-2">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Uploading...</span>
                </div>
              </div>
            )}
            <div className="uploaded-pictures-grid mt-3">
              {uploadedPictures.map((url, index) => (
                <div key={index} className={`picture-container ${index === 0 ? 'profile-picture' : ''}`}>
                  <img src={url} alt={`Upload ${index + 1}`} className="uploaded-thumbnail" />
                  <button className="remove-picture-btn" onClick={() => handleRemovePicture(url, index)} type="button">×</button>
                  {index === 0 && <div className="profile-picture-badge">Profile</div>}
                </div>
              ))}
            </div>
            <small className="text-muted d-block mt-2">{uploadedPictures.length}/5 pictures uploaded (min 3). First is your profile picture.</small>
            <div className="d-flex justify-content-center mt-4">
              <button className="btn btn-secondary me-3" onClick={prevStep}>Back</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={uploadedPictures.length === 0 || isUploading}>Submit</button>
            </div>
          </div>
        )}
        {errors.general && <div className="alert alert-danger mt-3">{errors.general}</div>}
      </div>
    </div>
  );
}

export default CreateProfile;
