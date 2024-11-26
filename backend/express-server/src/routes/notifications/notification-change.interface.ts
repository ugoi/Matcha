export interface NotificationChange {
    id: string;
    notification_object_id: string;
    actor_id: string;
    created_on: string;
  }
  
  export interface CreateNotificationChangeInput {
    notification_object_id: string;
    actor_id: string;
  }
