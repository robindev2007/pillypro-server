import { z } from "zod";

export const create = z.object({
  body: z.object({
    content: z.string().optional(),
    conversationId: z.cuid(),
    senderId: z.cuid(),
    fileUrl: z.array(z.url()).optional(),
  }),
});

export const update = z.object({
  body: z.object({}),
});

export const MessageValidation = { create, update };

export type CreateMessageInput = z.infer<typeof create>["body"];
export type UpdateMessageInput = z.infer<typeof update>["body"];
