import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { MedicineHistorySelect } from "@/prisma/generated/models";
import { FileUploadService } from "@/services/fileUpload";
import { DefaultArgs } from "@prisma/client/runtime/client";
import type { Request } from "express";
import type {
  CreateMedicineHistoryInput,
  UpdateMedicineHistoryInput,
} from "./medicine-history.validation";

/**
 * Get all MedicineHistory
 */
const getAllMedicineHistory = async (req: Request) => {
  const { dependentUserId } = req.query as { dependentUserId?: string };

  const { data, meta } = await executePaginatedQuery<
    any,
    MedicineHistorySelect<DefaultArgs>
  >(
    req,
    prisma.medicineHistory,
    {
      searchFields: ["slot.doseName"], // add searchable fields
      filterFields: ["slot.medicineType", "userId"], // add filterable fields
      dateFields: ["doseTakenAt"], // add date fields
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      customFilters(req, where) {
        if (dependentUserId) {
          // 1. We want history belonging to the dependentUserId
          where.userId = dependentUserId;

          // 2. BUT only if the logged-in user (req.user.userId) is a dependent of that person
          where.user = {
            dependents: {
              some: {
                id: req.user.userId,
              },
            },
          };
        } else {
          // Default case: Just get my own medicine history
          where.userId = req.user?.userId;
        }
      },
    },
    {
      id: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      doseTakenAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      slot: {
        select: {
          doseAmount: true,
          id: true,
          totalPills: true,
          takenPills: true,
          doseName: true,
          medicineType: true,
          note: true,
          slotColorCode: true,
          slotType: true,
          medicineTimes: true,
        },
      },
    }
  );

  const formattedData = data.map((item) => ({
    ...item,
    slot: {
      ...item.slot,
    },
  }));

  return { data: formattedData, meta };
};

/**
 * Get MedicineHistory by ID
 */
const getMedicineHistoryById = async (userId: string, id: string) => {
  const record = await prisma.medicineHistory.findUnique({
    where: {
      id,
      OR: [{ userId }, { user: { dependents: { some: { id: userId } } } }],
    },
    select: {
      id: true,
      doseTakenAt: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      slot: {
        select: {
          doseAmount: true,
          id: true,
          totalPills: true,
          takenPills: true,
          doseName: true,
          medicineType: true,
          note: true,
          slotColorCode: true,
          slotType: true,
          medicineTimes: true,
        },
      },
    },
  });

  if (!record)
    throw new AppError(httpStatus.NOT_FOUND, "MedicineHistory not found");

  return record;
};

/**
 * Create MedicineHistory
 */
const createMedicineHistory = async (
  userId: string,
  payload: CreateMedicineHistoryInput
) => {
  const slot = await prisma.medicineSlot.findUnique({
    where: { id: payload.slotId },
    select: { id: true },
  });

  if (!slot) throw new AppError(httpStatus.NOT_FOUND, "MedicineSlot not found");

  return prisma.medicineHistory.create({
    data: { ...payload, userId },
  });
};

/**
 * Update MedicineHistory
 */
const updateMedicineHistory = async (
  id: string,
  payload: UpdateMedicineHistoryInput,
  file?: Express.Multer.File
) => {
  const record = await prisma.medicineHistory.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record)
    throw new AppError(httpStatus.NOT_FOUND, "MedicineHistory not found");

  if (file) {
    (payload as any).fileField = FileUploadService.uploadAndReplace(
      file,
      (record as any).fileField
    );
  }

  return prisma.medicineHistory.update({
    where: { id },
    data: payload,
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Delete MedicineHistory
 */
const deleteMedicineHistory = async (id: string) => {
  const record = await prisma.medicineHistory.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record)
    throw new AppError(httpStatus.NOT_FOUND, "MedicineHistory not found");

  if ((record as any).fileField)
    FileUploadService.deleteFiles((record as any).fileField);

  await prisma.medicineHistory.delete({ where: { id } });

  return { message: "MedicineHistory deleted successfully" };
};

const markDoseAsTaken = async (id: string, userId: string) => {
  const record = await prisma.medicineHistory.findUnique({
    where: { id, userId },
    select: { id: true, status: true },
  });

  if (!record)
    throw new AppError(httpStatus.NOT_FOUND, "MedicineHistory not found");

  if (record.status === "TAKEN") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Dose is already marked as taken"
    );
  }

  return prisma.medicineHistory.update({
    where: { id },
    data: {
      status: "TAKEN",
      doseTakenAt: new Date(),
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      doseTakenAt: true,
    },
  });
};

export const MedicineHistoryService = {
  getAllMedicineHistory,
  getMedicineHistoryById,
  createMedicineHistory,
  updateMedicineHistory,
  deleteMedicineHistory,
  markDoseAsTaken,
};
