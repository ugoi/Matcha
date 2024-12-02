import { find } from "lodash";
import db from "../../../config/db-config.js";
import { CreateVisit, FindUserVisits, Visit } from "./visits.interface.js";

export const visitsRepository = {
  create: async (item: CreateVisit): Promise<Visit> => {
    const { visitor_user_id, visited_user_id } = item;
    const insertedVisit = await db.one(
      `
              INSERT INTO visits (visitor_user_id, visited_user_id)
              VALUES ($1, $2)
              RETURNING *
            `,
      [visitor_user_id, visited_user_id]
    );

    return insertedVisit;
  },

  find: async (item: FindUserVisits) => {
    const { visited_user_id } = item;
    const visits = await db.any(
      `
        SELECT
            visits.*,
            (
                SELECT 
                    json_agg (i) 
                FROM 
                    (
                    SELECT 
                        profiles.*, 
                        users.username, 
                        users.first_name, 
                        users.last_name,
                        blocked.blocked_user_id IS NOT NULL as is_blocked_by_me,
                        blocker.blocker_user_id IS NOT NULL as is_blocking_me
                    FROM 
                        profiles 
                        INNER JOIN users ON profiles.user_id = users.user_id
                        LEFT JOIN blocked_users blocked ON (profiles.user_id = blocked.blocked_user_id AND blocked.blocker_user_id = $1)
                        LEFT JOIN blocked_users blocker ON (profiles.user_id = blocker.blocker_user_id AND blocker.blocked_user_id = $1)
                    WHERE 
                        profiles.user_id = visits.visitor_user_id
                    ) i
            ) as visitor_profile
            FROM visits
            WHERE visited_user_id = $1
            `,
      [visited_user_id]
    );

    return visits;
  },
};
