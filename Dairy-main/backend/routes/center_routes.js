import express from "express";
import {
  createCenter,
  getCenters,
  getCenterById,
  updateCenter,
  toggleCenterStatus,
} from "../controllers/center_controller.js";

import { protect } from "../middleware/auth_middleware.js";

const router = express.Router();

// 🔐 Superadmin routes
router.post("/", protect, createCenter);
router.get("/", protect, getCenters);
router.get("/:id", protect, getCenterById);
router.put("/:id", protect, updateCenter);
router.patch("/:id/toggle", protect, toggleCenterStatus);

export default router;