import { pgp } from "../../config/db-config.js";
import { FilterSet, SortSet } from "../../utils/utils.js";
import { SearchPreferences } from "./profiles.interface.js";
import { profilesRepository } from "./profiles.repository.js";

export const profileService = {
  searchProfiles: async function searchProfiles(filter: SearchPreferences) {
    if (filter.filter_by && Object.keys(filter.filter_by).length > 0) {
      var filterSet = new FilterSet(filter.filter_by);
      var where = pgp.as.format("WHERE $1", filterSet);
    }

    if (filter.sort_by && Object.keys(filter.sort_by).length > 0) {
      var sortSet = new SortSet(filter.sort_by);
      var order = pgp.as.format("ORDER BY $1", sortSet);
    }

    const users = await profilesRepository.find(filter.user_id, where, order);

    return users;
  },
};
