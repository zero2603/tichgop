import { EntryFlow } from "@/components/EntryFlow";
import { SetupNotice } from "@/components/SetupNotice";
import { getItemsGrouped } from "@/lib/actions";
import { hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const steps = ["balance", "additions", "savings"] as const;

type EntryStep = (typeof steps)[number];

function normalizeStep(value: string | string[] | undefined): EntryStep {
  const step = Array.isArray(value) ? value[0] : value;
  return steps.includes(step as EntryStep) ? (step as EntryStep) : "balance";
}

export default async function EntryPage({
  searchParams
}: {
  searchParams?: { step?: string | string[] };
}) {
  const configured = hasSupabaseEnv();
  const grouped = configured ? await getItemsGrouped() : { available: null, regular: [], savings: [] };
  const step = normalizeStep(searchParams?.step);

  return (
    <div className="flex min-h-[calc(100svh-2.5rem)] flex-col">
      {!configured ? <SetupNotice /> : null}
      <EntryFlow grouped={grouped} step={step} />
    </div>
  );
}
