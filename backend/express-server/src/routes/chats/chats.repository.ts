import db, { pgp } from "../../config/db-config.js";
import { Chat, CreateChatsInput, FindChatsInput } from "./chats.interface.js";

export const chatRepository = {
  create: async function create(input: CreateChatsInput): Promise<Chat> {
    const chat = await db.one(
      `
        INSERT INTO chats ( sender_user_id, receiver_user_id, message )
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      [input.sender_user_id, input.receiver_user_id, input.message]
    );

    return chat;
  },

  find: async function find(input: FindChatsInput): Promise<Chat[]> {
    let next_cursor = "AND sent_at < $4";
    if (!input.next_cursor) {
      next_cursor = "";
    }

    const preparedStatment = pgp.as.format(
      `
        SELECT * FROM chats
        WHERE ((sender_user_id = $1 AND receiver_user_id = $2)
        OR (sender_user_id = $2 AND receiver_user_id = $1))
        ${next_cursor}
        ORDER BY sent_at DESC
        LIMIT $3
        `,
      [
        input.sender_user_id,
        input.receiver_user_id,
        input.limit,
        input.next_cursor,
      ]
    );

    const chats = await db.manyOrNone(preparedStatment);

    return chats;
  },
};
