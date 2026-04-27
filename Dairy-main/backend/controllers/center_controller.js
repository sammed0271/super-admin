import Center from "../models/Center.js";
import User from "../models/User.js";
import farmer from "../models/Farmer.js";
import Milk from "../models/Milk.js";
import bcrypt from "bcrypt";
import AuditLog from "../models/AuditLog.js";

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


    await AuditLog.create({
      action: "CREATE_CENTER",
      userId: req.user.id,
      userRole: req.user.role,
      entity: "Center",
      entityId: center._id,
      details: {
        name: center.name,
        code: center.code,
      },
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
    const centers = await Center.aggregate([
      // 1️⃣ Get farmers for each center
      {
        $lookup: {
          from: "farmers",
          localField: "_id",
          foreignField: "centerId",
          as: "farmers",
        },
      },

      // 2️⃣ Get milk using farmerIds
      {
        $lookup: {
          from: "milks",
          let: { farmerIds: "$farmers._id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$farmerId", "$$farmerIds"] },
              },
            },
          ],
          as: "milk",
        },
      },

      // 3️⃣ Compute stats safely
      {
        $addFields: {
          totalMilk: {
            $round: [{ $sum: "$milk.quantity" }, 2],
          },

          avgFat: {
            $round: [
              {
                $cond: [
                  { $gt: [{ $size: "$milk" }, 0] },
                  { $avg: "$milk.fat" },
                  0,
                ],
              },
              2,
            ],
          },

          avgSnf: {
            $round: [
              {
                $cond: [
                  { $gt: [{ $size: "$milk" }, 0] },
                  { $avg: "$milk.snf" },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },

      // 4️⃣ Tank FAT (weighted)
      {
        $addFields: {
          tankFat: {
            $round: [
              {
                $cond: [
                  { $gt: [{ $sum: "$milk.quantity" }, 0] },
                  {
                    $divide: [
                      {
                        $sum: {
                          $map: {
                            input: "$milk",
                            as: "m",
                            in: {
                              $multiply: ["$$m.fat", "$$m.quantity"],
                            },
                          },
                        },
                      },
                      { $sum: "$milk.quantity" },
                    ],
                  },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },

      // 5️⃣ Clean output (VERY IMPORTANT)
      {
        $project: {
          name: 1,
          code: 1,
          status: 1,

          totalMilk: 1,
          avgFat: 1,
          avgSnf: 1,
          tankFat: 1,

          farmers: {
            $map: {
              input: "$farmers",
              as: "f",
              in: {
                _id: "$$f._id",
                name: "$$f.name",
                code: "$$f.code",
              },
            },
          },
        },
      },

      // 6️⃣ Sort latest first
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json(centers);
  } catch (err) {
    console.error("getCenters error:", err);
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

export const getCenterAnalytics = async (req, res) => {
  try {
    const { centerId } = req.params;

    const data = await Milk.aggregate([
      {
        $lookup: {
          from: "farmers",
          localField: "farmerId",
          foreignField: "_id",
          as: "farmer",
        },
      },
      { $unwind: "$farmer" },
      {
        $match: {
          "farmer.centerId": new mongoose.Types.ObjectId(centerId),
        },
      },

      // 🔹 Group by farmer
      {
        $group: {
          _id: "$farmerId",
          farmerName: { $first: "$farmer.name" },
          totalMilk: { $sum: "$quantity" },
          avgFat: { $avg: "$fat" },
          avgSnf: { $avg: "$snf" },
        },
      },
    ]);

    // 🔥 center totals
    const totalMilk = data.reduce((s, f) => s + f.totalMilk, 0);
    const avgFat =
      data.reduce((s, f) => s + f.avgFat, 0) / data.length || 0;

    const avgSnf =
      data.reduce((s, f) => s + f.avgSnf, 0) / data.length || 0;

    // 🔥 simulate tank FAT (later replace with real sensor)
    const tankFat = avgFat + 0.2;

    res.json({
      summary: {
        totalMilk,
        avgFat,
        avgSnf,
        tankFat,
        difference: tankFat - avgFat,
      },
      farmers: data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getCenterFullDetails = async (req, res) => {
  try {
    const { centerId } = req.params;

    // 1️⃣ Center
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    // 2️⃣ Farmers
    const farmers = await farmer.find({ centerId });

    // 3️⃣ Milk Data
    const milk = await Milk.find({ centerId })
      .sort({ date: -1 })
      .limit(50)
      .populate("farmerId", "name");

    // 4️⃣ Summary
    const totalMilk = milk.reduce((s, m) => s + m.quantity, 0);
    const avgFat =
      milk.reduce((s, m) => s + m.fat, 0) / (milk.length || 1);
    const avgSnf =
      milk.reduce((s, m) => s + m.snf, 0) / (milk.length || 1);

    res.json({
      center,
      farmers,
      milk,
      summary: {
        totalMilk,
        avgFat,
        avgSnf,
        farmersCount: farmers.length,
      },
    });

  } catch (err) {
    console.error("Center full details error:", err);
    res.status(500).json({ message: err.message });
  }
};