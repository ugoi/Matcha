export interface Chat {
    chat_id: string;
    sender_user_id: string;
    receiver_user_id: string;
    message: string;
    sent_at: Date;
}

export interface CreateChatsInput {
    sender_user_id: string;
    receiver_user_id: string;
    message: string;
}

export type FindChatsInput = {
    sender_user_id: string;
    receiver_user_id: string;
    limit: number;
    next_cursor?: Date;
}
