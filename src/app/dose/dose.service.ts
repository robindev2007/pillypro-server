import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { MedicineSlot } from "@/prisma/generated/client";
import { MedicineSlotSelect } from "@/prisma/generated/models";
import { FileUploadService } from "@/services/fileUpload";
import { Request } from "express";
import type { CreateDoseInput, UpdateDoseInput } from "./dose.validation";

const getAllDoses = async (req: Request) => {
  const userId = req.user.userId;

  const { data, meta } = await executePaginatedQuery<
    MedicineSlot,
    MedicineSlotSelect
  >(
    req,
    prisma.medicineSlot,
    {
      searchFields: ["doseName"],
      filterFields: ["slotType", "isActive"],
      booleanFields: ["isActive"],
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      customFilters(req, where) {
        where.userId = userId;
      },
    },
    {
      id: true,
      slotType: true,
      doseName: true,
      doseAmount: true,
      medicineType: true,
      slotColorCode: true,
      totalPills: true,
      takenPills: true,
      medicineTimes: true,
      endDate: true,
      startDate: true,
      notificationEnabled: true,
      note: true,
      userId: true,
    }
  );

  const slots = await prisma.medicineSlot.findMany({
    where: { userId, isActive: true },
  });

  const counts = {
    small: slots.filter((s) => s.slotType === "SMALL").length,
    medium: slots.filter((s) => s.slotType === "MEDIUM").length,
    large: slots.filter((s) => s.slotType === "LARGE").length,
  };

  const isMixed = counts.medium > 0 || counts.large > 0;

  const availability = {
    currentCounts: counts,
    canAddSmall: isMixed ? counts.small < 1 : counts.small < 7,
    canAddMedium: counts.small <= 1 && counts.medium < 2,
    canAddLarge: counts.small <= 1 && counts.large < 1,
    recommendation:
      counts.small > 1
        ? "Reduce small slots to 1 to unlock larger sizes."
        : "You can add more slots.",
  };

  // --- LOGIC PROOF FORMATTING START ---
  const now = new Date();

  const formattedData = data.map((dose: any) => {
    const medicineTimes = (dose.medicineTimes as string[]) || [];
    let nextDoseTimeStr = "";
    let remainingTimeStr = "";

    if (medicineTimes.length > 0) {
      const parsedDoses = medicineTimes.map((timeStr) => {
        // Correctly parse "08:30 AM" or "08:30 PM"
        const [time, modifier] = timeStr.split(" ") as [string, string];
        let [hours, minutes] = time.split(":").map(Number) as [number, number];

        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        const doseDate = new Date(now);
        doseDate.setHours(hours, minutes, 0, 0);

        // If time already passed today, calculation moves to tomorrow
        if (doseDate.getTime() <= now.getTime()) {
          doseDate.setDate(doseDate.getDate() + 1);
        }

        return { timeStr, doseDate };
      });

      // Sort to get the closest one
      parsedDoses.sort((a, b) => a.doseDate.getTime() - b.doseDate.getTime());

      const nearest = parsedDoses[0] as { timeStr: string; doseDate: Date };
      nextDoseTimeStr = nearest.timeStr;

      // Calculate the difference
      const diffMs = nearest.doseDate.getTime() - now.getTime();
      const diffTotalMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffTotalMin / 60);
      const diffRemMin = diffTotalMin % 60;

      if (diffTotalMin <= 5) {
        remainingTimeStr = "Take now";
      } else if (diffTotalMin < 60) {
        remainingTimeStr = `${diffTotalMin}m left`;
      } else {
        // Example: "2h 15m left"
        remainingTimeStr = `${diffHrs}h ${diffRemMin}m left`;
      }
    }

    return {
      ...dose,
      remainingDose: (dose.totalPills ?? 0) - (dose.takenPills ?? 0),
      nextDoseTime: nextDoseTimeStr || null,
      remainingTime: remainingTimeStr || null,
    };
  });
  // --- LOGIC PROOF FORMATTING END ---

  return {
    data: formattedData,
    meta: {
      ...meta,
      availability,
    },
  };
};

const getDoseById = async (userId: string, id: string) => {
  const record = await prisma.medicineSlot.findFirst({
    where: {
      id,
      OR: [
        { userId: userId },
        {
          user: {
            dependents: {
              some: { id: userId },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      doseAmount: true,
      doseName: true,
      endDate: true,
      medicineTimes: true,
      medicineType: true,
      slotColorCode: true,
      slotType: true,
      totalPills: true,
      takenPills: true,
      userId: true,
      note: true,
      isActive: true,
      startDate: true,
      notificationEnabled: true,
    },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dose not found");

  // --- LOGIC PROOF SINGLE RECORD START ---
  const now = new Date();
  const medicineTimes = (record.medicineTimes as string[]) || [];
  let nextDoseTimeStr = null;
  let remainingTimeStr = null;

  if (medicineTimes.length > 0) {
    const parsedDoses = medicineTimes.map((timeStr) => {
      const [time, modifier] = timeStr.split(" ") as [string, string];
      let [hours, minutes] = time.split(":").map(Number) as [number, number];

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const doseDate = new Date(now);
      doseDate.setHours(hours, minutes, 0, 0);

      if (doseDate.getTime() <= now.getTime()) {
        doseDate.setDate(doseDate.getDate() + 1);
      }

      return { timeStr, doseDate };
    });

    parsedDoses.sort((a, b) => a.doseDate.getTime() - b.doseDate.getTime());

    const nearest = parsedDoses[0] as { timeStr: string; doseDate: Date };
    nextDoseTimeStr = nearest.timeStr;

    const diffMs = nearest.doseDate.getTime() - now.getTime();
    const diffTotalMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffTotalMin / 60);
    const diffRemMin = diffTotalMin % 60;

    // Inside your data.map or getDoseById logic:

    if (diffTotalMin <= 5) {
      remainingTimeStr = "Take now";
    } else if (diffTotalMin < 60) {
      remainingTimeStr = `${diffTotalMin}m left`;
    } else {
      // Example: "2h 15m left"
      remainingTimeStr = `${diffHrs}h ${diffRemMin}m left`;
    }
  }
  // --- LOGIC PROOF SINGLE RECORD END ---

  return {
    ...record,
    remainingDose: (record.totalPills ?? 0) - (record.takenPills ?? 0),
    nextDoseTime: nextDoseTimeStr,
    remainingTime: remainingTimeStr,
  };
};
const createDose = async (payload: CreateDoseInput, userId: string) => {
  const { small, medium, large, total } = await getSlotCounts(userId);
  const requestedType = payload.slotType;

  // 1. Initial State: Always allow the first slot
  if (total === 0) {
    return prisma.medicineSlot.create({
      data: { ...payload, userId },
    });
  }

  // 2. Identify if the user is in "Mixed Mode" (already has Medium or Large)
  const isCurrentlyMixed = medium > 0 || large > 0;

  // 3. Logic for SMALL slots
  if (requestedType === "SMALL") {
    if (!isCurrentlyMixed && small >= 7) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Limit reached: Max 7 small slots allowed."
      );
    }
    if (isCurrentlyMixed && small >= 1) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Mixed mode limit: Only 1 small slot allowed."
      );
    }
  }

  // 4. Logic for MEDIUM or LARGE slots
  else if (requestedType === "MEDIUM" || requestedType === "LARGE") {
    // Prevent entering mixed mode if user has > 1 small slot
    if (small > 1) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Too many small slots. Reduce to 1 to add larger sizes."
      );
    }

    if (requestedType === "MEDIUM" && medium >= 2) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Limit reached: Max 2 medium slots allowed."
      );
    }

    if (requestedType === "LARGE" && large >= 1) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Limit reached: Max 1 large slot allowed."
      );
    }
  }

  // 5. If all validations pass, create the slot
  return prisma.medicineSlot.create({
    data: { ...payload, userId },
  });
};

const updateDose = async (
  id: string,
  payload: UpdateDoseInput,
  file?: Express.Multer.File
) => {
  const record = await prisma.medicineSlot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dose not found");

  if (file) {
    (payload as any).fileField = FileUploadService.uploadAndReplace(
      file,
      (record as any).fileField
    );
  }

  return prisma.medicineSlot.update({
    where: { id },
    data: payload,
  });
};

const deleteDose = async (id: string) => {
  const record = await prisma.medicineSlot.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dose not found");

  if ((record as any).fileField)
    FileUploadService.deleteFiles((record as any).fileField);

  await prisma.medicineSlot.delete({ where: { id } });

  return { message: "Dose deleted successfully" };
};

export const DoseService = {
  getAllDoses,
  getDoseById,
  createDose,
  updateDose,
  deleteDose,
};

// Helper to get counts
const getSlotCounts = async (userId: string) => {
  const slots = await prisma.medicineSlot.findMany({
    where: { userId, isActive: true },
  });

  return {
    small: slots.filter((s) => s.slotType === "SMALL").length,
    medium: slots.filter((s) => s.slotType === "MEDIUM").length,
    large: slots.filter((s) => s.slotType === "LARGE").length,
    total: slots.length,
  };
};
