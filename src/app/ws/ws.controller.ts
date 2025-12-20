import { logger } from "@/utils/logger";
import { WebSocket } from "ws";
import { addClient, removeClient, sendMessage } from "./ws.manager";

export function handleConnection(socket: WebSocket, clientId: string) {
  addClient(clientId, socket);

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      sendMessage(data.receiverId, JSON.stringify(data));
    } catch (error) {
      logger.error(`\nError processing message from ${clientId}: ${error}`);
    }
  });

  socket.on("close", () => {
    console.log(`Client ${clientId} disconnected`);

    removeClient(clientId);
  });
}
