import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { MessageService, DependentService } from '../services';
import { User } from '../models';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'auth' | 'message' | 'typing' | 'read' | 'read_conversation' | 'ping';
  token?: string;
  receiverId?: string;
  content?: string;
  messageId?: string;
  otherUserId?: string;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

const clients = new Map<string, AuthenticatedWebSocket>();

export const initializeWebSocket = (server: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedWebSocket;
      if (client.isAlive === false) {
        if (client.userId) {
          clients.delete(client.userId);
        }
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message);
            break;

          case 'message':
            await handleMessage(ws, message);
            break;

          case 'typing':
            handleTyping(ws, message);
            break;

          case 'read':
            await handleRead(ws, message);
            break;

          case 'read_conversation':
            await handleReadConversation(ws, message);
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            sendError(ws, 'Unknown message type');
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setTimeout(() => {
      if (!ws.userId) {
        ws.close(4001, 'Authentication timeout');
      }
    }, 10000);
  });

  console.log('✅ WebSocket server initialized');
  return wss;
};

async function handleAuth(ws: AuthenticatedWebSocket, message: WebSocketMessage): Promise<void> {
  if (!message.token) {
    sendError(ws, 'Token is required');
    return;
  }

  try {
    const decoded = jwt.verify(message.token, config.jwt.secret) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isEmailVerified) {
      sendError(ws, 'Invalid user');
      ws.close(4003, 'Invalid user');
      return;
    }

    ws.userId = user._id.toString();
    clients.set(ws.userId, ws);

    ws.send(JSON.stringify({
      type: 'auth_success',
      userId: ws.userId,
      message: 'Authentication successful',
    }));

    console.log(`User ${ws.userId} connected via WebSocket`);
  } catch (error) {
    sendError(ws, 'Invalid token');
    ws.close(4002, 'Invalid token');
  }
}

async function handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): Promise<void> {
  if (!ws.userId) {
    sendError(ws, 'Not authenticated');
    return;
  }

  if (!message.receiverId || !message.content) {
    sendError(ws, 'Receiver ID and content are required');
    return;
  }

  try {
    const savedMessage = await MessageService.sendMessage(
      ws.userId,
      message.receiverId,
      message.content
    );

    ws.send(JSON.stringify({
      type: 'message_sent',
      message: savedMessage,
    }));

    const receiverWs = clients.get(message.receiverId);
    if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
      receiverWs.send(JSON.stringify({
        type: 'new_message',
        message: savedMessage,
      }));
    }
  } catch (error) {
    sendError(ws, error instanceof Error ? error.message : 'Failed to send message');
  }
}

function handleTyping(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
  if (!ws.userId || !message.receiverId) {
    return;
  }

  const receiverWs = clients.get(message.receiverId);
  if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
    receiverWs.send(JSON.stringify({
      type: 'typing',
      senderId: ws.userId,
    }));
  }
}

async function handleRead(ws: AuthenticatedWebSocket, message: WebSocketMessage): Promise<void> {
  if (!ws.userId || !message.messageId) {
    return;
  }

  try {
    const updatedMessage = await MessageService.markAsRead(message.messageId, ws.userId);

    const senderWs = clients.get(updatedMessage.senderId.toString());
    if (senderWs && senderWs.readyState === WebSocket.OPEN) {
      senderWs.send(JSON.stringify({
        type: 'message_read',
        messageId: message.messageId,
        readAt: updatedMessage.readAt,
      }));
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

async function handleReadConversation(ws: AuthenticatedWebSocket, message: WebSocketMessage): Promise<void> {
  if (!ws.userId || !message.otherUserId) {
    return;
  }

  try {
    const result = await MessageService.markConversationAsRead(ws.userId, message.otherUserId);

    // Notify the other user that their messages have been read
    const otherUserWs = clients.get(message.otherUserId);
    if (otherUserWs && otherUserWs.readyState === WebSocket.OPEN) {
      otherUserWs.send(JSON.stringify({
        type: 'conversation_read',
        readBy: ws.userId,
        count: result.count,
        readAt: new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
}

function sendError(ws: WebSocket, message: string): void {
  ws.send(JSON.stringify({
    type: 'error',
    message,
  }));
}

export const getOnlineUsers = (): string[] => {
  return Array.from(clients.keys());
};

export const isUserOnline = (userId: string): boolean => {
  return clients.has(userId);
};

export const sendToUser = (userId: string, data: object): boolean => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
};
