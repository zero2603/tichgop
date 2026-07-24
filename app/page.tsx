import Link from "next/link";
import { BalanceChart } from "@/components/BalanceChart";
import { SetupNotice } from "@/components/SetupNotice";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getBalanceHistory, getItemsGrouped, getTotal } from "@/lib/actions";
import { hasSupabaseEnv } from "@/lib/supabase";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = hasSupabaseEnv();
  const [grouped, total, history] = configured
    ? await Promise.all([getItemsGrouped(), getTotal(), getBalanceHistory()])
    : [{ available: null, regular: [], savings: [] }, 0, []];

  const allItems = [grouped.available, ...grouped.savings].filter(
    (item): item is Item => Boolean(item)
  );
  const lastTotalUpdate = history.at(-1)?.snapshot_at;

  return (
    <div className="flex min-h-[calc(100svh-2.5rem)] flex-col gap-4">
      {!configured ? <SetupNotice /> : null}

      <section className="flex flex-col rounded-lg border border-white/55 bg-white/78 p-5 shadow-[0_18px_50px_rgb(31_41_51_/_12%)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-ink/80">Tổng tiết kiệm</h1>
          <Link
            href="/entry?step=balance"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50/95 px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Cập nhật
          </Link>
        </div>
        <div className="mt-4 flex gap-3 items-stretch">
          <h1 className="text-4xl font-semibold leading-tight tracking-normal text-ink">
            {formatMoney(total)}
          </h1>
          <div className="text-base font-semibold">VND</div>
        </div>

        {lastTotalUpdate ? (
          <p className="mt-2 text-sm font-medium text-ink/55">
            Cập nhật lần cuối: {formatDateTime(lastTotalUpdate)}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-white/55 bg-white/78 px-4 shadow-[0_12px_36px_rgb(31_41_51_/_10%)] backdrop-blur-md">
        {allItems.length === 0 ? (
          <p className="py-5 text-sm text-ink/60">Chưa có dữ liệu.</p>
        ) : (
          allItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line/80 py-4 text-sm last:border-b-0">
              <div className="min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {item.type === "available"
                    ? "Số dư khả dụng"
                    : "Đầu tư & tiết kiệm"}
                </p>
              </div>
              <p className="max-w-[9rem] text-right font-semibold leading-snug">{formatMoney(item.amount)} VND</p>
            </div>
          ))
        )}
      </section>

      <section className="rounded-lg border border-white/55 bg-white/78 p-4 shadow-[0_12px_36px_rgb(31_41_51_/_10%)] backdrop-blur-md">
        <h2 className="text-lg font-semibold">Lịch sử tổng</h2>
        <BalanceChart history={history} />
      </section>
    </div>
  );
}
