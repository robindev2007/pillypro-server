import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import type { Request, Response } from "express";
import httpStatus from "http-status";
import { DependentService } from "./dependent.service";

const create = handleController(async (req: Request, res: Response) => {
  const result = await DependentService.createDependent(
    req.user.userId!,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Dependent created successfully",
    data: result,
  });
});

const getAll = handleController(async (req: Request, res: Response) => {
  const result = await DependentService.getAllDependents(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dependents retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOne = handleController(async (req: Request, res: Response) => {
  const result = await DependentService.getDependentById(req.params.id!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dependent retrieved successfully",
    data: result,
  });
});

const update = handleController(async (req: Request, res: Response) => {
  const result = await DependentService.updateDependent(
    req.user.userId,
    req.params.id!,
    req.body,
    req.file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dependent updated successfully",
    data: result,
  });
});

const remove = handleController(async (req: Request, res: Response) => {
  const result = await DependentService.deleteDependent(
    req.user.userId,
    req.params.id!
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dependent deleted successfully",
    data: result,
  });
});

export const DependentController = { create, getAll, getOne, update, remove };
