import mongoose from "mongoose";

const centerSchema = new mongoose.Schema({
  // 🔹 Basic Details
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  ownerName: { type: String, required: true },
  mobile: { type: String, required: true },

  // 🔹 Location
  village: String,
  taluka: String,
  district: String,
  state: String,
  address: String,
  pincode: String,
  latitude: Number,
  longitude: Number,

  // 🔹 Login
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  status: {
    type: String,
    enum: ["Active", "Suspended"],
    default: "Active",
  },

  // 🔹 Business Config
  milkType: {
    type: String,
    enum: ["cow", "buffalo", "both"],
    required: true,
  },
  rateType: {
    type: String,
    enum: ["fixed", "fat_snf"],
    required: true,
  },
  unit: {
    type: String,
    enum: ["liter", "kg"],
    default: "liter",
  },
  defaultRate: Number,
  shift: {
    type: String,
    enum: ["morning", "evening", "mix"],
    default: "both",
  },

  // 🔹 Payment
  paymentCycle: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
  },
  paymentMode: {
    type: String,
    enum: ["cash", "upi", "bank"],
  },
  commission: Number,

  // 🔹 System
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("Center", centerSchema);