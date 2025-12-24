import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import { FileUploadService } from "@/services/fileUpload";
import { logger } from "@/utils/logger";
import type { Request } from "express";
import type {
  CreateMessageInput,
  UpdateMessageInput,
} from "./message.validation";

/**
 * Get all Messages
 */
const getAllMessages = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.message,
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
 * Get Message by ID
 */
const getMessageById = async (id: string) => {
  const record = await prisma.message.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Message not found");

  return record;
};

/**
 * Create Message
 */
const createMessage = async (payload: CreateMessageInput) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: payload.conversationId },
    select: { id: true },
  });

  if (!conversation) {
    logger.error("Invalid conversation ID");
  }

  return prisma.message.create({
    data: {
      content: payload.content ?? "",
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      files: payload.fileUrl ?? [],
    },
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Update Message
 */
const updateMessage = async (
  id: string,
  payload: UpdateMessageInput,
  file?: Express.Multer.File
) => {
  const record = await prisma.message.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Message not found");

  if (file) {
    (payload as any).fileField = FileUploadService.uploadAndReplace(
      file,
      (record as any).fileField
    );
  }

  return prisma.message.update({
    where: { id },
    data: payload,
    select: { id: true, createdAt: true, updatedAt: true },
  });
};

/**
 * Delete Message
 */
const deleteMessage = async (id: string) => {
  const record = await prisma.message.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Message not found");

  if ((record as any).fileField)
    FileUploadService.deleteFiles((record as any).fileField);

  await prisma.message.delete({ where: { id } });

  return { message: "Message deleted successfully" };
};

const getConversationsId = async (id: string) => {
  return prisma.conversation.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      userAId: true,
      userBId: true,
      userA: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
      },
      userB: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
      },
      messages: {
        take: 50,
        select: {
          content: true,
          senderId: true,
          createdAt: true,
          isRead: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
};

export const MessageService = {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  getConversationsId,
};
