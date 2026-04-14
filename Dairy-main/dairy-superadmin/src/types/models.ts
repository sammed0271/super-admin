export type { Center } from "./centerEntry";

export interface Farmer {
  id: string;
  centerId: string;
  farmerCode: string;
  name: string;
  isActive: boolean;
  bankAccount?: string;
  ifsc?: string;
}

export type MilkType = "Cow" | "Buffalo" | "Mix";
export type ShiftType = "Morning" | "Evening";

export interface MilkCollection {
  id: string;
  centerId: string;
  farmerId: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  milkType: MilkType;
  quantity: number; // Liters
  fat: number;
  snf: number;
  rate: number; // per liter
  totalAmount: number;
}

export interface RateConfig {
  id: string;
  milkType: MilkType;
  appliedCenterIds: string[]; // ["All Centers"] or array of exact string IDs
  fatFactor: number;
  snfFactor: number;
  baseRate: number;
  effectiveDate: string;
  changedBy: string;
  status: "Active" | "Expired";
}

export type AuditSeverity = "Info" | "Low" | "Medium" | "Warning" | "Critical";

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string or formatted
  action: string;
  centerId: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  severity: AuditSeverity;
}

export interface QualityAlert {
  id: string;
  date: string;
  centerId: string;
  farmerId: string;
  milkType: MilkType;
  issue: string; // e.g., "Water Adulteration", "Low FAT"
  expectedFat: number;
  actualFat: number;
  expectedSnf: number;
  actualSnf: number;
  riskLevel: "Medium" | "High";
}

export interface User {
  id: string; // or email
  name: string;
  email: string;
  role: "Super Admin" | "Manager";
  assignedCenters: string[]; // ["All Centers"] or IDs
  avatarClass?: string;
}

export interface DairyProfile {
  dairyName: string;
  gstin: string;
  address: string;
}
