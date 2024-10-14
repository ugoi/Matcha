export interface Notification {
  notification_id: string;
  notification_type: string;
  notification_text: string;
  from_profile_id: string;
  is_read: boolean;
  created_at: string;
}

export const mockNotification: Notification = {
  notification_id: "1",
  notification_type: "type",
  notification_text: "text",
  from_profile_id: "1",
  is_read: false,
  created_at: "2021-01-01T00:00:00.000Z",
};

export const mockNotifications: Notification[] = [
  mockNotification,
  mockNotification,
];
