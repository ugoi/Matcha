---
title: Instant Notifications
description: Learn how to use the Matcha Real-Time API with Socket.IO for instant notifications.
---

## Introduction

The Matcha Real-Time API uses Socket.IO to enable real-time notification features.

## Connection Details

**Server URL:**  
`wss://localhost:3000/api`

**Transport:**  
- WebSockets (via Socket.IO)

**Namespace:**  
- **Notifications:** `/notifications`

## Authentication

The Socket.IO connection typically requires authentication. Pass a JWT or similar token as part of the connection query parameters or a custom header.

### Example using Socket.IO client (JavaScript):
```javascript
import { io } from "socket.io-client";

const socket = io("wss://localhost:3000/api/notifications", {
  auth: {
    token: "Bearer <your_jwt_token>"
  }
});

socket.on("connect", () => {
  console.log("Connected to the notifications namespace");
});

socket.on("error", (err) => {
  console.error("Socket error:", err);
});
```

Ensure your server-side Socket.IO configuration checks and validates the provided token before establishing a connection.

## Notification Events

**Events Emitted by the Server:**
- **notification:** Fired when there is a new notification for the user (e.g., someone liked their profile, or a new match is found).  

Payload Example:
```json
{
  "type": "like",
  "from": "another_user_id",
  "timestamp": "2024-12-10T14:31:00Z",
  "message": "User X liked your profile."
}
```

**Events Sent by the Client:**  
Generally, for notifications, the client only listens. If your implementation requires the client to mark notifications as read or perform other actions, you can define additional events. For example:  
- **ack notification:** The client acknowledges receipt of a notification.  

Example:
```javascript
socket.emit("ack notification", {
  notification_id: "some_notification_id"
});
```

## Best Practices

- **Reconnection:** Ensure your client-side logic handles reconnection events smoothly.
- **Performance:** Optimize handling for frequent notifications to avoid performance bottlenecks.
- **Security:** Always secure your tokens and use HTTPS/WSS in production.
