import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { FileUploadService } from "@/services/fileUpload";
import type { Request } from "express";
import type { CreateDoseInput, UpdateDoseInput } from "./dose.validation";

/**
 * Get all Doses
 */
const getAllDoses = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.dose,
    {
      searchFields: [], // add searchable fields
      filterFields: [], // add filterable fields
      booleanFields: [],
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    },
    {
      id: true,
      createdAt: true,
      updatedAt: true,
    }
  );
};

/**
 * Get Dose by ID
 */
const getDoseById = async (id: string) => {
  const record = await prisma.dose.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dose not found");

  return record;
};

/**
 * Create Dose
 */
const createDose = async (payload: CreateDoseInput, userId: string) => {
  return prisma.dose.create({ data: { ...payload, userId } });
};

/**
 * Update Dose
 */
const updateDose = async (
  id: string,
  payload: UpdateDoseInput,
  file?: Express.Multer.File
) => {
  const record = await prisma.dose.findUnique({
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

  return prisma.dose.update({
    where: { id },
    data: payload,
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Delete Dose
 */
const deleteDose = async (id: string) => {
  const record = await prisma.dose.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dose not found");

  if ((record as any).fileField)
    FileUploadService.deleteFiles((record as any).fileField);

  await prisma.dose.delete({ where: { id } });

  return { message: "Dose deleted successfully" };
};

export const DoseService = {
  getAllDoses,
  getDoseById,
  createDose,
  updateDose,
  deleteDose,
};
