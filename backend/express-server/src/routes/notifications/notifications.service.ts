import { profilesRepository } from "../profiles/profiles.repository.js";
import { NotificationChange } from "./notification-change.interface.js";
import { notificationChangeRepository } from "./notification-change.repository.js";
import { NotificationObject } from "./notification-object.interface.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import {
  CreateNotificationServiceInput,
  Notification,
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_STATUS,
  NotificationEntityType,
} from "./notification.interface.js";
import { notificationRepository } from "./notification.repository.js";
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
        console.log("Receiver does not exist");
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
    console.log("You have a match!");
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
      await notificationsWebsocketService.sendNotification({
        notificationObject,
        sender,
        receivers,
        message,
      });
    }
  },

  createMessage: async function createMessage(notification_id: string) {
    // Get the message for the notification entity type

    const notification = await notificationRepository.find(notification_id);

    const notification_object_id = notification.notification_object_id;

    const notificationObject = await notificationObjectRepository.findOne(
      notification_object_id
    );
    const notifications_entyty_type = notificationObject.entity_type;
    const notificationChnage = (
      await notificationChangeRepository.findByNotificationObjectId(
        notification_object_id
      )
    )[0];

    const senderId = notificationChnage.actor_id;
    const created_on = notificationChnage.created_on;

    const sender = await profilesRepository.findOne(senderId);

    const senderName = sender.first_name;

    switch (notifications_entyty_type) {
      case NOTIFICATION_ENTITY_TYPE.LIKE:
        return `${senderName} liked your post on ${created_on}`;
      case NOTIFICATION_ENTITY_TYPE.MATCH:
        return `${senderName} matched with you on ${created_on}`;
      case NOTIFICATION_ENTITY_TYPE.MESSAGE:
        return `${senderName} sent you a message on ${created_on}`;
      case NOTIFICATION_ENTITY_TYPE.PROFILE_VIEW:
        return `${senderName} viewed your profile on ${created_on}`;
      case NOTIFICATION_ENTITY_TYPE.UNLIKE:
        return `${senderName} unliked your post on ${created_on}`;
      default:
        return "Invalid notification entity type";
    }
  },
};
