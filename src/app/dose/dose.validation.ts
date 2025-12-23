import { timeRegex } from "@/constant";
import { MedicineType, SlotType } from "@/prisma/generated/enums";
import { z } from "zod";

export const create = z.object({
  body: z
    .object({
      doseName: z.string().min(1).max(255),
      medicineType: z.enum(MedicineType),
      slotType: z.enum(SlotType),
      slotColorCode: z.string().min(1),
      note: z.string().max(1000),
      totalPills: z.number().int().min(0).optional(),
      doseAmount: z.string().max(100).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),

      medicineTimes: z
        .array(z.string().regex(timeRegex, "Invalid time format (hh:mm AM/PM)"))
        .min(1),

      isActive: z.boolean().optional(),
      notificationEnabled: z.boolean().optional(),
    })
    .strict(),
});

export const update = z.object({
  body: z
    .object({
      doseName: z.string().min(1).max(255),
      medicineType: z.enum(MedicineType).optional(),
      slotType: z.enum(SlotType).optional(),
      slotColorCode: z.string().min(1).optional(),
      note: z.string().max(1000).optional(),
      totalPills: z.number().int().min(0).optional().optional(),
      doseAmount: z.string().max(100).optional().optional(),
      endDate: z.coerce.date().optional().optional(),

      medicineTimes: z
        .array(z.string().regex(timeRegex, "Invalid time format (hh:mm AM/PM)"))
        .min(1),

      isActive: z.boolean().optional(),
      notificationEnabled: z.boolean().optional(),
    })
    .strict(),
});

export const DoseValidation = { create, update };

export type CreateDoseInput = z.infer<typeof create>["body"];
export type UpdateDoseInput = z.infer<typeof update>["body"];
