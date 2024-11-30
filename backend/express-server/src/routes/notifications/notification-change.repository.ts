// -- Notification Change
// CREATE TABLE IF NOT EXISTS notification_change (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,            -- e.g., '123e4567-e89b-12d3-a456-426614174003'
//   notification_object_id UUID REFERENCES notification_object (id), -- e.g., '123e4567-e89b-12d3-a456-426614174000'
//   actor_id UUID REFERENCES "user" (id),                    -- e.g., '123e4567-e89b-12d3-a456-426614174004'
//   created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL   -- e.g., '2024-11-25 15:30:00'
// );

import db, { pgp } from "../../config/db-config.js";
import {
  CreateNotificationChangeInput,
  NotificationChange,
} from "./notification-change.interface.js";
import { find } from "lodash";

export const notificationChangeRepository = {
  create: async function create(
    input: CreateNotificationChangeInput
  ): Promise<NotificationChange> {
    const { notification_object_id, actor_id } = input;

    const createNotificationChange = pgp.as.format(
      `
            INSERT INTO notification_change (notification_object_id, actor_id)
            VALUES ($1, $2)
            RETURNING *;
        `,
      [notification_object_id, actor_id]
    );

    const result = await db.one(createNotificationChange);
    return result;
  },

  findOne: async function findOne(id: string): Promise<NotificationChange> {
    const findNotificationChange = pgp.as.format(
      `
            SELECT *
            FROM notification_change
            WHERE id = $1;
        `,
      [id]
    );

    const result = await db.one(findNotificationChange);
    return result;
  },

  findByNotificationObjectId: async function findByNotificationObjectId(
    notification_object_id: string
  ): Promise<NotificationChange[]> {
    const findByNotificationObjectId = pgp.as.format(
      `
            SELECT *
            FROM notification_change
            WHERE notification_object_id = $1;
        `,
      [notification_object_id]
    );

    const result: NotificationChange[] = await db.manyOrNone(findByNotificationObjectId);
    return result;
  },
};
