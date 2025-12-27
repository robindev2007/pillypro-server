
import { z } from 'zod';

export const create = z.object({
  body: z.object({}),
});

export const update = z.object({
  body: z.object({}),
});

export const PilsValidation = { create, update };

export type CreatePilsInput = z.infer<typeof create>["body"];
export type UpdatePilsInput = z.infer<typeof update>["body"];
