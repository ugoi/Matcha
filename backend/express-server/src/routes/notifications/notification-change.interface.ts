export interface NotificationChange {
  id: string;
  notification_object_id: string;
  actor_id: string;
  created_at: string;
}

export interface CreateNotificationChangeInput {
  notification_object_id: string;
  actor_id: string;
}
