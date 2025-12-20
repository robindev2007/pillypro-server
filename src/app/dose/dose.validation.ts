import { MedicineType, SlotType } from "@/prisma/generated/enums";
import { z } from "zod";

const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const create = z.object({
  body: z.object({
    doseName: z.string().min(1).max(255),
    medicineType: z.enum(MedicineType),
    slotType: z.enum(SlotType),
    colorCode: z.string().regex(hexRegex, "Invalid hex color code"),
    notes: z.string().max(1000).optional(),
    totalPills: z.number().int().min(0).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    medicineTimes: z
      .array(z.string().regex(timeRegex, "Invalid time format (HH:mm)"))
      .min(1),
    isActive: z.boolean().optional(),
    notificationEnabled: z.boolean().optional(),
  }),
});

export const update = z.object({
  body: z.object({}),
});

export const DoseValidation = { create, update };

export type CreateDoseInput = z.infer<typeof create>["body"];
export type UpdateDoseInput = z.infer<typeof update>["body"];
