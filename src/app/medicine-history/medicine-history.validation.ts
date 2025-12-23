import { timeRegex } from "@/constant";
import { MedicineHistoryStatus } from "@/prisma/generated/enums";
import { z } from "zod";

export const create = z.object({
  body: z.object({
    slotId: z.cuid(),
    status: z.enum(MedicineHistoryStatus),
    actualDoseTime: z.coerce.date().optional(),
    doseTakenAt: z.coerce.date().optional(),
    slotTime: z.string().regex(timeRegex, "Invalid time format (hh:mm AM/PM)"),
  }),
});

export const update = z.object({
  query: {
    historyId: z.cuid(),
  },
  body: z.object({
    status: z.enum(MedicineHistoryStatus).optional(),
    doseTakenAt: z.date().optional(),
  }),
});

export const MedicineHistoryValidation = { create, update };

export type CreateMedicineHistoryInput = z.infer<typeof create>["body"];
export type UpdateMedicineHistoryInput = z.infer<typeof update>["body"];
