import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CenterFormSection from "../../components/centers/CenterFormSection";
import {
  CheckboxChipGroup,
  InputField,
  SelectField,
  TextAreaField,
} from "../../components/centers/CenterFormFields";
import SystemTrackingCard from "../../components/centers/SystemTrackingCard";
import { api } from "../../services/api";
import type { Center } from "../../types/models";

const paymentModes = ["Cash", "UPI", "Bank"] as const;

type CenterEditForm = {
  dairyCode: string;
  dairyName: string;
  managerName: string;
  mobile: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  fullAddress: string;
  milkType: Center["config"]["milkType"];
  rateType: Center["config"]["rateType"];
  unit: Center["config"]["unit"];
  shift: Center["config"]["shift"];
  defaultRate: string;
  paymentCycle: Center["payment"]["cycle"];
  paymentMode: Center["payment"]["mode"];
  password: string;
  status: Center["auth"]["status"];
};

const buildFormFromCenter = (center: Center): CenterEditForm => ({
  dairyCode: center.dairyCode,
  dairyName: center.dairyName,
  managerName: center.managerName,
  mobile: center.mobile,
  village: center.location.village,
  taluka: center.location.taluka,
  district: center.location.district,
  state: center.location.state,
  pincode: center.location.pincode,
  fullAddress: center.location.fullAddress,
  milkType: center.config.milkType,
  rateType: center.config.rateType,
  unit: center.config.unit,
  shift: center.config.shift,
  defaultRate: center.config.defaultRate?.toString() ?? "",
  paymentCycle: center.payment.cycle,
  paymentMode: center.payment.mode,
  password: "",
  status: center.auth.status,
});

const CenterDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const [center, setCenter] = useState<Center | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CenterEditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stats for the top cards
  const [stats, setStats] = useState({ todaysCollection: "0", activeFarmers: "0" });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!params.id) return;
        const data = await api.getCenterById(params.id);
        if (data) {
          setCenter(data);
          setForm(buildFormFromCenter(data));

          // Fetch dynamic stats for this center
          const todayStr = new Date().toISOString().split("T")[0];
          const colls = await api.getCollections({ centerId: data.id, startDate: todayStr, endDate: todayStr });
          const todaysCollection = colls.reduce((sum, c) => sum + c.quantity, 0).toLocaleString();
          const activeFarmers = new Set(colls.map(c => c.farmerId)).size.toString();
          setStats({ todaysCollection, activeFarmers });
        } else {
          setError("Center not found in simulated database.");
        }
      } catch (err) {
        setError("Failed to fetch center data from database");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [params.id]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handlePaymentModeChange = (mode: (typeof paymentModes)[number]) => {
    setForm((prev) => {
      if (!prev) return prev;
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

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!center || !form) return;
    setActionError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const updatedCenter: Center = {
        ...center,
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
          latitude: center.location.latitude,
          longitude: center.location.longitude,
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
          ...center.auth,
          passwordHash: form.password.trim() || center.auth.passwordHash,
          status: form.status,
        },
        system: {
          ...center.system,
          updatedAt: new Date().toISOString(),
        },
      };

      await api.updateCenter(updatedCenter);
      setSuccessMessage("Center updated successfully.");
      setForm(buildFormFromCenter(updatedCenter));
      setCenter(updatedCenter);
    } catch {
      setActionError("Unable to update center. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!center) return;
    setActionError(null);
    const shouldDelete = window.confirm(`Delete "${center.dairyName}"?`);
    if (!shouldDelete) return;
    setIsDeleting(true);

    try {
      await api.deleteCenter(center.id);
      navigate("/centers");
    } catch {
      setActionError("Unable to delete center. Please try again.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full overflow-auto bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm animate-pulse">
          Loading center details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full overflow-auto bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!center || !form) {
    return (
      <div className="h-full w-full overflow-auto bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Center Not Found</h1>
          <p className="text-sm text-slate-500">The requested center does not exist.</p>
          <button
            type="button"
            onClick={() => navigate("/centers")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to Centers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Center Details & Edit</h1>
            <p className="text-sm text-slate-500">
              Review and update configuration, contact, and payment details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/centers")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 shadow-sm transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border-l-4 border-green-500">
            <p className="text-xs font-semibold uppercase text-slate-500">Today's Collection</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{stats.todaysCollection} L</p>
            <p className="mt-1 text-xs text-slate-500">From simulated api data</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border-l-4 border-blue-500">
            <p className="text-xs font-semibold uppercase text-slate-500">Active Farmers</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{stats.activeFarmers}</p>
            <p className="mt-1 text-xs text-slate-500">Delivered milk today</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border-l-4 border-orange-500">
            <p className="text-xs font-semibold uppercase text-slate-500">Billing Status</p>
            <p className="mt-1 text-2xl font-bold text-orange-700">{center.payment.cycle}</p>
            <p className="mt-1 text-xs text-slate-500">Last updated: {new Date(center.system.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
          <CenterFormSection title="Basic Details">
            <InputField
              required
              label="Dairy Code"
              name="dairyCode"
              value={form.dairyCode}
              onChange={handleInputChange}
            />
            <InputField
              required
              label="Dairy Name"
              name="dairyName"
              value={form.dairyName}
              onChange={handleInputChange}
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
            <InputField required label="Village" name="village" value={form.village} onChange={handleInputChange} />
            <InputField required label="Taluka" name="taluka" value={form.taluka} onChange={handleInputChange} />
            <InputField required label="District" name="district" value={form.district} onChange={handleInputChange} />
            <InputField required label="State" name="state" value={form.state} onChange={handleInputChange} />
            <InputField required label="Pincode" name="pincode" value={form.pincode} onChange={handleInputChange} />
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
              label="Reset Admin Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Leave blank to keep existing password"
            />
            <CheckboxChipGroup
              label="Payment Modes"
              options={paymentModes}
              selected={form.paymentMode}
              onToggle={handlePaymentModeChange}
            />
          </CenterFormSection>

          <SystemTrackingCard
            createdBy={center.system.createdBy}
            createdAt={center.system.createdAt}
            updatedAt={center.system.updatedAt}
          />

          {actionError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </p>
          )}

          {successMessage && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                void handleDelete();
              }}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 transition shadow-sm"
            >
              {isDeleting ? "Deleting..." : "Delete Center"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:shadow-green-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CenterDetailsPage;
