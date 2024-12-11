---
title: Instant Messaging
description: Learn how to use the Matcha Real-Time API with Socket.IO for instant messaging features.
---

## Introduction

The Matcha Real-Time API uses Socket.IO to enable real-time messaging features.

## Connection Details

**Server URL:**  
`wss://localhost:3000/api`

**Transport:**  
- WebSockets (via Socket.IO)

**Namespace:**  
- **Chat:** `/chat`

## Authentication

The Socket.IO connection typically requires authentication. Pass a JWT or similar token as part of the connection query parameters or a custom header.

### Example using Socket.IO client (JavaScript):
```javascript
import { io } from "socket.io-client";

const socket = io("wss://localhost:3000/api/chat", {
  auth: {
    token: "Bearer <your_jwt_token>"
  }
});

socket.on("connect", () => {
  console.log("Connected to the chat namespace");
});

socket.on("error", (err) => {
  console.error("Socket error:", err);
});
```

Ensure your server-side Socket.IO configuration checks and validates the provided token before establishing a connection.

## Chat Events

**Events Emitted by the Server:**
- **chat message:** Fired when a new chat message is delivered to the user.  

Payload Example:
```json
{
  "from": "user_id_of_sender",
  "message": "Hello! How are you?",
  "timestamp": "2024-12-10T14:30:00Z"
}
```

**Events Sent by the Client:**
- **chat message:** Send a new message to another user.  

Example:
```javascript
socket.emit("chat message", {
  receiver: "user_id_of_recipient",
  message: "Hi there!"
});
```

**Acknowledgements:**  
You can request server acknowledgements by passing a callback function to the emit call. This is useful for confirming that the message was received and processed by the server.

## Best Practices

- **Reconnection:** Ensure your client-side logic handles reconnection events smoothly.
- **Performance:** For high-frequency events, consider batching updates or using acknowledgements carefully.
- **Security:** Always secure your tokens and use HTTPS/WSS in production.
