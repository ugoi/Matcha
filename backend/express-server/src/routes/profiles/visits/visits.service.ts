import { visitsRepository } from "./visits.repository.js";
import db from "../../../config/db-config.js";

export const visitsService = {
  findBoth: async (user_id) => {
    // Inbound visits: users that visited the user
    const inbound = await visitsRepository.find({ visited_user_id: user_id });

    // Outbound visits: users that the user visited, with visited user profile information
    const outbound = await db.any(
      `
      SELECT
        visits.*,
        (
          SELECT json_agg(i)
          FROM (
            SELECT 
              profiles.*, 
              users.username, 
              users.first_name, 
              users.last_name,
              blocked.blocked_user_id IS NOT NULL as is_blocked_by_me,
              blocker.blocker_user_id IS NOT NULL as is_blocking_me
            FROM profiles
            INNER JOIN users ON profiles.user_id = users.user_id
            LEFT JOIN blocked_users blocked ON (profiles.user_id = blocked.blocked_user_id AND blocked.blocker_user_id = $1)
            LEFT JOIN blocked_users blocker ON (profiles.user_id = blocker.blocker_user_id AND blocker.blocked_user_id = $1)
            WHERE profiles.user_id = visits.visited_user_id
          ) i
        ) as visited_profile
      FROM visits
      WHERE visitor_user_id = $1
      `,
      [user_id]
    );

    return { inbound, outbound };
  },
};
