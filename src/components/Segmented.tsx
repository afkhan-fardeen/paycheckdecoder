"use client";

import { useId, useRef, type KeyboardEvent } from "react";

interface Props<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Radio group drawn as buttons. Selected is inverted (ink fill), so selection never relies on color alone. */
export function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  const group = useRef<HTMLDivElement>(null);
  const labelId = `seg-${useId()}`; // unique per control: two groups may share a label on one page

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = options[(i + step + options.length) % options.length];
    onChange(next.value);
    requestAnimationFrame(() => {
      group.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    });
  }

  return (
    <div className="pd-field">
      <span className="pd-label" id={labelId}>
        {label}
      </span>
      <div
        className="pd-seg"
        data-n={options.length}
        role="radiogroup"
        aria-labelledby={labelId}
        ref={group}
        onKeyDown={onKeyDown}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={o.value === value ? 0 : -1}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
