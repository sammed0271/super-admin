import type { Center, Farmer, MilkCollection, RateConfig, AuditLog, QualityAlert, User, DairyProfile } from "../types/models";

const DB_KEY = "dairy-superadmin-db-v1";

interface Database {
  centers: Center[];
  farmers: Farmer[];
  collections: MilkCollection[];
  rateConfigs: RateConfig[];
  auditLogs: AuditLog[];
  qualityAlerts: QualityAlert[];
  users: User[];
  dairyProfile: DairyProfile | null;
}

const getDb = (): Database => {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return {
    centers: [], farmers: [], collections: [],
    rateConfigs: [], auditLogs: [], qualityAlerts: [],
    users: [], dairyProfile: null
  };
  try {
    return JSON.parse(raw);
  } catch {
    return {
      centers: [], farmers: [], collections: [],
      rateConfigs: [], auditLogs: [], qualityAlerts: [],
      users: [], dairyProfile: null
    };
  }
};

const saveDb = (db: Database) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Simulated network delay wrapper
const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const api = {
  // DB Management
  hasData: async (): Promise<boolean> => {
    const db = getDb();
    return db.centers.length > 0;
  },

  seedDatabase: async (data: Database): Promise<void> => {
    saveDb(data);
    await delay(undefined, 500);
  },

  clearDatabase: async (): Promise<void> => {
    localStorage.removeItem(DB_KEY);
    await delay(undefined);
  },

  // Centers
  getCenters: async (): Promise<Center[]> => delay(getDb().centers),
  getCenterById: async (id: string): Promise<Center | undefined> =>
    delay(getDb().centers.find(c => c.id === id)),
  createCenter: async (center: Center): Promise<void> => {
    const db = getDb();
    db.centers.unshift(center);
    saveDb(db);
    await delay(undefined);
  },
  updateCenter: async (center: Center): Promise<void> => {
    const db = getDb();
    db.centers = db.centers.map(c => c.id === center.id ? center : c);
    saveDb(db);
    await delay(undefined);
  },
  deleteCenter: async (id: string): Promise<void> => {
    const db = getDb();
    db.centers = db.centers.filter(c => c.id !== id);
    saveDb(db);
    await delay(undefined);
  },

  // Farmers
  getFarmers: async (centerId?: string): Promise<Farmer[]> => {
    let farmers = getDb().farmers;
    if (centerId && centerId !== "All Centers") {
      farmers = farmers.filter(f => f.centerId === centerId);
    }
    return delay(farmers);
  },

  // Collections
  getCollections: async (filters?: { centerId?: string; startDate?: string; endDate?: string; shift?: string }): Promise<MilkCollection[]> => {
    let colls = getDb().collections;

    if (filters) {
      if (filters.centerId && filters.centerId !== "All Centers") {
        colls = colls.filter(c => c.centerId === filters.centerId);
      }
      if (filters.shift && filters.shift !== "Both Shifts") {
        const exactShift = filters.shift.replace(" Only", "");
        colls = colls.filter(c => c.shift === exactShift);
      }
      if (filters.startDate) {
        colls = colls.filter(c => new Date(c.date) >= new Date(filters.startDate!));
      }
      if (filters.endDate) {
        colls = colls.filter(c => new Date(c.date) <= new Date(filters.endDate!));
      }
    }
    return delay(colls);
  },

  // Rate Configs
  getRateConfigs: async (): Promise<RateConfig[]> => delay(getDb().rateConfigs),
  saveRateConfig: async (config: RateConfig): Promise<void> => {
    const db = getDb();

    // Expire active config of same type
    db.rateConfigs = db.rateConfigs.map(c =>
      (c.milkType === config.milkType && c.status === "Active" &&
        c.appliedCenterIds.some(id => config.appliedCenterIds.includes(id)))
        ? { ...c, status: "Expired" }
        : c
    );

    db.rateConfigs.unshift(config); // Add new to front
    saveDb(db);

    // Auto-create audit log
    await api.createAuditLog({
      id: "AL-" + Date.now(),
      timestamp: new Date().toISOString(),
      action: "Rate Chart Updated",
      centerId: config.appliedCenterIds[0] || "All Centers",
      oldValue: "-",
      newValue: `${config.milkType} / ₹${config.baseRate.toFixed(2)} Base`,
      changedBy: config.changedBy,
      severity: "Warning"
    });
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => delay(getDb().auditLogs),
  createAuditLog: async (log: AuditLog): Promise<void> => {
    const db = getDb();
    db.auditLogs.unshift(log);
    saveDb(db);
  },

  // Quality Alerts
  getQualityAlerts: async (): Promise<QualityAlert[]> => delay(getDb().qualityAlerts),

  // Users & Profile
  getUsers: async (): Promise<User[]> => delay(getDb().users),
  createUser: async (user: User): Promise<void> => {
    const db = getDb();
    db.users.push(user);
    saveDb(db);
  },
  deleteUser: async (email: string): Promise<void> => {
    const db = getDb();
    db.users = db.users.filter(u => u.email !== email);
    saveDb(db);
  },

  getDairyProfile: async (): Promise<DairyProfile | null> => delay(getDb().dairyProfile),
  saveDairyProfile: async (profile: DairyProfile): Promise<void> => {
    const db = getDb();
    db.dairyProfile = profile;
    saveDb(db);
  }
};

