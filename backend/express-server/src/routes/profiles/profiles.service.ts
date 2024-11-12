import db, { pgp } from "../../config/db-config.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { FilterSet, picturesNotExists, SortSet } from "../../utils/utils.js";
import { Picture } from "./pictures.interface.js";
import { picturesRepository } from "./pictures.repository.js";
import { SearchPreferences } from "./profiles.interface.js";
import { profilesRepository } from "./profiles.repository.js";

export const profilesService = {
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

  updateLastOnline: async function updateLastOnline(user_id: string) {
    let statement = pgp.as.format(
      `
      UPDATE profiles
      SET last_online = NOW()
      WHERE user_id = $1
      `,
      user_id
    );

    await db.none(statement);

    return;
  },

  pictureExists: async function pictureExists(picture_id, user_id) {
    // Check if profile_picture is inside user_pictures
    const userPictures = await picturesRepository.find(user_id);

    if (
      !userPictures.some(
        (picture: Picture) => picture.picture_url === picture_id
      )
    ) {
      throw new JFail(
        null,
        "Profile picture not found in user pictures - Please upload the pictures first with POST http://localhost:3000/api/profiles/me/pictures/" + picture_id
      );
    }
  },

  picturesNotExist: async function picturesNotExist(
    uploadPictures: Array<string>,
    user_id: string
  ) {
    const userPictures = await picturesRepository.find(user_id);

    // Get overlap between userPictures and uploadPictures
    const overlap = userPictures.filter((picture: Picture) =>
      uploadPictures.includes(picture.picture_url)
    );

    const overlapMessage = overlap
      .map((picture: Picture) => picture.picture_url)
      .join(", ");

    if (overlap.length > 0) {
      throw new JFail(
        null,
        "Following pictures already exist: " + overlapMessage
      );
    }
  },
};
