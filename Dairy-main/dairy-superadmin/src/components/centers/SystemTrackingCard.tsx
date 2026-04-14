import React from "react";

type SystemTrackingCardProps = {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const SystemTrackingCard: React.FC<SystemTrackingCardProps> = ({
  createdBy,
  createdAt,
  updatedAt,
}) => {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-base font-semibold text-slate-800">System Tracking (Auto)</h2>
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <div>
          <p className="text-slate-500">Created By (Super Admin ID)</p>
          <p className="font-medium text-slate-700">{createdBy}</p>
        </div>
        <div>
          <p className="text-slate-500">Created Date & Time</p>
          <p className="font-medium text-slate-700">{createdAt}</p>
        </div>
        <div>
          <p className="text-slate-500">Last Updated Date</p>
          <p className="font-medium text-slate-700">{updatedAt}</p>
        </div>
      </div>
    </section>
  );
};

export default SystemTrackingCard;
