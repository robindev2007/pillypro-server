import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { UserSelect } from "@/prisma/generated/models";
import { FileUploadService } from "@/services/fileUpload";
import type { Request } from "express";
import type { UpdateProfileInput } from "./users.validation";

/**
 * Get all users with pagination and filters (SUPER_ADMIN only)
 */
const getAllUsers = async (req: Request) => {
  return executePaginatedQuery<any, UserSelect>(
    req,
    prisma.user,
    {
      searchFields: ["name", "email", "location", "name", "id", "businessName"],
      filterFields: ["role", "name", "email", "location", "id", "businessName"],
      booleanFields: ["isAccountVerified"],
      defaultLimit: 10,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    },
    {
      id: true,
      email: true,
      name: true,
      profile: true,
      location: true,
      role: true,
      isAccountVerified: true,
      createdAt: true,
      updatedAt: true,
      dependents: true,
    }
  );
};

/**
 * Get user by ID (SUPER_ADMIN only)
 */
const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true,
      location: true,
      role: true,
      isAccountVerified: true,
      phone: true,
      dateOfBirth: true,
      companyName: true,
      isAgreeWithTerms: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

/**
 * Get current user profile
 */
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true,
      location: true,
      role: true,
      isAccountVerified: true,
      phone: true,
      dateOfBirth: true,
      companyName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

/**
 * Update current user profile
 */
const updateProfile = async (
  userId: string,
  payload: UpdateProfileInput,
  profileFile?: Express.Multer.File
) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profile: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Handle profile picture upload
  if (profileFile) {
    (payload as any).profile = FileUploadService.uploadAndReplace(
      profileFile,
      user.profile
    );
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
    },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true,
      location: true,
      role: true,
      isAccountVerified: true,
      phone: true,
      dateOfBirth: true,
      companyName: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Delete user account (soft delete or hard delete)
 */
const deleteUserAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profile: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Delete profile picture if exists
  if (user.profile) {
    FileUploadService.deleteFiles(user.profile);
  }

  // Hard delete - you can implement soft delete if needed
  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
    },
  });

  return { message: "Account deleted successfully" };
};

export const UsersService = {
  getAllUsers,
  getUserById,
  getMe,
  updateProfile,
  deleteUserAccount,
};
