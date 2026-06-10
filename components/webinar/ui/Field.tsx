"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

const inputBase =
  "w-full rounded-msc border bg-white px-4 py-3 text-base text-ink font-body " +
  "placeholder:text-ink/40 transition-colors min-h-[48px] " +
  "focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-emerald";

function Wrapper({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink/80">
        {label}
        {required && <span className="ml-0.5 text-emerald-dark">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, required, ...rest }: TextFieldProps) {
  const fieldId = id || rest.name || label;
  return (
    <Wrapper label={label} htmlFor={fieldId!} error={error} required={required}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`${inputBase} ${error ? "border-red-400" : "border-ink/15"}`}
        {...rest}
      />
    </Wrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({
  label,
  error,
  id,
  required,
  options,
  placeholder,
  ...rest
}: SelectFieldProps) {
  const fieldId = id || rest.name || label;
  return (
    <Wrapper label={label} htmlFor={fieldId!} error={error} required={required}>
      <select
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`${inputBase} appearance-none ${
          error ? "border-red-400" : "border-ink/15"
        }`}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}
