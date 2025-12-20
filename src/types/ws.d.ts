import { IncomingMessage } from "http";
import { WebSocket } from "ws";

export type WSClientId = string;
export type WSMessageHandler = (
  clientId: WSClientId,
  message: string,
  socket: WebSocket
) => void;
export interface WSConnection {
  clientId: WSClientId;
  socket: WebSocket;
  req: IncomingMessage;
}
