import { z } from "zod";

export const create = z.object({
  body: z.object({
    dependentCustomName: z.string().min(1).max(255).optional(),
    dependentEmail: z.email(),
  }),
});

export const update = z.object({
  body: z.object({
    dependentCustomName: z.string().min(1).max(255).optional(),
    caregiverCustomName: z.string().min(1).max(255).optional(),
  }),
});

export const deleteDependent = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const DependentValidation = { create, update, deleteDependent };
export type CreateDependentInput = z.infer<typeof create>["body"];
export type UpdateDependentInput = z.infer<typeof update>["body"];
export type DeleteDependentInput = z.infer<typeof deleteDependent>["params"];
