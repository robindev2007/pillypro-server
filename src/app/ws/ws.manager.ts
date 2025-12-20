import { WebSocket } from "ws";

const clients = new Map<string, WebSocket>();

export function addClient(clientId: string, socket: WebSocket) {
  clients.set(clientId, socket);
}

export function removeClient(clientId: string) {
  clients.delete(clientId);
}

export function broadcast(message: string) {
  clients.forEach((socket) => {
    socket.send(message);
  });
}

export function sendMessage(clientId: string, message: string) {
  const socket = clients.get(clientId);
  if (socket) {
    socket.send(message);
  }
}
