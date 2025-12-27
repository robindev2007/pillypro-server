
import httpStatus from 'http-status';
import handleController from '@/helpers/handleController';
import sendResponse from '@/helpers/sendResponse';
import { PilsService } from './pils.service';
import type { Request, Response } from 'express';

const create = handleController(async (req: Request, res: Response) => {
  const result = await PilsService.createPils(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, message: 'Pils created successfully', data: result });
});

const getAll = handleController(async (req: Request, res: Response) => {
  const result = await PilsService.getAllPilss(req);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Pilss retrieved successfully', meta: result.meta, data: result.data });
});

const getOne = handleController(async (req: Request, res: Response) => {
  const result = await PilsService.getPilsById(req.params.id!);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Pils retrieved successfully', data: result });
});

const update = handleController(async (req: Request, res: Response) => {
  const result = await PilsService.updatePils(req.params.id!, req.body, req.file);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Pils updated successfully', data: result });
});

const remove = handleController(async (req: Request, res: Response) => {
  const result = await PilsService.deletePils(req.params.id!);
  sendResponse(res, { statusCode: httpStatus.OK, message: 'Pils deleted successfully', data: result });
});

export const PilsController = { create, getAll, getOne, update, remove };
