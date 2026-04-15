import Center from "../models/Center.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

/**
 * CREATE CENTER
 * Superadmin only
 */
export const createCenter = async (req, res) => {
  try {
    const data = req.body;

    // 🔴 Validation
    if (!data.name || !data.mobile || !data.username || !data.password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔴 Check duplicates
    const existing = await Center.findOne({
      $or: [
        { code: data.code },
        { username: data.username },
        { mobile: data.mobile },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message: "Center with same code/username/mobile already exists",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 🔢 Auto code if not provided
    let code = data.code;
    if (!code) {
      const count = await Center.countDocuments();
      code = `DC${String(count + 1).padStart(3, "0")}`;
    }

    // ✅ Create center
    const center = await Center.create({
      ...data,
      code,
      password: hashedPassword,
      createdBy: req.user.id,
    });

    // ✅ Create admin user for this center
    const user = await User.create({
      name: data.ownerName,
      email: data.username,
      password: hashedPassword,
      role: "admin",
      centerId: center._id,
    });

    res.status(201).json({
      message: "Center created successfully",
      center,
      adminUserId: user._id,
    });

  } catch (err) {
    console.error("Create Center Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getCenters = async (req, res) => {
  try {
    const centers = await Center.find().sort({ createdAt: -1 });

    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCenterById = async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);

    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    res.json(center);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCenter = async (req, res) => {
  try {
    const updated = await Center.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleCenterStatus = async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);

    center.status = center.status === "Active" ? "Suspended" : "Active";
    await center.save();

    res.json(center);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};