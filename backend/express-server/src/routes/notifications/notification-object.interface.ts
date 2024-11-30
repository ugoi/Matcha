import { NotificationEntityType, NotificationStatus } from "./notification.interface.js";

export interface NotificationObject {
  id: string;
  entity_type: NotificationEntityType;
  entity_id: number;
  created_on: string;
  status: NotificationStatus;
}

export interface CreateNotificationObjectInput {
  entity_type: number;
  entity_id: string;
  status: number;
}



// -- Notification Object
// CREATE TABLE IF NOT EXISTS notification_object (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- e.g., '123e4567-e89b-12d3-a456-426614174000'
//   entity_type INT NOT NULL,                     -- e.g., 1
//   entity_id INT NOT NULL,                       -- e.g., 42
//   created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, -- e.g., '2024-11-25 15:30:00'
//   status SMALLINT NOT NULL                      -- e.g., 1
// );

// -- Notification
// CREATE TABLE IF NOT EXISTS notification (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,            -- e.g., '123e4567-e89b-12d3-a456-426614174001'
//   notification_object_id UUID REFERENCES notification_object (id), -- e.g., '123e4567-e89b-12d3-a456-426614174000'
//   notifier_id UUID REFERENCES "user" (id),                  -- e.g., '123e4567-e89b-12d3-a456-426614174002'
//   status SMALLINT NOT NULL,                                 -- e.g., 0
//   created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL   -- e.g., '2024-11-25 15:30:00'
// );

// -- Notification Change
// CREATE TABLE IF NOT EXISTS notification_change (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,            -- e.g., '123e4567-e89b-12d3-a456-426614174003'
//   notification_object_id UUID REFERENCES notification_object (id), -- e.g., '123e4567-e89b-12d3-a456-426614174000'
//   actor_id UUID REFERENCES "user" (id),                    -- e.g., '123e4567-e89b-12d3-a456-426614174004'
//   created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL   -- e.g., '2024-11-25 15:30:00'
// );
