import React from "react";

type CenterFormSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const CenterFormSection: React.FC<CenterFormSectionProps> = ({
  title,
  children,
  className = "grid grid-cols-1 gap-4 md:grid-cols-2",
}) => {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className={className}>{children}</div>
    </section>
  );
};

export default CenterFormSection;
