import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenterFormSection from "../../components/centers/CenterFormSection";
import {
  CheckboxChipGroup,
  InputField,
  SelectField,
  TextAreaField,
} from "../../components/centers/CenterFormFields";
import SystemTrackingCard from "../../components/centers/SystemTrackingCard";
import { useAppContext } from "../../context/AppContext";
import { useCenterContext } from "../../context/CenterContext";
import type { Center } from "../../types/centerEntry";

const paymentModes = ["Cash", "UPI", "Bank"] as const;

const AddCenter: React.FC = () => {
  const navigate = useNavigate();
  const { addCenter } = useCenterContext();
  const { currentSuperAdminId } = useAppContext();

  const now = useMemo(() => new Date().toISOString(), []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    milkType: "Cow" as Center["config"]["milkType"],
    rateType: "Fixed" as Center["config"]["rateType"],
    unit: "Liter" as Center["config"]["unit"],
    shift: "Morning" as Center["config"]["shift"],
    defaultRate: "",
    paymentCycle: "Monthly" as Center["payment"]["cycle"],
    paymentMode: ["Cash"] as Center["payment"]["mode"],
    password: "",
    status: "Active" as Center["auth"]["status"],
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const buildCenterPayload = (): Center => {
    const timestamp = new Date().toISOString();

    return {
      id: `center-${Date.now()}`,
      dairyCode: form.dairyCode.trim(),
      dairyName: form.dairyName.trim(),
      managerName: form.managerName.trim(),
      mobile: form.mobile.trim(),
      location: {
        village: form.village.trim(),
        taluka: form.taluka.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        fullAddress: form.fullAddress.trim(),
      },
      config: {
        milkType: form.milkType,
        rateType: form.rateType,
        unit: form.unit,
        shift: form.shift,
        defaultRate: form.defaultRate ? Number(form.defaultRate) : undefined,
      },
      payment: {
        cycle: form.paymentCycle,
        mode: form.paymentMode,
      },
      auth: {
        passwordHash: form.password.trim(),
        role: "DairyAdmin",
        status: form.status,
      },
      system: {
        createdBy: currentSuperAdminId,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const payload = buildCenterPayload();
      await addCenter(payload);
      navigate("/centers");
    } catch {
      setError("Unable to save center. Please try again.");
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

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
          <CenterFormSection title="Basic Details">
            <InputField
              required
              label="Dairy Code"
              name="dairyCode"
              value={form.dairyCode}
              onChange={handleInputChange}
              placeholder="DC-001"
            />
            <InputField
              required
              label="Dairy Name"
              name="dairyName"
              value={form.dairyName}
              onChange={handleInputChange}
              placeholder="Anand Dairy Center"
            />
            <InputField
              required
              label="Manager Name"
              name="managerName"
              value={form.managerName}
              onChange={handleInputChange}
            />
            <InputField
              required
              label="Mobile Number"
              name="mobile"
              value={form.mobile}
              onChange={handleInputChange}
            />
          </CenterFormSection>

          <CenterFormSection title="Location Details">
            <InputField
              required
              label="Village"
              name="village"
              value={form.village}
              onChange={handleInputChange}
            />
            <InputField
              required
              label="Taluka"
              name="taluka"
              value={form.taluka}
              onChange={handleInputChange}
            />
            <InputField
              required
              label="District"
              name="district"
              value={form.district}
              onChange={handleInputChange}
            />
            <InputField
              required
              label="State"
              name="state"
              value={form.state}
              onChange={handleInputChange}
            />
            <InputField
              required
              label="Pincode"
              name="pincode"
              value={form.pincode}
              onChange={handleInputChange}
            />
            <TextAreaField
              required
              label="Full Address"
              name="fullAddress"
              value={form.fullAddress}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
          </CenterFormSection>

          <CenterFormSection title="Configuration" className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              label="Milk Type"
              name="milkType"
              value={form.milkType}
              onChange={handleInputChange}
              options={[
                { value: "Cow", label: "Cow" },
                { value: "Buffalo", label: "Buffalo" },
                { value: "Both", label: "Both" },
              ]}
            />
            <SelectField
              label="Rate Type"
              name="rateType"
              value={form.rateType}
              onChange={handleInputChange}
              options={[
                { value: "Fixed", label: "Fixed" },
                { value: "Fat/SNF", label: "Fat/SNF" },
              ]}
            />
            <SelectField
              label="Unit"
              name="unit"
              value={form.unit}
              onChange={handleInputChange}
              options={[
                { value: "Liter", label: "Liter" },
                { value: "Kg", label: "Kg" },
              ]}
            />
            <SelectField
              label="Shift"
              name="shift"
              value={form.shift}
              onChange={handleInputChange}
              options={[
                { value: "Morning", label: "Morning" },
                { value: "Evening", label: "Evening" },
                { value: "Both", label: "Both" },
              ]}
            />
            <InputField
              label="Default Rate"
              name="defaultRate"
              type="number"
              value={form.defaultRate}
              onChange={handleInputChange}
              placeholder="e.g. 32.5"
            />
          </CenterFormSection>

          <CenterFormSection title="Payment & Access">
            <SelectField
              label="Payment Cycle"
              name="paymentCycle"
              value={form.paymentCycle}
              onChange={handleInputChange}
              options={[
                { value: "Daily", label: "Daily" },
                { value: "Weekly", label: "Weekly" },
                { value: "Monthly", label: "Monthly" },
              ]}
            />
            <SelectField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleInputChange}
              options={[
                { value: "Active", label: "Active" },
                { value: "Suspended", label: "Suspended" },
              ]}
            />
            <InputField
              required
              label="Admin Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
            />
            <CheckboxChipGroup
              label="Payment Modes"
              options={paymentModes}
              selected={form.paymentMode}
              onToggle={handlePaymentModeChange}
            />
          </CenterFormSection>

          <SystemTrackingCard
            createdBy={currentSuperAdminId}
            createdAt={now}
            updatedAt={now}
          />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:shadow-green-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Add Center"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCenter;
