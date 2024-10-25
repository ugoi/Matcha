import { pgp } from "../../config/db-config.js";
import { FilterSet } from "../../utils/utils.js";
import { SearchPreferences } from "./profiles.interface.js";
import { profilesRepository } from "./profiles.repository.js";
import builder from "mongo-sql";

export const profileService = {
  searchProfiles: async function searchProfiles(filter: SearchPreferences) {
    // var sql = jsonSql.build({
    //   table: "table",
    //   condition: filter.filter_by
    // });

    var filterSet = new FilterSet({
      username: { $neq: "stefan12" },
      age: { $gte: 18 },
    });

    var where = pgp.as.format("WHERE $1", filterSet);

    console.log(where);

    const users = await profilesRepository.find(where);

    return users;
  },
};
