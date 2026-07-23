"use client";

import { useState } from "react";
import { createSavings } from "@/lib/actions";
import type { Item } from "@/lib/types";
import { Button } from "@/components/Button";
import { MoneyInput } from "@/components/MoneyInput";

export function SavingsForm({ regularItems }: { regularItems: Item[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" tone="savings" onClick={() => setOpen(true)} disabled={regularItems.length === 0}>
        Tiết kiệm
      </Button>
      {open ? (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form action={createSavings} className="dialog-panel" onSubmit={() => setOpen(false)}>
            <h2 className="text-2xl font-semibold text-center">Thêm khoản tiết kiệm</h2>
            <input type="hidden" name="source_item_id" value={regularItems[0]?.id ?? ""} />
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px]">
              <label className="block">
                <span className="mb-1 block text-sm text-ink/80">Tên khoản</span>
                <input name="new_savings_name" className="entry-input rounded-md border border-ink bg-white px-3 py-2 outline-none focus:border-sky" required autoFocus />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-ink/80">Số tiền</span>
                <MoneyInput name="amount" minLength={1} className="entry-input rounded-md border border-ink bg-white px-3 py-2 text-right outline-none focus:border-sky" required />
              </label>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button type="button" tone="secondary" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button type="submit">Thêm khoản</Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
