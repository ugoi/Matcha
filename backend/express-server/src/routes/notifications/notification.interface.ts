// IV.7 Notifications
// A user must be notified in real-time6 of the following events:
// • When the user receives a “like”.
// • When the user’s profile has been viewed.
// • When the user receives a message.
// • When “liked” user also “likes” the user back.
// • When a connected user “unlikes” the user.

export interface Notification {
  id: string;
  notification_object_id: string;
  notifier_id: string;
  status: number;
  created_at: string;
}

export interface CreateNotificationInput {
  notification_object_id: string;
  notifier_id: string;
  status: number;
}

export interface CreateNotificationServiceInput {
  entity_type: number;
  entity_id: string;
  status: number;
  receivers: string[];
  sender: string;
}

export interface UpdateNotificationInput {
  id: string;
  status: number;
}

export interface UpdateByNotifierIdInput {
  notifier_id: string;
  status: number;
  notification_object_ids: string[];
}

export interface UpdateAllByNotifierIdInput {
  notifier_id: string;
  status: number;
}

// Status codes for notifications
export enum NOTIFICATION_STATUS {
  SENT = 0,
  RECEIVED = 1,
  READ = 2,
}

export const NOTIFICATION_STATUS_STRING = {
  [NOTIFICATION_STATUS.SENT]: "sent",
  [NOTIFICATION_STATUS.RECEIVED]: "received",
  [NOTIFICATION_STATUS.READ]: "read",
} as const;

export enum NOTIFICATION_ENTITY_TYPE {
  LIKE = 0,
  PROFILE_VIEW = 1,
  MESSAGE = 2,
  MATCH = 3,
  UNLIKE = 4,
}

// Map enum values to strings
export const NOTIFICATION_ENTITY_TYPE_STRING = {
  [NOTIFICATION_ENTITY_TYPE.LIKE]: "like",
  [NOTIFICATION_ENTITY_TYPE.PROFILE_VIEW]: "profile_view",
  [NOTIFICATION_ENTITY_TYPE.MESSAGE]: "message",
  [NOTIFICATION_ENTITY_TYPE.MATCH]: "match",
  [NOTIFICATION_ENTITY_TYPE.UNLIKE]: "unlike",
} as const;

// Infer a type from NOTIFICATION_STATUS
export type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

// Infer a type from NOTIFICATION_ENTITY_TYPE
export type NotificationEntityType =
  (typeof NOTIFICATION_ENTITY_TYPE)[keyof typeof NOTIFICATION_ENTITY_TYPE];
