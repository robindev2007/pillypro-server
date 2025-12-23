import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import type { Request, Response } from "express";
import httpStatus from "http-status";
import { MedicineHistoryService } from "./medicine-history.service";

const create = handleController(async (req: Request, res: Response) => {
  const result = await MedicineHistoryService.createMedicineHistory(
    req.user.userId,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "MedicineHistory created successfully",
    data: result,
  });
});

const getAll = handleController(async (req: Request, res: Response) => {
  const result = await MedicineHistoryService.getAllMedicineHistory(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Medicine Histories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOne = handleController(async (req: Request, res: Response) => {
  const result = await MedicineHistoryService.getMedicineHistoryById(
    req.user.userId,
    req.params.id!
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "MedicineHistory retrieved successfully",
    data: result,
  });
});

const update = handleController(async (req: Request, res: Response) => {
  const result = await MedicineHistoryService.updateMedicineHistory(
    req.params.id!,
    req.body,
    req.file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "MedicineHistory updated successfully",
    data: result,
  });
});

const remove = handleController(async (req: Request, res: Response) => {
  const result = await MedicineHistoryService.deleteMedicineHistory(
    req.params.id!
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "MedicineHistory deleted successfully",
    data: result,
  });
});

const markDoseAsTaken = handleController(
  async (req: Request, res: Response) => {
    const result = await MedicineHistoryService.markDoseAsTaken(
      req.params.id!,
      req.user.userId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Dose marked as taken successfully",
      data: result,
    });
  }
);

export const MedicineHistoryController = {
  create,
  getAll,
  getOne,
  update,
  remove,
  markDoseAsTaken,
};
