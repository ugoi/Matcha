import { profilesRepository } from "../profiles/profiles.repository.js";
import { notificationChangeRepository } from "./notification-change.repository.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import { NOTIFICATION_STATUS } from "./notification.interface.js";
import { notificationRepository } from "./notification.repository.js";

export const notificationService = {
  create: async function create({
    entity_type,
    entity_id,
    status,
    receivers,
    sender,
  }) {
    // Create a notification object
    const notificationObject = await notificationObjectRepository.create({
      entity_type,
      entity_id,
      status,
    });

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
      await notificationRepository.create({
        notification_object_id: notificationObject.id,
        notifier_id: receiver,
        status: NOTIFICATION_STATUS.SENT,
      });
    }

    // Add sender to the notification change table
    await notificationChangeRepository.create({
      notification_object_id: notificationObject.id,
      actor_id: sender,
    });

    return notificationObject;
  },
};
