// -- Notification Object
// CREATE TABLE IF NOT EXISTS notification_object (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- e.g., '123e4567-e89b-12d3-a456-426614174000'
//   entity_type INT NOT NULL,                     -- e.g., 1
//   entity_id INT NOT NULL,                       -- e.g., 42
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- e.g., '2024-11-25 15:30:00'
//   status SMALLINT NOT NULL                      -- e.g., 1
// );

import db, { pgp } from "../../config/db-config.js";
import {
  CreateNotificationObjectInput,
  NotificationObject,
} from "./notification-object.interface.js";

export const notificationObjectRepository = {
  create: async function create(
    input: CreateNotificationObjectInput
  ): Promise<NotificationObject> {
    const { entity_type, entity_id, status } = input;

    const createNotificationObject = pgp.as.format(
      `
            INSERT INTO notification_object (entity_type, entity_id, status)
            VALUES ($1, $2, $3)
            RETURNING *;
        `,
      [entity_type, entity_id, status]
    );

    const result = await db.one(createNotificationObject);
    return result;
  },

  update: async function update(
    id: string,
    status: number
  ): Promise<NotificationObject> {
    const updateNotificationObject = pgp.as.format(
      `
            UPDATE notification_object
            SET status = $2
            WHERE id = $1
            RETURNING *;
        `,
      [id, status]
    );

    const result = await db.one(updateNotificationObject);
    return result;
  },

  findOne: async function findOne(id: string): Promise<NotificationObject> {
    const findNotificationObject = pgp.as.format(
      `
            SELECT *
            FROM notification_object
            WHERE id = $1;
        `,
      [id]
    );

    const result = await db.one(findNotificationObject);
    return result;
  },

  findAll: async function findAll(): Promise<NotificationObject[]> {
    const findAllNotificationObject = pgp.as.format(
      `
            SELECT *
            FROM notification_object;
        `
    );

    const result = await db.many(findAllNotificationObject);
    return result;
  },

  delete: async function remove(id: string): Promise<NotificationObject> {
    const deleteNotificationObject = pgp.as.format(
      `
            DELETE FROM notification_object
            WHERE id = $1
            RETURNING *;
        `,
      [id]
    );

    const result = await db.one(deleteNotificationObject);
    return result;
  },

  deleteAll: async function removeAll(): Promise<NotificationObject[]> {
    const deleteAllNotificationObject = pgp.as.format(
      `
            DELETE FROM notification_object
            RETURNING *;
        `
    );

    const result = await db.many(deleteAllNotificationObject);
    return result;
  },

  findByEntityType: async function findByEntityType(
    entity_type: number
  ): Promise<NotificationObject[]> {
    const findByEntityType = pgp.as.format(
      `
            SELECT *
            FROM notification_object
            WHERE entity_type = $1;
        `,
      [entity_type]
    );

    const result = await db.many(findByEntityType);
    return result;
  },
};
