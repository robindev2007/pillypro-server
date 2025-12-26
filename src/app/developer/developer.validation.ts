
import { z } from 'zod';

export const create = z.object({
  body: z.object({}),
});

export const update = z.object({
  body: z.object({}),
});

export const DeveloperValidation = { create, update };

export type CreateDeveloperInput = z.infer<typeof create>["body"];
export type UpdateDeveloperInput = z.infer<typeof update>["body"];
