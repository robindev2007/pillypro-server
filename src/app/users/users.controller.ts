import httpStatus from "@/constant/httpStatus";
import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import { UsersService } from "./users.service";

/**
 * Get all users (SUPER_ADMIN only)
 */
const getAllUsers = handleController(async (req, res) => {
  const result = await UsersService.getAllUsers(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

/**
 * Get user by ID (SUPER_ADMIN only)
 */
const getUserById = handleController(async (req, res) => {
  const user = await UsersService.getUserById(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

/**
 * Get current user profile
 */
const getMe = handleController(async (req, res) => {
  const user = await UsersService.getMe(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
});

/**
 * Update current user profile
 */
const updateProfile = handleController(async (req, res) => {
  const updatedUser = await UsersService.updateProfile(
    req.user.userId,
    req.body,
    req.file
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

/**
 * Delete user account
 */
const deleteUserAccount = handleController(async (req, res) => {
  const result = await UsersService.deleteUserAccount(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

export const UsersController = {
  getAllUsers,
  getUserById,
  getMe,
  updateProfile,
  deleteUserAccount,
};
