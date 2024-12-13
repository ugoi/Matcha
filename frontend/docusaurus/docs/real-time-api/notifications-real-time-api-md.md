---
title: Instant Notifications with Matcha Real-Time API
description: A detailed guide to using the Matcha Real-Time API with Socket.IO for implementing real-time notification features.
---

# Introduction

The Matcha Real-Time API provides **Socket.IO** support to enable instant notification capabilities.

# Connection Details

**Server URL:**  
`wss://localhost:3000/api`

**Transport Protocols:**

- WebSockets (via Socket.IO)

**Namespace:**

- `/notifications`

# Authentication

To establish a secure connection, the Socket.IO client must provide a JWT or a similar authentication token as part of the connection query parameters or custom headers.

### Example: Authentication with Socket.IO Client (JavaScript)

```javascript
import { io } from "socket.io-client";

const socket = io("wss://localhost:3000/api/notifications", {
  auth: {
    token: "Bearer <your_jwt_token>",
  },
});

socket.on("connect", () => {
  console.log("Connected to the notifications namespace.");
});
```

Ensure the server-side configuration validates the token before granting access.

# Notification Events

## Events Emitted by the Server

### 1. **`notification`**

Triggered when a new notification is received.

#### Payload Example:

```json
{
  "type": "like",
  "from": "another_user_id",
  "timestamp": "2024-12-10T14:31:00Z",
  "message": "User X liked your profile."
}
```

#### Example Usage:

```javascript
socket.on("notification", (data) => {
  console.log("New notification:", data);
});
```

### 2. **`error`**

Triggered when an error occurs on the server.

#### Payload Example:

```text
Invalid authentication token
```

#### Example Usage:

```javascript
socket.on("error", (error) => {
  console.error("An error occurred:", error);
});
```

### Acknowledgements

Use acknowledgements to confirm receipt of a notification.

#### Example:

```javascript
socket.on("notification", (data, ack) => {
  console.log("New notification:", data);
  ack("Notification received");
});
```

## Events Sent by the Client

### 1. **`ack notification`**

Used to acknowledge receipt of a specific notification.

#### Example Usage:

```javascript
socket.emit("ack notification", {
  notification_id: "some_notification_id",
});
```

# Notification Features

By combining error handling, event listening, and acknowledgements, the Matcha Real-Time API enables smooth and reliable notification functionality in real-time applications.
