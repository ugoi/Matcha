export interface Notification {
  id: string;
  notification_object_id: string;
  notifier_id: string;
  status: number;
  created_on: string;
}

export interface CreateNotificationInput {
  notification_object_id: string;
  notifier_id: string;
  status: number;
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
export const NOTIFICATION_STATUS = {
  SENT: 0,
  RECEIVED: 1,
  READ: 2,
} as const;

// Infer a type from NOTIFICATION_STATUS
export type NotificationStatus = typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];
