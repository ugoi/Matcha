import { Interest } from "./interest.interface.js";
import { Picture } from "./picture.interface.js";

export interface Profile {
  profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  gender: string;
  age: number;
  sexual_preference: string;
  biography: string;
  interests: Interest[];
  pictures: Picture[];
  search_preferences: SearchPreferences;
  fame_rating: number;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
  last_online: Date;
  created_at: Date;
  visit_history: string[];
  matches: string[];
  blocked_users: string[];
}

export class PublicProfile {
  profile_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  gender: string;
  age: number;
  sexual_preference: string;
  biography: string;
  interests: Interest[];
  pictures: Picture[];
  fame_rating: number;
  profile_picture: string;
  distance: number;
  last_online: Date;
  created_at: Date;

  constructor(profile: Profile) {
    this.profile_id = profile.profile_id;
    this.user_id = profile.user_id;
    this.first_name = profile.first_name;
    this.last_name = profile.last_name;
    this.username = profile.username;
    this.gender = profile.gender;
    this.age = profile.age;
    this.sexual_preference = profile.sexual_preference;
    this.biography = profile.biography;
    this.interests = profile.interests;
    this.pictures = profile.pictures;
    this.fame_rating = profile.fame_rating;
    this.profile_picture = profile.profile_picture;
    this.distance = 1;
    this.last_online = profile.last_online;
    this.created_at = profile.created_at;
  }
}

export interface SearchPreferences {
  search_id: string;
  user_id: string;
  age_min: number;
  age_max: number;
  fame_rating_min: number;
  fame_rating_max: number;
  location_radius: number;
  interests_filter: string;
}

export const mockSearchPreferences: SearchPreferences = {
  search_id: "1",
  user_id: "1",
  age_min: 18,
  age_max: 30,
  fame_rating_min: 0,
  fame_rating_max: 5,
  location_radius: 100,
  interests_filter: "music",
};

export const mockProfile: Profile = {
  profile_id: "1",
  user_id: "1",
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  gender: "male",
  age: 25,
  sexual_preference: "female",
  biography: "I am a cool guy",
  interests: [{ interest_id: "1", user_id: "1", interest_tag: "music" }, { interest_id: "2", user_id: "1", interest_tag: "sports" }],
  pictures: [{ picture_id: "1", user_id: "1", picture_url: "https://www.google.com" }, { picture_id: "2", user_id: "1", picture_url: "https://www.google.com" }],
  search_preferences: mockSearchPreferences,
  fame_rating: 0,
  profile_picture: "https://www.google.com",
  gps_latitude: 0,
  gps_longitude: 0,
  last_online: new Date(),
  created_at: new Date(),
  visit_history: [],
  matches: [],
  blocked_users: [],
};

export const mockPublicProfile = new PublicProfile(mockProfile);

export const mockProfiles: Profile[] = [mockProfile, mockProfile, mockProfile];

export const mockPublicProfiles: PublicProfile[] = [
  mockPublicProfile,
  mockPublicProfile,
  mockPublicProfile,
];
