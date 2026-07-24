"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

const THOUSAND = 1_000;

type MoneyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type"> & {
  defaultValue?: number | string;
};

function displayValue(value: number | string | undefined) {
  if (value === undefined || value === "") {
    return "";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? formatMoney(amount / THOUSAND) : "";
}

export function MoneyInput({ defaultValue, ...props }: MoneyInputProps) {
  const [value, setValue] = useState(displayValue(defaultValue));

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(event) => {
        const digits = event.target.value.replace(/[^0-9]/g, "");
        setValue(digits ? formatMoney(Number(digits)) : "");
      }}
    />
  );
}
