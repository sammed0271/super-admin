import React from "react";

const baseInputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500";

type FormFieldWrapperProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  children,
  className,
}) => {
  return (
    <label className={`space-y-1 text-sm text-slate-700 ${className ?? ""}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
};

type BaseFieldProps = {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  className?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
};

type InputFieldProps = BaseFieldProps & {
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  required,
  onChange,
  type = "text",
  placeholder,
  className,
}) => {
  return (
    <FormFieldWrapper label={label} className={className}>
      <input
        required={required}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={baseInputClassName}
        placeholder={placeholder}
      />
    </FormFieldWrapper>
  );
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = BaseFieldProps & {
  options: SelectOption[];
};

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  required,
  onChange,
  options,
  className,
}) => {
  return (
    <FormFieldWrapper label={label} className={className}>
      <select
        required={required}
        name={name}
        value={value}
        onChange={onChange}
        className={baseInputClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormFieldWrapper>
  );
};

type TextAreaFieldProps = BaseFieldProps & {
  rows?: number;
};

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  required,
  onChange,
  rows = 2,
  className,
}) => {
  return (
    <FormFieldWrapper label={label} className={className}>
      <textarea
        required={required}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className={baseInputClassName}
      />
    </FormFieldWrapper>
  );
};

type CheckboxChipGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T[];
  onToggle: (option: T) => void;
};

export const CheckboxChipGroup = <T extends string>({
  label,
  options,
  selected,
  onToggle,
}: CheckboxChipGroupProps<T>) => {
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <span className="block">{label}</span>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label
            key={option}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
