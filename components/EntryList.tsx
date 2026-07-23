"use client";

import { useState } from "react";
import { commitAllRegularItems } from "@/lib/actions";
import { Button } from "@/components/Button";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemRow } from "@/components/ItemRow";
import { SavingsForm } from "@/components/SavingsForm";
import { SavingsRow } from "@/components/SavingsRow";
import type { GroupedItems } from "@/lib/types";
import { MoneyInput } from "@/components/MoneyInput";

export function EntryList({ grouped }: { grouped: GroupedItems }) {
  const [newRows, setNewRows] = useState<number[]>([]);

  return (
    <section className="entry-sheet">
      <div className="entry-actions">
        <SavingsForm regularItems={grouped.regular} />
        <AddItemForm onAdd={() => setNewRows((rows) => [...rows, Date.now()])} />
      </div>
      <form action={commitAllRegularItems} className="border-y border-line">
        {grouped.regular.length === 0 && newRows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink/60">Chưa có khoản nào.</p>
        ) : null}
        {grouped.regular.map((item) => <ItemRow key={item.id} item={item} />)}
        {newRows.map((rowId) => (
          <div key={rowId} className="entry-row grid gap-2 border-b border-line px-5 py-3 sm:grid-cols-[1fr_120px] sm:items-center">
            <input type="hidden" name="new_row" value={rowId} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/70">Tên khoản</span>
              <input name="new_name" className="entry-input rounded-md border border-ink bg-white px-3 py-2 outline-none focus:border-sky" autoFocus />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/70">Số tiền</span>
              <MoneyInput name="new_amount" className="entry-input rounded-md border border-ink bg-white px-3 py-2 text-right outline-none focus:border-sky" />
            </label>
          </div>
        ))}
        {grouped.savings.map((item) => <SavingsRow key={item.id} item={item} />)}
        <div className="flex justify-center border-t border-line px-5 py-4">
          <Button type="submit" disabled={grouped.regular.length === 0 && newRows.length === 0}>Chốt sổ</Button>
        </div>
      </form>
    </section>
  );
}
