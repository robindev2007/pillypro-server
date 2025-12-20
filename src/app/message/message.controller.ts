
import httpStatus from 'http-status';
import handleController from '@/helpers/handleController';
import sendResponse from '@/helpers/sendResponse';
import { MessageService } from './message.service';
import type { Request, Response } from 'express';

const create = handleController(async (req: Request, res: Response) => {
  const result = await MessageService.createMessage(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, message: 'Message created successfully', data: result });
});

const getAll = handleController(async (req: Request, res: Response) => {
  const result = await MessageService.getAllMessages(req);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Messages retrieved successfully', meta: result.meta, data: result.data });
});

const getOne = handleController(async (req: Request, res: Response) => {
  const result = await MessageService.getMessageById(req.params.id!);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Message retrieved successfully', data: result });
});

const update = handleController(async (req: Request, res: Response) => {
  const result = await MessageService.updateMessage(req.params.id!, req.body, req.file);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Message updated successfully', data: result });
});

const remove = handleController(async (req: Request, res: Response) => {
  const result = await MessageService.deleteMessage(req.params.id!);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Message deleted successfully', data: result });
});

export const MessageController = { create, getAll, getOne, update, remove };
