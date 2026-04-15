import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ FIXED import path
import { createCenter } from "../../axios/center_api";

import CenterFormSection from "../../components/centers/CenterFormSection";
import {
  CheckboxChipGroup,
  InputField,
  SelectField,
  TextAreaField,
} from "../../components/centers/CenterFormFields";
import SystemTrackingCard from "../../components/centers/SystemTrackingCard";
import { useAppContext } from "../../context/AppContext";

// ❌ REMOVE local context (was not hitting backend)
// import { useCenterContext } from "../../context/CenterContext";

const paymentModes = ["Cash", "UPI", "Bank"] as const;

const AddCenter: React.FC = () => {
  const navigate = useNavigate();
  const { currentSuperAdminId } = useAppContext();

  const now = useMemo(() => new Date().toISOString(), []);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ KEEP YOUR ORIGINAL FORM STRUCTURE
  const [form, setForm] = useState({
    dairyCode: "",
    dairyName: "",
    managerName: "",
    mobile: "",
    village: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    fullAddress: "",
    milkType: "Cow",
    rateType: "Fixed",
    unit: "Liter",
    shift: "Morning",
    defaultRate: "",
    paymentCycle: "Monthly",
    paymentMode: ["Cash"],
    password: "",
    status: "Active",
  });

  // ✅ INPUT HANDLER (UNCHANGED)
  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ PAYMENT MODE (UNCHANGED)
  const handlePaymentModeChange = (mode: (typeof paymentModes)[number]) => {
    setForm((prev) => {
      const exists = prev.paymentMode.includes(mode);
      const nextMode = exists
        ? prev.paymentMode.filter((item) => item !== mode)
        : [...prev.paymentMode, mode];

      return {
        ...prev,
        paymentMode: nextMode.length > 0 ? nextMode : ["Cash"],
      };
    });
  };

  /**
   * 🔥 ONLY NEW LOGIC: Convert frontend → backend format
   */
  const buildPayload = () => {
    return {
      name: form.dairyName,
      code: form.dairyCode || undefined,
      ownerName: form.managerName,
      mobile: form.mobile,

      username: form.mobile, // login username
      password: form.password,

      village: form.village,
      taluka: form.taluka,
      district: form.district,
      state: form.state,
      address: form.fullAddress,
      pincode: form.pincode,

      milkType: form.milkType.toLowerCase(),
      rateType: form.rateType === "Fixed" ? "fixed" : "fat_snf",
      unit: form.unit.toLowerCase(),
      shift: form.shift.toLowerCase(),

      defaultRate: form.defaultRate
        ? Number(form.defaultRate)
        : undefined,

      paymentCycle: form.paymentCycle.toLowerCase(),
      paymentMode: form.paymentMode[0]?.toLowerCase(),

      status: form.status,
    };
  };

  /**
   * 🔥 FIXED SUBMIT → CONNECTED TO BACKEND
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const payload = buildPayload();

      // ✅ CALL BACKEND
      await createCenter(payload);

      // ✅ SUCCESS
      navigate("/centers");

    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to save center");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add New Center</h1>
          <p className="text-sm text-slate-500">
            Register a new dairy collection center with configuration, payment, and tracking details.
          </p>
        </div>

        {/* ✅ UI COMPLETELY UNCHANGED */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">

          <CenterFormSection title="Basic Details">
            <InputField required label="Dairy Code" name="dairyCode" value={form.dairyCode} onChange={handleInputChange} />
            <InputField required label="Dairy Name" name="dairyName" value={form.dairyName} onChange={handleInputChange} />
            <InputField required label="Manager Name" name="managerName" value={form.managerName} onChange={handleInputChange} />
            <InputField required label="Mobile Number" name="mobile" value={form.mobile} onChange={handleInputChange} />
          </CenterFormSection>

          <CenterFormSection title="Location Details">
            <InputField required label="Village" name="village" value={form.village} onChange={handleInputChange} />
            <InputField required label="Taluka" name="taluka" value={form.taluka} onChange={handleInputChange} />
            <InputField required label="District" name="district" value={form.district} onChange={handleInputChange} />
            <InputField required label="State" name="state" value={form.state} onChange={handleInputChange} />
            <InputField required label="Pincode" name="pincode" value={form.pincode} onChange={handleInputChange} />
            <TextAreaField required label="Full Address" name="fullAddress" value={form.fullAddress} onChange={handleInputChange} />
          </CenterFormSection>

          <CenterFormSection title="Configuration">
            <SelectField label="Milk Type" name="milkType" value={form.milkType} onChange={handleInputChange} options={[
              { value: "Cow", label: "Cow" },
              { value: "Buffalo", label: "Buffalo" },
              { value: "Both", label: "Both" },
            ]} />
          </CenterFormSection>

          <CenterFormSection title="Payment & Access">
            <InputField required label="Admin Password" name="password" type="password" value={form.password} onChange={handleInputChange} />
            <CheckboxChipGroup label="Payment Modes" options={paymentModes} selected={form.paymentMode as (typeof paymentModes)[number][]} onToggle={handlePaymentModeChange} />
          </CenterFormSection>

          <SystemTrackingCard
            createdBy={currentSuperAdminId}
            createdAt={now}
            updatedAt={now}
          />

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Center"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddCenter;