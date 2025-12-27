
import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { FileUploadService } from "@/services/fileUpload";
import type { Request } from "express";
import type { CreatePilsInput, UpdatePilsInput } from "./pils.validation";

/**
 * Get all Pilss
 */
const getAllPilss = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.pils,
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
 * Get Pils by ID
 */
const getPilsById = async (id: string) => {
  const record = await prisma.pils.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Pils not found");

  return record;
};

/**
 * Create Pils
 */
const createPils = async (payload: CreatePilsInput) => {
  return prisma.pils.create({ data: payload });
};

/**
 * Update Pils
 */
const updatePils = async (id: string, payload: UpdatePilsInput, file?: Express.Multer.File) => {
  const record = await prisma.pils.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Pils not found");

  if (file) {
    (payload as any).fileField = FileUploadService.uploadAndReplace(file, (record as any).fileField);
  }

  return prisma.pils.update({
    where: { id },
    data: payload,
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Delete Pils
 */
const deletePils = async (id: string) => {
  const record = await prisma.pils.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Pils not found");

  if ((record as any).fileField) FileUploadService.deleteFiles((record as any).fileField);

  await prisma.pils.delete({ where: { id } });

  return { message: "Pils deleted successfully" };
};

export const PilsService = {
  getAllPilss,
  getPilsById,
  createPils,
  updatePils,
  deletePils,
};
