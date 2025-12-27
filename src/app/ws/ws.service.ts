import http from "http";
import { WebSocketServer } from "ws";

const server = http.createServer();

export const wws = new WebSocketServer({ server: server });
