# WebSocket Integration Guide

This project uses the `ws` library for WebSocket support, integrated in a modular, scalable way.

## File Structure

```
src/
  app/
    ws/
      ws.manager.ts      // Manages connected clients and messaging
      ws.controller.ts   // Handles connection events and message routing
      ws.route.ts        // Sets up the WebSocket server and connection handler
```

## How It Works

- The HTTP server is created in `server.ts` and passed to the WebSocket setup in `ws.route.ts`.
- All WebSocket logic is handled in the `ws/` folder using plain functions and objects (no classes).

## Usage

### 1. Start the Server

Run your server as usual (e.g. `bun start` or `npm start`). The WebSocket server will start automatically on the same port as your HTTP server.

### 2. Connect from a Client

Connect to your server using a WebSocket client:

```
ws://localhost:5000/your-client-id
```

- Replace `your-client-id` with a unique identifier for the client (can be user ID, random string, etc).

### 3. Sending and Receiving Messages

- Any message sent by a client will be broadcast to all connected clients.
- You can customize message handling in `ws.controller.ts`.

#### Example (ws.controller.ts):

```typescript
import { WebSocket } from "ws";
import { addClient, removeClient, broadcast } from "./ws.manager";

export function handleConnection(socket: WebSocket, clientId: string) {
  addClient(clientId, socket);

  socket.on("message", (message) => {
    // Handle incoming message
    broadcast(`Client ${clientId} says: ${message}`);
  });

  socket.on("close", () => {
    removeClient(clientId);
  });
}
```

### 4. Customizing

- To send a message to a specific client, use `sendMessage(clientId, message)` from `ws.manager.ts`.
- To add authentication or custom events, expand the logic in `ws.controller.ts`.

## Example Client (JavaScript)

```js
const ws = new WebSocket("ws://localhost:5000/your-client-id");
ws.onmessage = (event) => console.log("Received:", event.data);
ws.onopen = () => ws.send("Hello from client!");
```

## Troubleshooting

- Ensure the server is running and the port matches your client connection URL.
- Check the console for any errors during connection or messaging.

---

For advanced usage, see the `ws` library documentation: https://github.com/websockets/ws
