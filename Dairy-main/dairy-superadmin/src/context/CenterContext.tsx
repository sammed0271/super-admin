// context/CenterContext.tsx

import { createContext, useContext, useState } from "react";

const CenterContext = createContext<any>(null);

export const CenterProvider = ({ children }: any) => {
  const [selectedCenter, setSelectedCenter] = useState(null);

  return (
    <CenterContext.Provider value={{ selectedCenter, setSelectedCenter }}>
      {children}
    </CenterContext.Provider>
  );
};

export const useCenter = () => useContext(CenterContext);