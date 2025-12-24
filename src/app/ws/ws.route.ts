import { verifyAccessToken } from "@/utils/jwt";
import { Server } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./ws.controller";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (socket, req) => {
    const token = req.headers["authorization"] as string;

    console.log({ token });

    let user;

    try {
      user = await verifyAccessToken(token);
    } catch (error) {
      socket.send(JSON.stringify({ error: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
    }

    if (!user?.userId) {
      socket.send(JSON.stringify({ error: "Unauthorized" }));
      socket.close(1008, "Unauthorized");
    }

    const isMessagePath = req.url?.split("/").pop() === "message";
    if (!isMessagePath) {
      socket.send(JSON.stringify({ error: "Invalid WebSocket path" }));
      socket.close(1008, "Invalid WebSocket path");
      return;
    }

    handleConnection(socket, user?.userId as string);
  });
}
