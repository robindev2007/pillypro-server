import { logger } from "@/utils/logger";
import { WebSocket } from "ws";
import { MessageService } from "../message/message.service";
import { addClient, removeClient, sendMessage } from "./ws.manager";
import { WsMessage } from "./ws.types";

export function handleConnection(socket: WebSocket, clientId: string) {
  addClient(clientId, socket);

  socket.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString()) as WsMessage;

      sendMessage(data.conversationId, JSON.stringify(data));
      try {
        await MessageService.createMessage({
          conversationId: data.conversationId,
          senderId: clientId,
          content: data.message,
          fileUrl: data.fileUrl,
        });
      } catch (error) {
        logger.error(`\nError saving message from ${clientId}: ${error}`);
      }
    } catch (error) {
      logger.error(`\nError processing message from ${clientId}: ${error}`);
    }
  });

  socket.on("close", () => {
    console.log(`Client ${clientId} disconnected`);

    removeClient(clientId);
  });
}
