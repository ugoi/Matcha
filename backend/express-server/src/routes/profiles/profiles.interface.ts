import { Interest } from "./interests/interests.interface.js";
import { Picture } from "./pictures/pictures.interface.js";

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
  common_interests: Interest[];
  pictures: Picture[];
  search_preferences: SearchPreferences;
  fame_rating: number;
  profile_picture: string;
  gps_latitude: number;
  gps_longitude: number;
  distance: number;
  last_online: Date;
  created_at: Date;
  visit_history: string[];
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
  common_interests: Interest[];
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
    this.common_interests = profile.common_interests;
    this.pictures = profile.pictures;
    this.fame_rating = profile.fame_rating;
    this.profile_picture = profile.profile_picture;
    this.distance = profile.distance;
    this.last_online = profile.last_online;
    this.created_at = profile.created_at;
  }
}

export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

export class SortItem {
  value?: SortValue;
  $order: SortOrder;

  constructor(sortItem: SortItem) {
    this.value = sortItem.value;
    this.$order = sortItem.$order;
  }
}

export interface SortValue {
  longitude: number;
  latitude: number;
}

export class SortBy {
  user_id?: SortItem;
  age?: SortItem;
  distance?: SortItem;
  fame_rating?: SortItem;
  common_tags?: SortItem;
  tags?: SortItem;

  constructor(sortBy: SortBy) {
    this.user_id = sortBy.user_id;
    this.age = sortBy.age;
    this.distance = sortBy.distance;
    this.fame_rating = sortBy.fame_rating;
    this.common_tags = sortBy.common_tags;
    this.tags = sortBy.tags;
  }
}

export interface FilterValue {
  longitude: number;
  latitude: number;
}

export interface FilterItem {
  $eq?: string;
  $neq?: string;
  $lt?: number;
  $lte?: number;
  $gt?: number;
  $gte?: number;
  $in?: string[];
  $not_in?: string[];
  value?: FilterValue;
}

export class FilterBy {
  user_id?: FilterItem;
  age?: FilterItem;
  distance?: FilterItem;
  fame_rating?: FilterItem;
  common_interests?: FilterItem;
  username?: FilterItem;
  email?: FilterItem;
  gender?: FilterItem;
  // common tags is number of tags in common
  tags?: FilterItem;

  constructor(filterBy: FilterBy) {
    this.user_id = filterBy.user_id;
    this.username = filterBy.username;
    this.email = filterBy.email;
    this.age = filterBy.age;
    this.distance = filterBy.distance;
    this.fame_rating = filterBy.fame_rating;
    this.common_interests = filterBy.common_interests;
    this.tags = filterBy.tags;
  }
}

export interface SearchPreferences {
  user_id: string;
  sort_by?: SortBy;
  filter_by?: FilterBy;
}

export const mockSearchPreferences: SearchPreferences = {
  user_id: "1",
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
  interests: [
    { interest_id: "1", user_id: "1", interest_tag: "music" },
    { interest_id: "2", user_id: "1", interest_tag: "sports" },
  ],
  common_interests: [
    { interest_id: "1", user_id: "1", interest_tag: "music" },
    { interest_id: "2", user_id: "1", interest_tag: "sports" },
  ],
  pictures: [
    { picture_id: "1", user_id: "1", picture_url: "https://www.google.com" },
    { picture_id: "2", user_id: "1", picture_url: "https://www.google.com" },
  ],
  search_preferences: mockSearchPreferences,
  fame_rating: 0,
  profile_picture: "https://www.google.com",
  gps_latitude: 0,
  gps_longitude: 0,
  distance: 0,
  last_online: new Date(),
  created_at: new Date(),
  visit_history: [],
  blocked_users: [],
};

export interface FindOneInput {
  user_id?: string;
  username?: string;
  email?: string;
}

export interface UpdateProfileInput {
  user_id: string;
  data: {
    gender?: string;
    age?: number;
    sexual_preference?: string;
    biography?: string;
    profile_picture?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    fame_rating?: number;
  };
}

export interface CreateProfileInput {
  user_id: string;
  data: {
    gender: string;
    age: number;
    sexual_preference: string;
    biography: string;
    profile_picture: string;
    gps_latitude: number;
    gps_longitude: number;
  };
}

export const mockPublicProfile = new PublicProfile(mockProfile);

export const mockProfiles: Profile[] = [mockProfile, mockProfile, mockProfile];

export const mockPublicProfiles: PublicProfile[] = [
  mockPublicProfile,
  mockPublicProfile,
  mockPublicProfile,
];
