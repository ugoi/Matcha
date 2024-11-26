// -- Notification
// CREATE TABLE IF NOT EXISTS notification (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,            -- e.g., '123e4567-e89b-12d3-a456-426614174001'
//   notification_object_id UUID REFERENCES notification_object (id), -- e.g., '123e4567-e89b-12d3-a456-426614174000'
//   notifier_id UUID REFERENCES "user" (id),                  -- e.g., '123e4567-e89b-12d3-a456-426614174002'
//   status SMALLINT NOT NULL,                                 -- e.g., 0
//   created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL   -- e.g., '2024-11-25 15:30:00'
// );

import db, { pgp } from "../../config/db-config.js";
import {
  CreateNotificationInput,
  Notification,
  NOTIFICATION_STATUS,
  NotificationStatus,
  UpdateAllByNotifierIdInput,
  UpdateByNotifierIdInput,
  UpdateNotificationInput,
} from "./notification.interface.js";
import { update } from "lodash";

export const notificationRepository = {
  create: async function create(input: CreateNotificationInput) {
    const { notification_object_id, notifier_id } = input;

    const createNotification = pgp.as.format(
      `
            INSERT INTO notification (notification_object_id, notifier_id)
            VALUES ($1, $2)
            RETURNING *;
        `,
      [notification_object_id, notifier_id]
    );

    const result = await db.one(createNotification);
    return result;
  },

  update: async function update(input: UpdateNotificationInput) {
    const { id, status } = input;

    const updateNotification = pgp.as.format(
      `
            UPDATE notification
            SET status = $2
            WHERE id = $1
            RETURNING *;
        `,
      [id, status]
    );

    const result = await db.one(updateNotification);
    return result;
  },

  updateByNotifierId: async function updateByNotifierId(
    input: UpdateByNotifierIdInput
  ) {
    const { notifier_id, status, notification_object_ids } = input;

    const updateNotificationByNotifierId = pgp.as.format(
      `
            UPDATE notification
            SET status = $2
            WHERE notifier_id = $1
            AND notification_object_id = ANY($3)
            RETURNING *;
        `,
      [notifier_id, status, notification_object_ids]
    );

    const result = await db.many(updateNotificationByNotifierId);
    return result;
  },

  updateAllByNotifierId: async function updateAllByNotifierId(
    input: UpdateAllByNotifierIdInput
  ) {
    const { notifier_id, status } = input;

    const updateAllNotificationByNotifierId = pgp.as.format(
      `
            UPDATE notification
            SET status = $2
            WHERE notifier_id = $1
            RETURNING *;
        `,
      [notifier_id, status]
    );

    const result = await db.many(updateAllNotificationByNotifierId);
    return result;
  },

  find: async function find(id: string) {
    const findNotification = pgp.as.format(
      `
            SELECT *
            FROM notification
            WHERE id = $1;
        `,
      [id]
    );

    const result = await db.one(findNotification);
    return result;
  },

  findByNotifierId: async function findByNotifierId(
    notifier_id: string,
    status: NotificationStatus = NOTIFICATION_STATUS.SENT
  ): Promise<Notification[]> {
    const findNotificationByNotifierId = pgp.as.format(
      `
            SELECT *
            FROM notification
            WHERE notifier_id = $1
            AND status = $2;
        `,
      [notifier_id, status]
    );

    const result = await db.many(findNotificationByNotifierId);
    return result;
  },

  findAll: async function findAll() {
    const findAllNotification = pgp.as.format(
      `
            SELECT *
            FROM notification;
        `
    );

    const result = await db.many(findAllNotification);
    return result;
  },

  delete: async function remove(id: string) {
    const deleteNotification = pgp.as.format(
      `
            DELETE FROM notification
            WHERE id = $1
            RETURNING *;
        `,
      [id]
    );

    const result = await db.one(deleteNotification);
    return result;
  },

  deleteByNotifierId: async function deleteByNotifierId(notifier_id: string) {
    const deleteNotificationByNotifierId = pgp.as.format(
      `
            DELETE FROM notification
            WHERE notifier_id = $1
            RETURNING *;
        `,
      [notifier_id]
    );

    const result = await db.many(deleteNotificationByNotifierId);
    return result;
  },

  deleteByNotificationObjectId: async function deleteByNotificationObjectId(
    notification_object_id: string
  ) {
    const deleteNotificationByNotificationObjectId = pgp.as.format(
      `
            DELETE FROM notification
            WHERE notification_object_id = $1
            RETURNING *;
        `,
      [notification_object_id]
    );

    const result = await db.many(deleteNotificationByNotificationObjectId);
    return result;
  },

  deleteAll: async function removeAll() {
    const deleteAllNotification = pgp.as.format(
      `
            DELETE FROM notification
            RETURNING *;
        `
    );

    const result = await db.many(deleteAllNotification);
    return result;
  },
};
