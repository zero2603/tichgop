"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveAvailableBalance, saveRegularItems, saveSavingsAndSnapshot } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { GroupedItems, Item } from "@/lib/types";
import { MoneyInput } from "@/components/MoneyInput";

type EntryStep = "balance" | "additions" | "savings";
type DraftRow = {
  key: number;
};

function StepShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-[calc(100svh-2.5rem)] flex-col rounded-lg border border-white/55 bg-white/82 p-5 shadow-[0_18px_50px_rgb(31_41_51_/_12%)] backdrop-blur-md">
      <h1 className="text-2xl font-semibold leading-snug text-ink">{title}</h1>
      {children}
    </section>
  );
}

function ItemEditor({
  action,
  items,
  submitLabel,
  emptyLabel,
  backHref,
  confirmRefundOnDelete = false
}: {
  action: (formData: FormData) => void;
  items: Item[];
  submitLabel: string;
  emptyLabel: string;
  backHref: string;
  confirmRefundOnDelete?: boolean;
}) {
  const [visibleIds, setVisibleIds] = useState(() => items.map((item) => item.id));
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [refundDeletedIds, setRefundDeletedIds] = useState<string[]>([]);
  const [newRows, setNewRows] = useState<DraftRow[]>(() => (items.length === 0 ? [{ key: Date.now() }] : []));
  const visibleItems = useMemo(
    () => items.filter((item) => visibleIds.includes(item.id)),
    [items, visibleIds]
  );

  function removeExisting(id: string) {
    const shouldRefund =
      confirmRefundOnDelete &&
      window.confirm('Bạn có muốn chuyển số tiền này về "Số dư khả dụng" không?');

    setVisibleIds((ids) => ids.filter((itemId) => itemId !== id));
    setDeletedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setRefundDeletedIds((ids) => {
      if (shouldRefund) {
        return ids.includes(id) ? ids : [...ids, id];
      }
      return ids.filter((itemId) => itemId !== id);
    });
  }

  function removeDraft(key: number) {
    setNewRows((rows) => rows.filter((row) => row.key !== key));
  }

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <div className="mt-5 grid gap-3">
        {visibleItems.length === 0 && newRows.length === 0 ? (
          <p className="py-4 text-sm text-ink/60">{emptyLabel}</p>
        ) : null}

        {visibleItems.map((item) => (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.78fr)_2.75rem] items-center gap-2" key={item.id}>
            <input type="hidden" name="item_id" value={item.id} />
            <input
              name={`name_${item.id}`}
              defaultValue={item.name}
              className="min-h-12 min-w-0 rounded-md border border-ink/35 bg-white/92 px-3 py-2 text-base outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"
              aria-label="Tên khoản"
              required
            />
            <MoneyInput
              name={`amount_${item.id}`}
              defaultValue={item.amount}
              className="min-h-12 min-w-0 rounded-md border border-ink/35 bg-white/92 px-3 py-2 text-right text-base outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"
              aria-label="Số tiền"
              required
            />
            <button
              className="inline-grid min-h-12 w-11 place-items-center rounded-md border border-red-200 bg-white/90 text-sm font-bold text-brick transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
              type="button"
              onClick={() => removeExisting(item.id)}
              aria-label="Xóa khoản"
            >
              X
            </button>
          </div>
        ))}

        {newRows.map((row) => (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.78fr)_2.75rem] items-center gap-2" key={row.key}>
            <input type="hidden" name="new_row" value={row.key} />
            <input
              name="new_name"
              className="min-h-12 min-w-0 rounded-md border border-ink/35 bg-white/92 px-3 py-2 text-base outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"
              aria-label="Tên khoản mới"
              autoFocus
            />
            <MoneyInput
              name="new_amount"
              className="min-h-12 min-w-0 rounded-md border border-ink/35 bg-white/92 px-3 py-2 text-right text-base outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"
              aria-label="Số tiền mới"
            />
            <button
              className="inline-grid min-h-12 w-11 place-items-center rounded-md border border-red-200 bg-white/90 text-sm font-bold text-brick transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
              type="button"
              onClick={() => removeDraft(row.key)}
              aria-label="Xóa khoản mới"
            >
              X
            </button>
          </div>
        ))}
      </div>

      {deletedIds.map((id) => (
        <input key={id} type="hidden" name="deleted_item_id" value={id} />
      ))}

      {refundDeletedIds.map((id) => (
        <input key={id} type="hidden" name="refund_deleted_item_id" value={id} />
      ))}

      <div className="flex justify-end pt-4">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50/95 px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          type="button"
          onClick={() => setNewRows((rows) => [...rows, { key: Date.now() + rows.length }])}
        >
          Thêm khoản
        </button>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-8">
        <Link
          className="inline-flex min-h-12 min-w-28 items-center justify-center rounded-md border border-ink/20 bg-white/75 px-5 py-2 text-sm font-semibold text-ink/75 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky/30"
          href={backHref}
        >
          Quay lại
        </Link>
        <button
          className="inline-flex min-h-12 min-w-28 items-center justify-center rounded-md border border-amber-300 bg-amber-100/95 px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
          type="submit"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function EntryFlow({ grouped, step }: { grouped: GroupedItems; step: EntryStep }) {
  if (step === "balance") {
    return (
      <StepShell title="Nhập số dư khả dụng hiện tại">
        <form action={saveAvailableBalance} className="flex flex-1 flex-col">
          <label className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 text-sm font-medium text-ink/75">
            <MoneyInput
              name="available_amount"
              defaultValue={grouped.available?.amount ?? ""}
              className="min-h-12 min-w-0 border-0 border-b border-ink/80 bg-transparent px-1 pb-2 text-right text-xl outline-none transition focus:border-sky"
              aria-label="Số dư khả dụng hiện tại"
              required
              autoFocus
            />
            <span>VND</span>
          </label>
          <div className="mt-auto flex items-center justify-end gap-2 pt-8">
            <Link
              className="inline-flex min-h-12 min-w-28 items-center justify-center rounded-md border border-ink/20 bg-white/75 px-5 py-2 text-sm font-semibold text-ink/75 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky/30"
              href="/"
            >
              Quay lại
            </Link>
            <button
              className="inline-flex min-h-12 min-w-28 items-center justify-center rounded-md border border-amber-300 bg-amber-100/95 px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              type="submit"
            >
              Tiếp
            </button>
          </div>
        </form>
      </StepShell>
    );
  }

  if (step === "additions") {
    return (
      <StepShell title="Các khoản tăng thêm">
        <ItemEditor
          action={saveRegularItems}
          items={grouped.regular}
          submitLabel="Tiếp"
          emptyLabel="Chưa có khoản tăng thêm."
          backHref="/entry?step=balance"
        />
      </StepShell>
    );
  }

  return (
    <StepShell title="Các khoản đầu tư & tiết kiệm">
      <ItemEditor
        action={saveSavingsAndSnapshot}
        items={grouped.savings}
        submitLabel="Chốt sổ"
        emptyLabel="Chưa có khoản đầu tư hoặc tiết kiệm."
        backHref="/entry?step=additions"
        confirmRefundOnDelete
      />
      <p className="mt-4 text-center text-xs text-ink/55">
        Tổng hiện tại: {formatMoney([grouped.available, ...grouped.regular, ...grouped.savings].filter(Boolean).reduce((sum, item) => sum + (item?.amount ?? 0), 0))} VND
      </p>
    </StepShell>
  );
}
