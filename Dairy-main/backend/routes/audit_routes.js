import express from "express";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

// GET logs (with filters)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, action, entity } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const logs = await AuditLog.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;