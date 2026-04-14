import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  deleteCenterFromDb,
  getCentersFromDb,
  saveCenterToDb,
  seedCentersToDb,
  updateCenterInDb,
} from "../lib/centerDb";
import type { Center } from "../types/centerEntry";

const legacyCentersStorageKey = "dairy-superadmin.centers.v1";

type CenterContextValue = {
  centers: Center[];
  isLoading: boolean;
  error: string | null;
  addCenter: (center: Center) => Promise<void>;
  updateCenter: (center: Center) => Promise<void>;
  deleteCenter: (centerId: string) => Promise<void>;
  refreshCenters: () => Promise<void>;
};

const CenterContext = createContext<CenterContextValue | undefined>(undefined);

const readLegacyCenters = (): Center[] => {
  const raw = localStorage.getItem(legacyCentersStorageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Center[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCenters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let rows = await getCentersFromDb();

      if (rows.length === 0) {
        const legacyRows = readLegacyCenters();
        if (legacyRows.length > 0) {
          await seedCentersToDb(legacyRows);
          localStorage.removeItem(legacyCentersStorageKey);
          rows = await getCentersFromDb();
        }
      }

      setCenters(rows);
    } catch {
      setError("Unable to load centers from IndexedDB.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCenter = useCallback(async (center: Center) => {
    await saveCenterToDb(center);
    setCenters((prev) =>
      [center, ...prev].sort((a, b) =>
        b.system.createdAt.localeCompare(a.system.createdAt)
      )
    );
  }, []);

  const updateCenter = useCallback(async (center: Center) => {
    await updateCenterInDb(center);
    setCenters((prev) =>
      prev
        .map((item) => (item.id === center.id ? center : item))
        .sort((a, b) => b.system.createdAt.localeCompare(a.system.createdAt))
    );
  }, []);

  const deleteCenter = useCallback(async (centerId: string) => {
    await deleteCenterFromDb(centerId);
    setCenters((prev) => prev.filter((item) => item.id !== centerId));
  }, []);

  useEffect(() => {
    refreshCenters();
  }, [refreshCenters]);

  const value = useMemo<CenterContextValue>(
    () => ({
      centers,
      isLoading,
      error,
      addCenter,
      updateCenter,
      deleteCenter,
      refreshCenters,
    }),
    [centers, isLoading, error, addCenter, updateCenter, deleteCenter, refreshCenters]
  );

  return <CenterContext.Provider value={value}>{children}</CenterContext.Provider>;
};

export const useCenterContext = (): CenterContextValue => {
  const context = useContext(CenterContext);
  if (!context) {
    throw new Error("useCenterContext must be used within a CenterProvider.");
  }
  return context;
};
