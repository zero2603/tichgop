"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { saveAdditionalAmounts, saveAvailableBalance, saveSavingsAndSnapshot, settleSavingsItem } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { GroupedItems, Item } from "@/lib/types";
import { MoneyInput } from "@/components/MoneyInput";

type EntryStep = "balance" | "additions" | "savings";
type DraftRow = {
  key: number;
};

function StepShell({
  title,
  note,
  children
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-[calc(100svh-2.5rem)] flex-col rounded-lg border border-white/55 bg-white/82 p-5 shadow-[0_18px_50px_rgb(31_41_51_/_12%)] backdrop-blur-md">
      <h1 className="text-2xl font-semibold leading-snug text-ink">{title}</h1>
      {note ? <p className="mt-2 text-sm font-medium text-ink/55">{note}</p> : null}
      {children}
    </section>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 min-w-28 items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-100/95 px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-wait disabled:opacity-75 disabled:hover:bg-amber-100/95"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-ink/25 border-t-ink"
          aria-hidden="true"
        />
      ) : null}
      <span>{pending ? "Đang lưu..." : label}</span>
    </button>
  );
}

function ItemEditor({
  action,
  items,
  submitLabel,
  emptyLabel,
  backHref,
  confirmRefundOnDelete = false,
  allowSettlement = false
}: {
  action: (formData: FormData) => void;
  items: Item[];
  submitLabel: string;
  emptyLabel: string;
  backHref: string;
  confirmRefundOnDelete?: boolean;
  allowSettlement?: boolean;
}) {
  const [visibleIds, setVisibleIds] = useState(() => items.map((item) => item.id));
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [refundDeletedIds, setRefundDeletedIds] = useState<string[]>([]);
  const [settlingItem, setSettlingItem] = useState<Item | null>(null);
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
          <div className="grid gap-2" key={item.id}>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.78fr)_2.75rem] items-center gap-2">
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
              {allowSettlement ? (
                <div className="flex h-12 w-11 flex-col overflow-hidden rounded-md border border-ink/25 bg-white/90">
                  <button
                    className="grid flex-1 place-items-center border-b border-ink/15 text-brick transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-200"
                    type="button"
                    onClick={() => removeExisting(item.id)}
                    aria-label={`Xóa ${item.name}`}
                    title="Xóa khoản"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
                      <path d="M5 5l14 14M19 5L5 19" />
                    </svg>
                  </button>
                  <button
                    className="grid flex-1 place-items-center text-sky transition hover:bg-sky/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky/30"
                    type="button"
                    onClick={() => setSettlingItem(item)}
                    aria-label={`Tất toán ${item.name}`}
                    title="Tất toán"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
                      <path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  className="inline-grid min-h-12 w-11 place-items-center rounded-md border border-red-200 bg-white/90 text-sm font-bold text-brick transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                  type="button"
                  onClick={() => removeExisting(item.id)}
                  aria-label="Xóa khoản"
                >
                  X
                </button>
              )}
            </div>
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

      {settlingItem ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/30 p-5" role="presentation">
          <div className="w-full max-w-sm rounded-lg border border-white/55 bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="settlement-title">
            <h2 id="settlement-title" className="text-lg font-semibold text-ink">Tất toán {settlingItem.name}</h2>
            <p className="mt-1 text-sm text-ink/60">Nhập số tiền cuối cùng nhận được.</p>
            <input type="hidden" name="settlement_item_id" value={settlingItem.id} />
            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-medium text-ink/75">Số tiền tất toán</span>
              <MoneyInput
                name="settlement_amount"
                defaultValue={settlingItem.amount}
                className="min-h-12 w-full rounded-md border border-ink/35 bg-white px-3 py-2 text-right text-base outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                aria-label={`Số tiền tất toán ${settlingItem.name}`}
                required
                autoFocus
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="min-h-10 rounded-md px-3 text-sm font-semibold text-ink/65 transition hover:bg-ink/5"
                type="button"
                onClick={() => setSettlingItem(null)}
              >
                Huỷ
              </button>
              <button
                className="min-h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                type="submit"
                formAction={settleSavingsItem}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function AdditionsEditor() {
  const [rows, setRows] = useState<DraftRow[]>(() => [{ key: Date.now() }]);

  function removeRow(key: number) {
    setRows((currentRows) => currentRows.filter((row) => row.key !== key));
  }

  return (
    <form action={saveAdditionalAmounts} className="flex min-h-0 flex-1 flex-col">
      <div className="mt-5 grid gap-3">
        {rows.map((row) => (
          <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-2" key={row.key}>
            <MoneyInput
              name="addition_amount"
              className="min-h-12 min-w-0 rounded-md border border-ink/35 bg-white/92 px-3 py-2 text-right text-base outline-none transition focus:border-sky focus:ring-2 focus:ring-sky/20"
              aria-label="Số tiền tăng thêm"
              autoFocus={rows.length === 1}
            />
            <button
              className="inline-grid min-h-12 w-11 place-items-center rounded-md border border-red-200 bg-white/90 text-sm font-bold text-brick transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              onClick={() => removeRow(row.key)}
              disabled={rows.length === 1}
              aria-label="Xóa khoản tăng thêm"
            >
              X
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50/95 px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          type="button"
          onClick={() => setRows((currentRows) => [...currentRows, { key: Date.now() + currentRows.length }])}
        >
          Thêm khoản
        </button>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-8">
        <Link
          className="inline-flex min-h-12 min-w-28 items-center justify-center rounded-md border border-ink/20 bg-white/75 px-5 py-2 text-sm font-semibold text-ink/75 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky/30"
          href="/entry?step=balance"
        >
          Quay lại
        </Link>
        <SubmitButton label="Tiếp" />
      </div>
    </form>
  );
}

export function EntryFlow({ grouped, step }: { grouped: GroupedItems; step: EntryStep }) {
  if (step === "balance") {
    return (
      <StepShell title="Nhập số dư khả dụng hiện tại" note="Đơn vị nhập: nghìn VND. Ví dụ: nhập 10 = 10.000 VND.">
        <form action={saveAvailableBalance} className="flex flex-1 flex-col">
          <label className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 text-sm font-medium text-ink/75">
            <MoneyInput
              name="available_amount"
              defaultValue={grouped.available?.amount ?? ""}
              className="min-h-12 min-w-0 border-0 border-b border-ink/80 rounded-none bg-transparent px-1 pb-2 text-right text-xl outline-none transition focus:border-sky"
              aria-label="Số dư khả dụng hiện tại"
              required
              autoFocus
            />
            <span>nghìn VND</span>
          </label>
          <div className="mt-auto flex items-center justify-end gap-2 pt-8">
            <Link
              className="inline-flex min-h-12 min-w-28 items-center justify-center rounded-md border border-ink/20 bg-white/75 px-5 py-2 text-sm font-semibold text-ink/75 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky/30"
              href="/"
            >
              Quay lại
            </Link>
            <SubmitButton label="Tiếp" />
          </div>
        </form>
      </StepShell>
    );
  }

  if (step === "additions") {
    return (
      <StepShell title="Các khoản tăng thêm" note="Đơn vị nhập: nghìn VND. Ví dụ: nhập 10 = 10.000 VND.">
        <AdditionsEditor />
      </StepShell>
    );
  }

  return (
    <StepShell title="Các khoản đầu tư & tiết kiệm" note="Đơn vị nhập: nghìn VND. Ví dụ: nhập 10 = 10.000 VND.">
      <ItemEditor
        action={saveSavingsAndSnapshot}
        items={grouped.savings}
        submitLabel="Chốt sổ"
        emptyLabel="Chưa có khoản đầu tư hoặc tiết kiệm."
        backHref="/entry?step=additions"
        confirmRefundOnDelete
        allowSettlement
      />
      <p className="mt-4 text-center text-xs text-ink/55">
        Tổng hiện tại: {formatMoney([grouped.available, ...grouped.savings].filter(Boolean).reduce((sum, item) => sum + (item?.amount ?? 0), 0))} VND
      </p>
    </StepShell>
  );
}
