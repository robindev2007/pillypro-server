import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { DependentSelect } from "@/prisma/generated/models";
import { FileUploadService } from "@/services/fileUpload";
import type { Request } from "express";
import type {
  CreateDependentInput,
  UpdateDependentInput,
} from "./dependent.validation";

/**
 * Get all Dependents
 */
const getAllDependents = async (req: Request) => {
  const { data, meta } = await executePaginatedQuery<any, DependentSelect>(
    req,
    prisma.dependent,
    {
      searchFields: ["dependentCustomName", "caregiverCustomName", "id"], // add searchable fields
      filterFields: ["id"], // add filterable fields
      booleanFields: [],
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      customFilters(req, where) {
        if (req.query?.myRole == "CAREGIVER") {
          where.caregiverId = req.user.userId;
        } else if (req.query?.myRole == "DEPENDENT") {
          where.dependentId = req.user.userId;
        } else {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "myRole query parameter is required and must be either CAREGIVER or DEPENDENT"
          );
        }
      },
    },
    {
      id: true,
      createdAt: true,
      updatedAt: true,
      caregiverId: true,
      dependentId: true,
      caregiverCustomName: true,
      dependentCustomName: true,

      dependentUser: {
        select: {
          email: true,
          id: true,
          name: true,
          profile: true,
        },
      },
      caregiverUser: {
        select: {
          email: true,
          id: true,
          name: true,
          profile: true,
        },
      },
    }
  );

  const formatData = data.map(async (item) => {
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            userAId: item.caregiverId,
            userBId: item.dependentId,
          },
          {
            userAId: item.dependentId,
            userBId: item.caregiverId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    return {
      ...item,
      conversationId: conversation?.id || null,
    };
  });

  return { data: await Promise.all(formatData), meta };
};

/**
 * Get Dependent by ID
 */
const getDependentById = async (id: string) => {
  const record = await prisma.dependent.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      caregiverCustomName: true,
      dependentCustomName: true,
      dependentId: true,
      caregiverUser: {
        select: {
          email: true,
          id: true,
          name: true,
          profile: true,
        },
      },
      dependentUser: {
        select: {
          email: true,
          id: true,
          name: true,
          profile: true,
        },
      },
    },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dependent not found");

  return record;
};

/**
 * Create Dependent
 */
const createDependent = async (
  userId: string,
  payload: CreateDependentInput
) => {
  const caregiverData = await prisma.user.findFirst({
    where: {
      email: payload.dependentEmail,
      id: { not: userId },
      isAccountVerified: true,
    },

    include: {
      dependents: {
        where: {
          caregiverUser: { email: payload.dependentEmail },
          dependentUser: { id: userId },
        },
      },
    },
  });

  const dependentData = await prisma.user.findFirst({
    where: {
      id: userId,
      isAccountVerified: true,
    },
  });

  if (!caregiverData || !dependentData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User with the provided email does not exist"
    );
  }

  if (caregiverData.dependents.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This user is already added as a dependent"
    );
  }

  await prisma.conversation.create({
    data: {
      userAId: userId,
      userBId: caregiverData.id!,
    },
  });

  return prisma.dependent.create({
    data: {
      dependentId: userId,
      caregiverId: caregiverData.id,
      dependentCustomName: dependentData?.name,
      caregiverCustomName: payload.dependentCustomName || caregiverData?.name,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      dependentUser: true,
      caregiverUser: true,
    },
  });
};

/**
 * Update Dependent
 */
const updateDependent = async (
  userId: string,
  id: string,
  payload: UpdateDependentInput,
  file?: Express.Multer.File
) => {
  const record = await prisma.dependent.findUnique({
    where: { id, OR: [{ caregiverId: userId }, { dependentId: userId }] },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dependent not found");

  if (file) {
    (payload as any).fileField = FileUploadService.uploadAndReplace(
      file,
      (record as any).fileField
    );
  }

  return prisma.dependent.update({
    where: { id },
    data: payload,
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Delete Dependent
 */
const deleteDependent = async (userId: string, id: string) => {
  const record = await prisma.dependent.findUnique({
    where: {
      id,
      OR: [
        {
          caregiverId: userId,
        },
        { dependentId: userId },
      ],
    },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Dependent not found");

  if ((record as any).fileField)
    FileUploadService.deleteFiles((record as any).fileField);

  await prisma.dependent.delete({ where: { id } });

  return { message: "Dependent deleted successfully" };
};

export const DependentService = {
  getAllDependents,
  getDependentById,
  createDependent,
  updateDependent,
  deleteDependent,
};
