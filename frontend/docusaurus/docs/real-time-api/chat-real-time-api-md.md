---
title: Instant Messaging with Matcha Real-Time API
description: A comprehensive guide to using the Matcha Real-Time API with Socket.IO for implementing instant messaging features.
---

# Introduction

The Matcha Real-Time API leverages **Socket.IO** to provide robust real-time messaging capabilities.

# Connection Details

**Server URL:**  
`wss://localhost:3000/api`

**Transport Protocols:**  
- WebSockets (via Socket.IO)

**Namespace:**  
- `/chat`

# Authentication

The Socket.IO connection requires authentication. Pass a JWT or a similar token through the connection query parameters or custom headers.

### Example: Authentication with Socket.IO Client (JavaScript)

```javascript
import { io } from "socket.io-client";

const socket = io("wss://localhost:3000/api/chat", {
  auth: {
    token: "Bearer <your_jwt_token>",
  },
});

socket.on("connect", () => {
  console.log("Successfully connected to the chat namespace.");
});
```

Ensure the server-side Socket.IO configuration validates the provided token before establishing the connection.

# Chat Events

## Events Emitted by the Server

### 1. **`chat message`**  
Triggered when a new chat message is received.

#### Payload Example:

```json
{
  "from": "user_id_of_sender",
  "message": "Hello! How are you?",
  "timestamp": "2024-12-10T14:30:00Z"
}
```

#### Example Usage:

```javascript
socket.on("chat message", (data) => {
  console.log("New chat message:", data);
});
```

### 2. **`error`**  
Triggered when an error occurs on the server.

#### Payload Example:

```text
Messaging not allowed
```

#### Example Usage:

```javascript
socket.on("error", (error) => {
  console.error("An error occurred:", error);
});
```

### Acknowledgements  

To mark a message as delivered, acknowledgements can be used.

#### Example:

```javascript
socket.on("chat message", (data, ack) => {
  console.log("New chat message:", data);
  ack("Message received");
});
```

## Events Sent by the Client

### 1. **`chat message`**  
Send a new message to another user.

#### Example Usage:

```javascript
socket.emit("chat message", {
  msg: "Hello, how are you?",
  receiver: "user_id_of_recipient",
});
```
