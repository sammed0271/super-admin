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

// ✅ REAL API (replace fake api)
import {
  getCenterById,
  updateCenter,
  toggleCenter,
} from "../../axios/center_api";

const paymentModes = ["Cash", "UPI", "Bank"] as const;

const CenterEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [center, setCenter] = useState<any>(null);
  const [form, setForm] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 🔥 FETCH CENTER FROM BACKEND
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        setIsLoading(true);
        const data = await getCenterById(id!);

        setCenter(data);

        // 🔹 MAP BACKEND → FORM
        setForm({
          dairyCode: data.code || "",
          dairyName: data.name,
          managerName: data.ownerName,
          mobile: data.mobile,

          village: data.village,
          taluka: data.taluka,
          district: data.district,
          state: data.state,
          pincode: data.pincode,
          fullAddress: data.address,

          milkType: data.milkType?.toUpperCase(),
          rateType:
            data.rateType === "fixed" ? "Fixed" : "Fat/SNF",
          unit: data.unit?.toUpperCase(),
          shift: data.shift?.toUpperCase(),

          defaultRate: data.defaultRate?.toString() || "",

          paymentCycle: data.paymentCycle?.toUpperCase(),
          paymentMode: [data.paymentMode?.toUpperCase()],

          password: "",
          status: data.status,
        });

      } catch {
        setError("Failed to load center");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCenter();
  }, [id]);

  // 🔹 INPUT HANDLER
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  // 🔹 PAYMENT MODE TOGGLE
  const handlePaymentModeChange = (mode: string) => {
    setForm((prev: any) => {
      const exists = prev.paymentMode.includes(mode);
      const next = exists
        ? prev.paymentMode.filter((m: string) => m !== mode)
        : [...prev.paymentMode, mode];

      return {
        ...prev,
        paymentMode: next.length ? next : ["Cash"],
      };
    });
  };

  // 🔥 BUILD BACKEND PAYLOAD
  const buildPayload = () => {
    return {
      name: form.dairyName,
      code: form.dairyCode,
      ownerName: form.managerName,
      mobile: form.mobile,

      village: form.village,
      taluka: form.taluka,
      district: form.district,
      state: form.state,
      address: form.fullAddress,
      pincode: form.pincode,

      milkType: form.milkType.toLowerCase(),
      rateType:
        form.rateType === "Fixed" ? "fixed" : "fat_snf",
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

  // 🔥 SAVE
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = buildPayload();

      await updateCenter(center._id, payload);

      setSuccess("Center updated successfully");

    } catch {
      setError("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔥 TOGGLE / DELETE
  const handleDelete = async () => {
    if (!center) return;

    const confirm = window.confirm("Disable this center?");
    if (!confirm) return;

    setIsDeleting(true);

    try {
      await toggleCenter(center._id);
      navigate("/centers");
    } catch {
      setError("Failed to update status");
      setIsDeleting(false);
    }
  };

  // 🔄 LOADING
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!form) return null;

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        <h1 className="text-2xl font-bold text-slate-800">
          Center Details & Edit
        </h1>

        <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl">

          {/* BASIC */}
          <CenterFormSection title="Basic Details">
            <InputField label="Dairy Code" name="dairyCode" value={form.dairyCode} onChange={handleInputChange} />
            <InputField label="Dairy Name" name="dairyName" value={form.dairyName} onChange={handleInputChange} />
            <InputField label="Manager Name" name="managerName" value={form.managerName} onChange={handleInputChange} />
            <InputField label="Mobile" name="mobile" value={form.mobile} onChange={handleInputChange} />
          </CenterFormSection>

          {/* LOCATION */}
          <CenterFormSection title="Location">
            <InputField label="Village" name="village" value={form.village} onChange={handleInputChange} />
            <InputField label="District" name="district" value={form.district} onChange={handleInputChange} />
            <TextAreaField label="Address" name="fullAddress" value={form.fullAddress} onChange={handleInputChange} />
          </CenterFormSection>

          {/* CONFIG */}
          <CenterFormSection title="Configuration">
            <SelectField label="Milk Type" name="milkType" value={form.milkType} onChange={handleInputChange} options={[
              { value: "Cow", label: "Cow" },
              { value: "Buffalo", label: "Buffalo" },
              { value: "Mix", label: "Mix" }
            ]} />
          </CenterFormSection>

          {/* PASSWORD */}
          <InputField label="Reset Password" name="password" type="password" value={form.password} onChange={handleInputChange} />

          <CenterFormSection title="Payment & Access">
            <InputField required label="Admin Password" name="password" type="password" value={form.password} onChange={handleInputChange} />
            <CheckboxChipGroup label="Payment Modes" options={paymentModes} selected={form.paymentMode as (typeof paymentModes)[number][]} onToggle={handlePaymentModeChange} />
          </CenterFormSection>
          {/* STATUS */}
          <SelectField label="Status" name="status" value={form.status} onChange={handleInputChange} options={[
            { value: "Active", label: "Active" },
            { value: "Suspended", label: "Suspended" }
          ]} />

          {/* SYSTEM */}
          <SystemTrackingCard
            createdBy={center.createdBy}
            createdAt={center.createdAt}
            updatedAt={center.updatedAt}
          />

          {/* MESSAGES */}
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}

          {/* ACTIONS */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600"
            >
              {isDeleting ? "Processing..." : "Disable Center"}
            </button>

            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CenterEditPage;