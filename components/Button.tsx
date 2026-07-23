import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "savings";
};

export function Button({ className = "", tone = "primary", ...props }: ButtonProps) {
  const toneClass =
    tone === "primary"
      ? "bg-ink text-white hover:bg-moss"
      : tone === "savings"
        ? "border border-[#9d70ae] bg-[#e9dff0] text-ink hover:bg-[#dfd0e8]"
        : "border border-line bg-white text-ink hover:bg-paper";

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${toneClass} ${className}`}
      {...props}
    />
  );
}
