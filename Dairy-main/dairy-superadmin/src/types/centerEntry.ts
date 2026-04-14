export type Center = {
  id: string;
  dairyCode: string;

  dairyName: string;
  managerName: string;
  mobile: string;

  location: {
    village: string;
    taluka: string;
    district: string;
    state: string;
    pincode: string;
    fullAddress: string;
    latitude?: number;
    longitude?: number;
  };

  config: {
    milkType: "Cow" | "Buffalo" | "Both";
    rateType: "Fixed" | "Fat/SNF";
    unit: "Liter" | "Kg";
    shift: "Morning" | "Evening" | "Both";
    defaultRate?: number;
  };

  payment: {
    cycle: "Daily" | "Weekly" | "Monthly";
    mode: ("Cash" | "UPI" | "Bank")[];
  };

  auth: {
    passwordHash: string;
    role: "DairyAdmin";
    status: "Active" | "Suspended";
  };

  system: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}; 