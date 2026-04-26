import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // CREATE_CENTER, UPDATE_RATE, etc.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userRole: String,

    entity: String, // Center, RateChart, Farmer
    entityId: mongoose.Schema.Types.ObjectId,

    details: Object, // flexible JSON

    ip: String,
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);