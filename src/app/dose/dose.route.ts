import validateRequest from "@/helpers/validateRequest";
import { authorize } from "@/middleware/auth.middleware";
import express from "express";
import { DoseController } from "./dose.controller";
import { DoseValidation } from "./dose.validation";

const router = express.Router();

router.post(
  "/",
  authorize("LOGGED_IN"),
  validateRequest(DoseValidation.create),
  DoseController.create
);
router.get("/", authorize("LOGGED_IN"), DoseController.getAll);
router.get("/:id", DoseController.getOne);
router.patch("/:id", DoseController.update);
router.delete("/:id", DoseController.remove);

export const DoseRoutes = router;
