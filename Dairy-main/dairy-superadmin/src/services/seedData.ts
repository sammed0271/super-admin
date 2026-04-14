import type { Center, Farmer, MilkCollection, RateConfig, AuditLog, QualityAlert, User, DairyProfile } from "../types/models";
import { api } from "./api";

const generateMockData = () => {
  const centers: Center[] = [
    {
      id: "C-001", dairyCode: "ADC-01", dairyName: "Anand Dairy Center", managerName: "Ramesh Patel", mobile: "9876543210",
      location: { village: "Anand", taluka: "Anand", district: "Anand", state: "Gujarat", pincode: "388001", fullAddress: "Main Road, Anand" },
      config: { milkType: "Both", rateType: "Fat/SNF", unit: "Liter", shift: "Both" },
      payment: { cycle: "Weekly", mode: ["Bank"] },
      auth: { passwordHash: "hashed", role: "DairyAdmin", status: "Active" },
      system: { createdBy: "Super Admin", createdAt: "2023-01-15T00:00:00.000Z", updatedAt: "2023-01-15T00:00:00.000Z" }
    },
    {
      id: "C-002", dairyCode: "KCP-02", dairyName: "Kheda Collection Point", managerName: "Sanjay Desai", mobile: "9876543211",
      location: { village: "Kheda", taluka: "Kheda", district: "Kheda", state: "Gujarat", pincode: "387411", fullAddress: "Station Road, Kheda" },
      config: { milkType: "Both", rateType: "Fat/SNF", unit: "Liter", shift: "Both" },
      payment: { cycle: "Weekly", mode: ["Bank"] },
      auth: { passwordHash: "hashed", role: "DairyAdmin", status: "Active" },
      system: { createdBy: "Super Admin", createdAt: "2023-03-22T00:00:00.000Z", updatedAt: "2023-03-22T00:00:00.000Z" }
    },
    {
      id: "C-003", dairyCode: "MMH-03", dairyName: "Mehsana Milk Hub", managerName: "Kiran Shah", mobile: "9876543212",
      location: { village: "Mehsana", taluka: "Mehsana", district: "Mehsana", state: "Gujarat", pincode: "384002", fullAddress: "Highway, Mehsana" },
      config: { milkType: "Both", rateType: "Fat/SNF", unit: "Liter", shift: "Both" },
      payment: { cycle: "Weekly", mode: ["Bank"] },
      auth: { passwordHash: "hashed", role: "DairyAdmin", status: "Active" },
      system: { createdBy: "Super Admin", createdAt: "2023-06-10T00:00:00.000Z", updatedAt: "2023-06-10T00:00:00.000Z" }
    },
    {
      id: "C-004", dairyCode: "NC-04", dairyName: "Nadiad Center", managerName: "Vikram Rathod", mobile: "9876543213",
      location: { village: "Nadiad", taluka: "Nadiad", district: "Kheda", state: "Gujarat", pincode: "387001", fullAddress: "Bazaar, Nadiad" },
      config: { milkType: "Both", rateType: "Fat/SNF", unit: "Liter", shift: "Both" },
      payment: { cycle: "Weekly", mode: ["Bank", "Cash"] },
      auth: { passwordHash: "hashed", role: "DairyAdmin", status: "Active" },
      system: { createdBy: "Super Admin", createdAt: "2023-08-05T00:00:00.000Z", updatedAt: "2023-08-05T00:00:00.000Z" }
    },
  ];

  const farmers: Farmer[] = [];
  const collections: MilkCollection[] = [];

  const today = new Date();
  const pastDays = 30; // Generate 30 days of data

  centers.forEach((center, cIdx) => {
    // 15-25 farmers per center
    const numFarmers = 15 + Math.floor(Math.random() * 10);

    for (let f = 1; f <= numFarmers; f++) {
      const farmerId = `F-${center.id}-${f.toString().padStart(3, '0')}`;
      farmers.push({
        id: farmerId,
        centerId: center.id,
        farmerCode: `FRM-${1000 + (cIdx * 100) + f}`,
        name: `Farmer ${f} (${center.dairyName.split(' ')[0]})`,
        isActive: true
      });

      // Generate collections for this farmer over the past 30 days
      for (let d = 0; d < pastDays; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];

        const types: ("Cow" | "Buffalo" | "Mix")[] = ["Cow", "Buffalo", "Mix"];
        const preferredType = types[f % 3];

        // Morning Shift
        if (Math.random() > 0.1) { // 90% attendance
          const qty = 5 + Math.random() * 15;
          const fat = preferredType === "Buffalo" ? (6 + Math.random() * 2) : (3.5 + Math.random() * 1.5);
          const snf = 8 + Math.random();
          const rate = 30 + (fat * 4);
          collections.push({
            id: `COLL-M-${farmerId}-${dateStr}`,
            centerId: center.id,
            farmerId,
            date: dateStr,
            shift: "Morning",
            milkType: preferredType,
            quantity: Number(qty.toFixed(1)),
            fat: Number(fat.toFixed(1)),
            snf: Number(snf.toFixed(1)),
            rate: Number(rate.toFixed(2)),
            totalAmount: Number((qty * rate).toFixed(2))
          });
        }

        // Evening Shift
        if (Math.random() > 0.2) { // 80% attendance Evening
          const qty = 4 + Math.random() * 12;
          const fat = preferredType === "Buffalo" ? (6.2 + Math.random() * 2) : (3.6 + Math.random() * 1.5);
          const snf = 8 + Math.random();
          const rate = 30 + (fat * 4);
          collections.push({
            id: `COLL-E-${farmerId}-${dateStr}`,
            centerId: center.id,
            farmerId,
            date: dateStr,
            shift: "Evening",
            milkType: preferredType,
            quantity: Number(qty.toFixed(1)),
            fat: Number(fat.toFixed(1)),
            snf: Number(snf.toFixed(1)),
            rate: Number(rate.toFixed(2)),
            totalAmount: Number((qty * rate).toFixed(2))
          });
        }
      }
    }
  });

  const rateConfigs: RateConfig[] = [
    { id: "RC-1", milkType: "Cow", appliedCenterIds: ["All Centers"], fatFactor: 4.0, snfFactor: 1.0, baseRate: 20.0, effectiveDate: "2024-01-01", changedBy: "Admin", status: "Active" },
    { id: "RC-2", milkType: "Buffalo", appliedCenterIds: ["All Centers"], fatFactor: 4.5, snfFactor: 1.2, baseRate: 25.0, effectiveDate: "2024-01-01", changedBy: "Admin", status: "Active" },
    { id: "RC-3", milkType: "Mix", appliedCenterIds: ["All Centers"], fatFactor: 4.2, snfFactor: 1.1, baseRate: 22.5, effectiveDate: "2024-01-01", changedBy: "Admin", status: "Active" },
  ];

  const auditLogs: AuditLog[] = [
    { id: "AL-1", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Rate Chart Updated", centerId: "All Centers", oldValue: "Cow / ₹19 Base", newValue: "Cow / ₹20 Base", changedBy: "Rajesh (Admin)", severity: "Warning" },
    { id: "AL-2", timestamp: new Date(Date.now() - 7200000).toISOString(), action: "Farmer Added", centerId: "C-001", oldValue: "-", newValue: "FRM-1050 Added", changedBy: "Manager (Anand)", severity: "Info" },
    { id: "AL-3", timestamp: new Date(Date.now() - 86400000).toISOString(), action: "Bill Generated", centerId: "C-002", oldValue: "-", newValue: "₹45,200 Billed", changedBy: "System", severity: "Low" },
  ];

  const qualityAlerts: QualityAlert[] = [
    { id: "QA-1", date: new Date().toISOString().split('T')[0], centerId: "C-001", farmerId: farmers[0].id, milkType: "Cow", issue: "Water Adulteration", expectedFat: 4.3, actualFat: 2.8, expectedSnf: 8.5, actualSnf: 7.2, riskLevel: "High" },
    { id: "QA-2", date: new Date().toISOString().split('T')[0], centerId: "C-002", farmerId: farmers[15].id, milkType: "Buffalo", issue: "Low FAT", expectedFat: 6.5, actualFat: 5.1, expectedSnf: 9.0, actualSnf: 8.8, riskLevel: "Medium" },
  ];

  const users: User[] = [
    { id: "rajesh@dairypro.com", name: "Rajesh Sharma", email: "rajesh@dairypro.com", role: "Super Admin", assignedCenters: ["All Centers"], avatarClass: "from-blue-500 to-blue-600" },
    { id: "vijay@dairypro.com", name: "Vijay Kumar", email: "vijay@dairypro.com", role: "Manager", assignedCenters: ["C-001"], avatarClass: "from-green-500 to-green-600" },
  ];

  const dairyProfile: DairyProfile = {
    dairyName: "DairyPro Enterprise",
    gstin: "24AABCU9603R1ZM",
    address: "Industrial Area, Anand, Gujarat 388001"
  };

  return { centers, farmers, collections, rateConfigs, auditLogs, qualityAlerts, users, dairyProfile };
};

export const initializeDatabase = async () => {
  const exists = await api.hasData();
  if (!exists) {
    console.log("Database empty. Seeding mock data...");
    const db = generateMockData();
    await api.seedDatabase(db);
    console.log("Database seeded successfully.");
  }
};
