
import { z } from 'zod';

export const create = z.object({
  body: z.object({}),
});

export const update = z.object({
  body: z.object({}),
});

export const NotificationsValidation = { create, update };

export type CreateNotificationsInput = z.infer<typeof create>["body"];
export type UpdateNotificationsInput = z.infer<typeof update>["body"];
