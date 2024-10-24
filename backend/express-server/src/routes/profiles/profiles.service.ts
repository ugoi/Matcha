import { SearchPreferences } from "./profiles.interface.js";
import { profilesRepository } from "./profiles.repository.js";

export const profileService = {
  searchProfiles: async function searchProfiles(filter: SearchPreferences) {
    const users = await profilesRepository.find(filter.filter_by.usename.eq);

    return users;
  },
};
