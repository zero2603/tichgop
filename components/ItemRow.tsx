import type { Item } from "@/lib/types";
import { MoneyInput } from "@/components/MoneyInput";

export function ItemRow({ item }: { item: Item }) {
  return (
    <div className="entry-row grid gap-2 border-b border-line px-5 py-3 last:border-b-0 sm:grid-cols-[1fr_120px] sm:items-center">
      <input type="hidden" name="item_id" value={item.id} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/70">Tên khoản</span>
        <input
          name={`name_${item.id}`}
          defaultValue={item.name}
          className="entry-input rounded-md border border-ink bg-white px-3 py-2 outline-none focus:border-sky"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/70">Số tiền</span>
        <MoneyInput
          name={`amount_${item.id}`}
          defaultValue={item.amount}
          className="entry-input rounded-md border border-ink bg-white px-3 py-2 text-right outline-none focus:border-sky"
          required
        />
      </label>
    </div>
  );
}
