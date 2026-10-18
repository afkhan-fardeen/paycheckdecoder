"use client";

import { CircleAlert } from "lucide-react";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  help?: string;
  error?: string;
  placeholder?: string;
}

export function Field({ id, label, value, onChange, prefix, suffix, help, error, placeholder }: Props) {
  const describedBy =
    [help ? `${id}-help` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`pd-field${error ? " is-error" : ""}`}>
      <label className="pd-label" htmlFor={id}>
        {label}
      </label>
      <div className="pd-control">
        {prefix ? <span className="pd-affix">{prefix}</span> : null}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? <span className="pd-affix">{suffix}</span> : null}
      </div>
      {help ? (
        <span className="pd-help" id={`${id}-help`}>
          {help}
        </span>
      ) : null}
      {error ? (
        <div className="pd-error" id={`${id}-err`}>
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <b>Error:</b> {error}
          </span>
        </div>
      ) : null}
    </div>
  );
}
