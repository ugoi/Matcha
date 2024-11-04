// src/routes/CreateProfile/CreateProfile.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateProfile.css';

interface CreateProfileInput {
  gender: string;
  age: string;
  sexual_preference: string;
  biography: string;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
}

function CreateProfile() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState(18);
  const [gender, setGender] = useState('');
  const [sexualPreference, setSexualPreference] = useState('');
  const [biography, setBiography] = useState('');
  const [interests, setInterests] = useState('');
  const [pictures, setPictures] = useState<File[]>([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPictures(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    const profilePicture = pictures.length > 0 ? pictures[0].name : '';

    const profileData: CreateProfileInput = {
      gender,
      age: age.toString(),
      sexual_preference: sexualPreference,
      biography,
      profile_picture: profilePicture,
      gps_latitude: 0,
      gps_longitude: 0,
    };

    try {
      const response = await fetch(`${window.location.origin}/api/profiles/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.status === 'fail' && result.data?.errors) {
          const newErrors: {[key: string]: string} = {};
          result.data.errors.forEach((error: any) => {
            newErrors[error.path] = error.msg;
          });
          setErrors(newErrors);
          return;
        }
        throw new Error(result.data?.title || 'Something went wrong');
      }

      await fetch(`${window.location.origin}/api/profiles/me/interests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interests: interests.split(',').map(tag => tag.trim()) }),
      });

      const formData = new FormData();
      pictures.forEach((picture) => formData.append('pictures', picture));
      await fetch(`${window.location.origin}/api/profiles/me/pictures`, {
        method: 'POST',
        body: formData,
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error creating profile:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };

  const isNameValid = name.length >= 2 && name.length <= 50;
  const isAgeValid = age >= 18 && age <= 99;
  const isGenderValid = gender !== '';
  const isSexualPreferenceValid = sexualPreference !== '';
  const isBiographyValid = biography.length >= 15 && biography.length <= 300;
  const isInterestsValid = interests.length > 0 && interests.length <= 100;
  const isPicturesValid = pictures.length > 0 && pictures.length <= 5;

  const canProceedToNext = () => {
    if (step === 1) {
      return isNameValid && isAgeValid;
    } else if (step === 2) {
      return isGenderValid && isSexualPreferenceValid;
    } else if (step === 3) {
      return isBiographyValid;
    } else if (step === 4) {
      return isInterestsValid;
    } else if (step === 5) {
      return isPicturesValid;
    }
    return false;
  };

  return (
    <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
      <h3 className="mb-4">Create Profile</h3>
      <div className="card text-center p-4 shadow-lg settings-card">
        {step === 1 && (
          <div className="setting-item mb-3">
            <label htmlFor="Name" className="form-label">Introduce your name</label>
            <input
              type="text"
              id="Name"
              className="form-control"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <label htmlFor="Age" className="form-label mt-3">Enter your age</label>
            <input
              type="number"
              id="Age"
              className={`form-control ${errors.age ? 'is-invalid' : ''}`}
              placeholder="Enter your age"
              min="18"
              max="99"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value))}
            />
            {errors.age && (
              <div className="invalid-feedback">
                {errors.age}
              </div>
            )}
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep} disabled={step === 1}>
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep} disabled={!canProceedToNext()}>
                Next
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="setting-item mb-3">
            <label htmlFor="Gender" className="form-label">Select your gender</label>
            <select
              id="Gender"
              className="form-control"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <label htmlFor="Preferences" className="form-label mt-3">Show me!</label>
            <select
              id="Preferences"
              className="form-control"
              value={sexualPreference}
              onChange={(e) => setSexualPreference(e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Heterosexual">Man</option>
              <option value="Homosexual">Women</option>
              <option value="Other">Both</option>
            </select>
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep} disabled={!canProceedToNext()}>
                Next
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="setting-item mb-3">
            <label htmlFor="Biography" className="form-label">Write your biography</label>
            <textarea
              id="Biography"
              className="form-control"
              rows={4}
              placeholder="Tell us about yourself"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              maxLength={300}
            ></textarea>
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep} disabled={!canProceedToNext()}>
                Next
              </button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="setting-item mb-3">
            <label htmlFor="Interests" className="form-label">Select your interests (e.g. #vegan, #geek)</label>
            <input
              type="text"
              id="Interests"
              className="form-control"
              placeholder="Enter interests separated by commas"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              maxLength={100}
            />
            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep} disabled={!canProceedToNext()}>
                Next
              </button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="setting-item mb-3">
            <label className="form-label">Upload up to 5 pictures</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <small className="text-muted">Ensure one of these is a profile picture.</small>
            <div className="d-flex justify-content-center mt-4">
              <button className="btn btn-secondary me-3" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={!canProceedToNext()}>
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateProfile;
