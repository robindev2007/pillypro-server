import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import type { Request, Response } from "express";
import httpStatus from "http-status";
import { DoseService } from "./dose.service";

const create = handleController(async (req: Request, res: Response) => {
  const result = await DoseService.createDose(req.body, req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Dose created successfully",
    data: result,
  });
});

const getAll = handleController(async (req: Request, res: Response) => {
  const result = await DoseService.getAllDoses(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Doses retrieved successfully",
    ...result,
  });
});

const getOne = handleController(async (req: Request, res: Response) => {
  const result = await DoseService.getDoseById(req.user.userId, req.params.id!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dose retrieved successfully",
    data: result,
  });
});

const update = handleController(async (req: Request, res: Response) => {
  const result = await DoseService.updateDose(
    req.params.id!,
    req.body,
    req.file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dose updated successfully",
    data: result,
  });
});

const remove = handleController(async (req: Request, res: Response) => {
  const result = await DoseService.deleteDose(req.params.id!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dose deleted successfully",
    data: result,
  });
});

export const DoseController = { create, getAll, getOne, update, remove };
