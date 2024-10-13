export interface Profile {
  profile_id: string;
  user_id: string;
  display_name: string;
  user_name: string;
  gender: string;
  age: number;
  sexual_preference: string;
  biography: string;
  interests: string[];
  pictures: string[];
  fame_rating: number;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
  last_online: Date;
  created_at: Date;
}

export const mockProfile: Profile = {
  profile_id: "1",
  user_id: "1",
  display_name: "John Doe",
  user_name: "johndoe",
  gender: "male",
  age: 25,
  sexual_preference: "female",
  biography: "I am a cool guy",
  interests: ["music", "movies"],
  pictures: ["https://www.google.com", "https://www.google.com"],
  fame_rating: 0,
  profile_picture: "https://www.google.com",
  gps_latitude: 0,
  gps_longitude: 0,
  last_online: new Date(),
  created_at: new Date(),
};

export const mockProfiles: Profile[] = [mockProfile, mockProfile, mockProfile];
