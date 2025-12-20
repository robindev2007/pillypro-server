import { logger } from "@/utils/logger";
import { Server } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./ws.controller";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket, req) => {
    const url = req.url || "/";
    const clientId = url.split("/").pop() || "unknown";

    const isMessageRoute = url.split("/")[1] == "message";

    if (!isMessageRoute) {
    }
    logger.success(`WebSocket client connected: ${clientId}`);
    handleConnection(socket, clientId);
  });
}
