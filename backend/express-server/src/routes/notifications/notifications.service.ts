import { profilesRepository } from "../profiles/profiles.repository.js";
import { NotificationChange } from "./notification-change.interface.js";
import { notificationChangeRepository } from "./notification-change.repository.js";
import { NotificationObject } from "./notification-object.interface.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import {
  CreateNotificationServiceInput,
  Notification,
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_ENTITY_TYPE_STRING,
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_STRING,
  NotificationEntityType,
} from "./notification.interface.js";
import { notificationRepository } from "./notification.repository.js";
import { NotificationResponse } from "./notification.response.interface.js";
import { notificationsWebsocketService } from "./notifications.websocket.service.js";

export const notificationService = {
  create: async function create(
    input: CreateNotificationServiceInput
  ): Promise<{
    notificationObject: NotificationObject;
    notifications: Notification[];
    notificationsChange: NotificationChange;
  }> {
    const { entity_type, entity_id, status, receivers, sender } = input;
    // Create a notification object
    const notificationObject = await notificationObjectRepository.create({
      entity_type,
      entity_id,
      status,
    });

    let notifications = [];

    for (
      let receiver_index = 0;
      receiver_index < receivers.length;
      receiver_index++
    ) {
      const receiver = receivers[receiver_index];
      // Check if receiver exists in database
      const profile = await profilesRepository.findOne(receiver);
      if (!profile) {
        continue;
      }
      // Add the notifications to the database
      const notification = await notificationRepository.create({
        notification_object_id: notificationObject.id,
        notifier_id: receiver,
        status: NOTIFICATION_STATUS.SENT,
      });
      notifications.push(notification);
    }

    // Add sender to the notification change table
    const notificationsChange = await notificationChangeRepository.create({
      notification_object_id: notificationObject.id,
      actor_id: sender,
    });

    return { notificationObject, notifications, notificationsChange };
  },

  createAndSend: async function createAndSend(
    input: CreateNotificationServiceInput
  ) {
    const { entity_type, entity_id, status, receivers, sender } = input;
    // Print debug message
    const result = await notificationService.create({
      entity_type: entity_type,
      entity_id: entity_id,
      status: status,
      receivers: receivers,
      sender: sender,
    });

    const notifications = result.notifications;

    const notificationObject = result.notificationObject;

    for (let index = 0; index < notifications.length; index++) {
      const element = notifications[index];
      const message = await notificationService.createMessage(element.id);
      const senderAccount = await profilesRepository.findOne(sender);
      const notificationResponse: NotificationResponse = {
        id: element.id,
        type: NOTIFICATION_ENTITY_TYPE_STRING[notificationObject.entity_type],
        created_at: element.created_at,
        status: NOTIFICATION_STATUS_STRING[element.status],
        sender: {
          id: senderAccount.user_id,
          name: senderAccount.first_name,
          username: senderAccount.username,
          avatar_url: senderAccount.profile_picture,
        },
        entity: {
          id: notificationObject.entity_id,
        },
        message: message,
      };

      await notificationsWebsocketService.sendNotification({
        notificationResponse,
        receivers,
      });
    }
  },

  createMessage: async function createMessage(notification_id: string) {
    // Get the notification and its object
    const notification = await notificationRepository.find(notification_id);
    const notification_object_id = notification.notification_object_id;
    const notificationObject = await notificationObjectRepository.findOne(
      notification_object_id
    );

    // Get the notification change record (if any)
    const notificationChanges =
      await notificationChangeRepository.findByNotificationObjectId(
        notification_object_id
      );
    if (!notificationChanges || notificationChanges.length === 0) {
      // Handle missing change record gracefully (e.g. log it or return a fallback message)
      console.error(
        `No notification change record found for notification object: ${notification_object_id}`
      );
      return "Notification details are unavailable";
    }
    const notificationChange = notificationChanges[0];

    // Safely use the notificationChange record
    const senderId = notificationChange.actor_id;
    const created_at = notificationChange.created_at;
    const sender = await profilesRepository.findOne(senderId);

    switch (notificationObject.entity_type) {
      case NOTIFICATION_ENTITY_TYPE.LIKE:
        return `${sender.first_name} liked your post on ${created_at}`;
      case NOTIFICATION_ENTITY_TYPE.MATCH:
        return `${sender.first_name} matched with you on ${created_at}`;
      case NOTIFICATION_ENTITY_TYPE.MESSAGE:
        return `${sender.first_name} sent you a message on ${created_at}`;
      case NOTIFICATION_ENTITY_TYPE.PROFILE_VIEW:
        return `${sender.first_name} viewed your profile on ${created_at}`;
      case NOTIFICATION_ENTITY_TYPE.UNLIKE:
        return `${sender.first_name} unliked your post on ${created_at}`;
      default:
        return "Invalid notification entity type";
    }
  },

  // Added new function to enrich a raw notification into a full NotificationResponse
  enrichNotification: async function enrichNotification(
    notification: Notification
  ): Promise<NotificationResponse> {
    const notificationObject = await notificationObjectRepository.findOne(
      notification.notification_object_id
    );
    const notificationChanges =
      await notificationChangeRepository.findByNotificationObjectId(
        notificationObject.id
      );
    const DELETED_USER_PLACEHOLDER = {
      user_id: "deleted",
      first_name: "Deleted",
      username: "deleted",
      profile_picture: "",
    };
    let senderAccount = DELETED_USER_PLACEHOLDER;
    if (notificationChanges && notificationChanges.length > 0) {
      const senderId = notificationChanges[0].actor_id;
      senderAccount =
        (await profilesRepository.findOne(senderId)) ||
        DELETED_USER_PLACEHOLDER;
    }
    const message = await notificationService.createMessage(notification.id);
    return {
      id: notification.id,
      type: NOTIFICATION_ENTITY_TYPE_STRING[notificationObject.entity_type],
      created_at: notification.created_at,
      status: NOTIFICATION_STATUS_STRING[notification.status],
      sender: {
        id: senderAccount.user_id,
        name: senderAccount.first_name,
        username: senderAccount.username,
        avatar_url: senderAccount.profile_picture,
      },
      entity: {
        id: notificationObject.entity_id,
      },
      message: message,
    };
  },
};
