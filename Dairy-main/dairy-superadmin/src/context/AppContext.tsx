import React, { createContext, useContext, useMemo, useState } from "react";

const superAdminIdStorageKey = "dairy-superadmin.super-admin-id";
const fallbackSuperAdminId = "SA-001";

type AppContextValue = {
  currentSuperAdminId: string;
  setCurrentSuperAdminId: (value: string) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSuperAdminId, setCurrentSuperAdminIdState] = useState(
    localStorage.getItem(superAdminIdStorageKey) ?? fallbackSuperAdminId
  );

  const setCurrentSuperAdminId = (value: string) => {
    const next = value.trim() || fallbackSuperAdminId;
    localStorage.setItem(superAdminIdStorageKey, next);
    setCurrentSuperAdminIdState(next);
  };

  const value = useMemo<AppContextValue>(
    () => ({
      currentSuperAdminId,
      setCurrentSuperAdminId,
    }),
    [currentSuperAdminId]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider.");
  }
  return context;
};
