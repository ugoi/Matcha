# Notifications API

Notifications are triggered by the server and sent to the client using `socket.io`.

## Receiving notifications with socket.io with acknowledgement

To receive a notification from the server, you can use the `on` method from the `socket.io` instance.

You can also send an acknowledgement back to the server to confirm that the notification was received: https://socket.io/docs/v4/tutorial/api-overview#acknowledgements

```js
const io = require("socket.io-client");
const socket = io("http://localhost:3000");

socket.on("notification", (arg1, arg2, callback) => {
  console.log(arg1);
  console.log(arg2);
  callback({
    status: "ok",
  });
});
```
