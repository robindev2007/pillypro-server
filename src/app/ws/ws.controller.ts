import { prisma } from "@/lib/db";
import { logger } from "@/utils/logger";
import { WebSocket } from "ws";
import { MessageService } from "../message/message.service";
import { addClient, broadcast, removeClient, sendMessage } from "./ws.manager";
import { WsMessage } from "./ws.types";

export function handleConnection(socket: WebSocket, userId: string) {
  addClient(userId, socket);

  logger.success(`Client ${userId} connected`, "Ws");

  const interval = setInterval(() => {
    broadcast(JSON.stringify({ type: "ping" }));
    if (socket.readyState === WebSocket.OPEN) socket.ping();
  }, 60000);

  sendConversationHistory(userId, socket);

  socket.on("history", () => sendConversationHistory(userId, socket));

  socket.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString()) as WsMessage;

      try {
        await MessageService.createMessage({
          conversationId: data.conversationId,
          senderId: userId,
          content: data.message,
          fileUrl: data.fileUrl,
        });

        const messages = await MessageService.getConversationsId(
          data.conversationId
        );

        sendMessage(
          messages?.userAId || "",
          JSON.stringify({ type: "messages", data: messages })
        );

        sendMessage(
          messages?.userBId || "",
          JSON.stringify({ type: "messages", data: messages })
        );
      } catch (error) {
        logger.error(`\nError saving message from ${userId}: ${error}`);
      }
    } catch (error) {
      logger.error(`\nError processing message from ${userId}: ${error}`);
    }
  });

  socket.on("close", () => {
    logger.warning(`Client ${userId} disconnected`);
    clearInterval(interval);

    removeClient(userId);
  });
}

const sendConversationHistory = async (userId: string, socket: WebSocket) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, name: true, email: true, profile: true } },
        userB: { select: { id: true, name: true, email: true, profile: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    socket.send(JSON.stringify({ type: "history", conversations }));
  } catch (error) {
    logger.error(`\nError sending conversation history to ${userId}: ${error}`);
  }
};
