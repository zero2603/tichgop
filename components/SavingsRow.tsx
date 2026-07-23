import type { Item } from "@/lib/types";
import { MoneyInput } from "@/components/MoneyInput";

export function SavingsRow({ item }: { item: Item }) {
  return (
    <div className="entry-row grid gap-2 border-b border-line px-5 py-3 last:border-b-0 sm:grid-cols-[1fr_120px_auto] sm:items-end">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/70">Tên khoản</span>
        <input className="entry-input rounded-md border border-ink bg-paper px-3 py-2 text-ink/65" value={item.name} disabled readOnly />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/70">Số tiền</span>
        <MoneyInput className="entry-input rounded-md border border-ink bg-paper px-3 py-2 text-right text-ink/65" defaultValue={item.amount} disabled readOnly />
      </label>
      <div aria-hidden="true" className="hidden h-10 sm:block" />
    </div>
  );
}
