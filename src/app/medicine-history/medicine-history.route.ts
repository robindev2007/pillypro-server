import { authorize } from "@/middleware/auth.middleware";
import express from "express";
import { MedicineHistoryController } from "./medicine-history.controller";

const router = express.Router();

router.post("/", authorize("LOGGED_IN"), MedicineHistoryController.create);
router.get("/", authorize("LOGGED_IN"), MedicineHistoryController.getAll);
router.get("/:id", authorize("LOGGED_IN"), MedicineHistoryController.getOne);
router.patch("/:id", authorize("LOGGED_IN"), MedicineHistoryController.update);
router.delete("/:id", authorize("LOGGED_IN"), MedicineHistoryController.remove);

router.put(
  "/:id/mark-dose-as-taken",
  authorize("LOGGED_IN"),
  MedicineHistoryController.markDoseAsTaken
);

export const MedicineHistoryRoutes = router;
