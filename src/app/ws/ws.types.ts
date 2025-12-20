export type WsMessage = {
  message: string;
  conversationId: string;
  fileUrl?: string[];
};
