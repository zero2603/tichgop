import { formatMoney } from "@/lib/format";

export function TotalCard({ total }: { total: number }) {
  return (
    <section className="border-b border-line pb-6">
      <p className="text-sm font-medium uppercase tracking-wide text-moss">Tổng tài sản</p>
      <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
        <h1 className="text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
          {formatMoney(total)}
        </h1>
        <span className="pb-2 text-lg text-ink/60">VND</span>
      </div>
    </section>
  );
}
