import validateRequest from "@/helpers/validateRequest";
import { authorize } from "@/middleware/auth.middleware";
import express from "express";
import { DependentController } from "./dependent.controller";
import { DependentValidation } from "./dependent.validation";

const router = express.Router();

router.post(
  "/",
  authorize("LOGGED_IN"),
  validateRequest(DependentValidation.create),
  DependentController.create
);

router.get("/", authorize("LOGGED_IN"), DependentController.getAll);

router.get("/:id", authorize("LOGGED_IN"), DependentController.getOne);

router.patch("/:id", authorize("LOGGED_IN"), DependentController.update);

router.delete("/:id", authorize("LOGGED_IN"), DependentController.remove);
export const DependentRoutes = router;
