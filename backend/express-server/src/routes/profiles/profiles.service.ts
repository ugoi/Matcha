import db, { pgp } from "../../config/db-config.js";
import { JError, ValidationError } from "../../error-handlers/custom-errors.js";
import { FilterSet, SortSet } from "../../utils/utils.js";
import {
  CreateProfileInput,
  FilterBy,
  Profile,
  SearchPreferences,
  SortBy,
  SortOrder,
  UpdateProfileInput,
} from "./profiles.interface.js";
import {
  profilesRepository,
  searchPreferencesRepository,
} from "./profiles.repository.js";
import { interestsRepository } from "./interests/interests.repository.js";
import { picturesRepository } from "./pictures/pictures.repository.js";
import { Picture } from "./pictures/pictures.interface.js";
import jsonSql from "json-sql";

// Initialize json-sql with PostgreSQL dialect
const builder = jsonSql({ dialect: "postgresql" });

// Helper function to convert our operators to json-sql operators
const convertOperators = (filter: any) => {
  if (!filter) return filter;

  const result = {};
  for (const [key, value] of Object.entries(filter)) {
    if (typeof value === "object") {
      // Convert $neq to $ne for json-sql compatibility
      const converted = Object.fromEntries(
        Object.entries(value).map(([op, val]) => [
          op === "$neq" ? "$ne" : op,
          val,
        ])
      );
      result[key] = converted;
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const profilesService = {
  getProfile: async function getProfile(user_id: string) {
    const data = await profilesRepository.findOne(user_id);

    if (data === null) {
      return null;
    }

    const [userInterests, userPictures, searchPreferences] = await Promise.all([
      interestsRepository.find(data.user_id),
      picturesRepository.find(data.user_id),
      searchPreferencesRepository.find(data.user_id),
    ]);

    let profile: Profile = {
      ...data,
      interests: userInterests,
      pictures: userPictures,
      search_preferences: searchPreferences,
    };

    return profile;
  },

  async createProfile(input: CreateProfileInput): Promise<Profile> {
    const { user_id, data } = input;

    // Check if profile_picture is inside user_pictures
    const userPictures = await picturesRepository.find(user_id);

    if (
      !userPictures.some(
        (picture: Picture) => picture.picture_url === data.profile_picture
      )
    ) {
      throw new JError(
        `Profile picture not found in user pictures - Please upload the pictures first with POST ${process.env.BASE_URL}/api/profiles/me/pictures`
      );
    }

    let newProfile = await profilesRepository.create(input);

    return newProfile;
  },

  async updateProfile(input: UpdateProfileInput): Promise<Profile> {
    const { gps_latitude, gps_longitude } = input.data;

    // Prepare the location SQL expression if coordinates are provided
    let locationRawSQL = undefined;
    if (gps_latitude && gps_longitude) {
      locationRawSQL = pgp.as.format("st_point($1, $2)", [
        gps_longitude,
        gps_latitude,
      ]);
      // Remove gps fields from input
      delete input.data.gps_latitude;
      delete input.data.gps_longitude;
    }

    // Remove gps fields from input and add the raw SQL expression for location
    const transformedData = {
      ...input.data,
      location: locationRawSQL,
    };

    // Filter out undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(transformedData).filter(([_, v]) => v !== undefined)
    );

    // Call repository with cleaned data
    return profilesRepository.update({
      user_id: input.user_id,
      data: cleanData,
    });
  },

  async searchProfiles(searchPreferences: SearchPreferences) {
    const { user_id, filter_by = {}, sort_by = {} } = searchPreferences;

    // Retrieve the current user's profile data for location and preference-based filtering
    const currentUser = await this.getProfile(user_id);

    // Set default filter if required
    const defaultFilter: FilterBy =
      process.env.DEFAULT_FILTER === "true"
        ? {
            gender: { $eq: currentUser.sexual_preference },
            distance: {
              $lt: 100,
            },
            fame_rating: { $gte: 0 },
            common_interests: { $gte: 2 },
            user_id: { $neq: currentUser.user_id },
          }
        : { user_id: { $neq: currentUser.user_id } };

    // Merge default and custom filters
    const mergedFilter = { ...defaultFilter, ...filter_by };

    // Convert our operators to json-sql compatible ones
    const convertedFilter = convertOperators(mergedFilter);

    // Convert sort_by to json-sql sort format
    const sortClause = Object.entries(sort_by).reduce((acc, [field, item]) => {
      acc[field] = item?.$order?.toLowerCase() === "desc" ? -1 : 1;
      return acc;
    }, {});

    // Build complete query using json-sql
    const query = builder.build({
      type: "select",
      with: {
        profile_with_interests: {
          select: {
            type: "select",
            fields: [
              "users.username",
              "users.first_name",
              "users.last_name",
              "profiles.profile_id",
              "profiles.user_id",
              "profiles.gender",
              "profiles.age",
              "profiles.sexual_preference",
              "profiles.biography",
              "profiles.fame_rating",
              "profiles.profile_picture",
              {
                expression: {
                  pattern:
                    "(profiles.location <-> (SELECT location FROM profiles WHERE user_id = {userId}))",
                  values: { userId: user_id },
                },
                alias: "distance",
              },
              "profiles.last_online",
              "profiles.created_at",
              {
                expression: {
                  pattern: `COALESCE(
                    array_length(
                      ARRAY(
                        SELECT interest_tag 
                        FROM user_interests AS ui 
                        WHERE ui.user_id = profiles.user_id 
                        INTERSECT 
                        SELECT interest_tag 
                        FROM user_interests AS uime 
                        WHERE uime.user_id = {userId}
                      ), 
                      1
                    ), 
                    0
                  )`,
                  values: { userId: user_id },
                },
                alias: "common_interests",
              },
              {
                expression: {
                  pattern: `(
                    SELECT json_agg(i)
                    FROM (
                      SELECT *
                      FROM user_interests
                      WHERE user_interests.user_id = profiles.user_id
                    ) i
                  )`,
                },
                alias: "interests",
              },
              {
                expression: {
                  pattern: `(
                    SELECT json_agg(i)
                    FROM (
                      SELECT *
                      FROM user_pictures
                      WHERE user_pictures.user_id = profiles.user_id
                    ) i
                  )`,
                },
                alias: "pictures",
              },
            ],
            table: "profiles",
            join: [
              {
                type: "inner",
                table: "users",
                on: { "profiles.user_id": "users.user_id" },
              },
              {
                type: "left",
                table: "likes",
                on: {
                  "profiles.user_id": "likes.likee_user_id",
                  "likes.liker_user_id": { $eq: { value: user_id } },
                },
              },
              {
                type: "left",
                table: "blocked_users",
                on: {
                  "profiles.user_id": "blocked_users.blocked_user_id",
                  "blocked_users.blocker_user_id": { $eq: { value: user_id } },
                },
              },
            ],
            condition: {
              "likes.liker_user_id": { $null: true },
              "blocked_users.blocker_user_id": { $null: true },
            },
            limit: 20,
          },
        },
      },
      table: "profile_with_interests",
      condition: convertedFilter,
      sort: Object.keys(sortClause).length > 0 ? sortClause : undefined,
    });

    // Replace every $anything with ${anything} because pgp.as.format does not support $anything
    const transformedQuery = query.query.replace(
      /\$(\w+)/g,
      (match, p1) => `\${${p1}}`
    );

    // Format the query using pgp
    const statement = pgp.as.format(transformedQuery, query.values);

    // Call repository with the query
    return profilesRepository.find(user_id, statement);
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
      throw new ValidationError(
        `Profile picture not found in user pictures - Please upload the pictures first with POST ${process.env.BASE_URL}/api/profiles/me/pictures/${picture_id}`
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
      throw new ValidationError(
        "Following pictures already exist: " + overlapMessage
      );
    }
  },
};
