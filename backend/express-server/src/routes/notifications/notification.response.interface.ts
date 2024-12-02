// {
//     "id": "6b6fc2a7-7ca4-4859-ba0b-ccb60b176f90",
//     "type": "like",
//     "created_at": "2024-11-30T18:46:33.354Z",
//     "status": "unread",
//     "sender": {
//         "id": "4394a413-890b-4e42-a70f-ad3ef0f038a1",
//         "name": "TestFirstName",
//         "username": "testuser",
//         "avatar_url": "https://example.com/avatar.jpg"
//     },
//     "entity": {
//         "id": "post_id_123",
//         "type": "post"
//     },
//     "message_template": "{sender_name} liked your {entity_type}",
//     "data": {
//         "sender_name": "TestFirstName",
//         "entity_type": "post"
//     }
// }

export interface NotificationResponse {
  id: string;
  type: string;
  created_at: string;
  status: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  entity: {
    id: string;
  };
  message: string;
}
