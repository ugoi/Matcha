      WITH profile_with_interests AS (
        SELECT 
          profiles.*, 
          users.username, 
          users.first_name, 
          users.last_name, 
          array_length(
            ARRAY(
              SELECT 
                interest_tag 
              FROM 
                user_interests AS ui 
              WHERE 
                ui.user_id = profiles.user_id 
              INTERSECT 
              SELECT 
                interest_tag 
              FROM 
                user_interests AS uime 
              WHERE 
                uime.user_id = $1
            ), 
            1
          ) AS common_interests, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  * 
                FROM 
                  user_interests 
                WHERE 
                  user_interests.user_id = profiles.user_id
              ) i
          ) as interests, 
          (
            SELECT 
              json_agg (i) 
            FROM 
              (
                SELECT 
                  * 
                FROM 
                  user_pictures 
                WHERE 
                  user_pictures.user_id = profiles.user_id
              ) i
          ) as pictures 
        FROM 
          profiles 
          INNER JOIN users ON profiles.user_id = users.user_id 
          LEFT JOIN likes
          ON (profiles.user_id = likes.likee_user_id AND likes.liker_user_id = $1)
          WHERE likes.liker_user_id IS NULL
          LEFT JOIN blocked_users
          ON (profiles.user_id = blocked_users.blocked_user_id AND blocked_users.blocker_user_id = $1)
          WHERE blocked_users.blocker_user_id IS NULL
        LIMIT 
          20
      ) 
      SELECT 
        * 
      FROM 
        profile_with_interests 
      $2:raw
      $3:raw
