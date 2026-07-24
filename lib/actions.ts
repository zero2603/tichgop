"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase, hasSupabaseEnv } from "@/lib/supabase";
import type { BalancePoint, GroupedItems, Item } from "@/lib/types";

const INPUT_AMOUNT_UNIT = 1_000;

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value);
  }
  return 0;
}

function parseAmount(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replaceAll(" ", "");
  const normalized = raw.includes(",")
    ? raw.replaceAll(".", "").replace(",", ".")
    : raw.replaceAll(".", "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    throw new Error("Số tiền không hợp lệ");
  }
  return amount * INPUT_AMOUNT_UNIT;
}

function normalizeItem(row: {
  id: string;
  name: string;
  amount: string | number;
  type: "available" | "regular" | "savings";
}): Item {
  return {
    id: row.id,
    name: row.name,
    amount: toNumber(row.amount),
    type: row.type
  };
}

export async function getItemsGrouped(): Promise<GroupedItems> {
  if (!hasSupabaseEnv()) {
    return { available: null, regular: [], savings: [] };
  }

  const { data, error } = await getSupabase()
    .from("items")
    .select("id,name,amount,type")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map(normalizeItem);
  return {
    available: items.find((item) => item.type === "available") ?? null,
    regular: [],
    savings: items.filter((item) => item.type === "savings")
  };
}

export async function getTotal() {
  const grouped = await getItemsGrouped();
  return [grouped.available, ...grouped.savings]
    .filter((item): item is Item => Boolean(item))
    .reduce((sum, item) => sum + item.amount, 0);
}

export async function getBalanceHistory(): Promise<BalancePoint[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const { data, error } = await getSupabase()
    .from("balances")
    .select("total,snapshot_at")
    .order("snapshot_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ total: string | number; snapshot_at: string }>;

  return rows.map((row) => ({
    total: toNumber(row.total),
    snapshot_at: row.snapshot_at
  }));
}

export async function commitRegularItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const amount = parseAmount(formData.get("amount"));

  if (!id || !name) {
    throw new Error("Thiếu tên khoản hoặc mã khoản");
  }

  const { error } = await getSupabase().rpc("commit_regular_item", {
    item_id: id,
    new_name: name,
    new_amount: amount
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry");
}

export async function commitAllRegularItems(formData: FormData) {
  const itemIds = formData.getAll("item_id").map(String).filter(Boolean);

  for (const id of itemIds) {
    const name = String(formData.get(`name_${id}`) ?? "").trim();
    const amount = parseAmount(formData.get(`amount_${id}`));

    if (!name) {
      throw new Error("Tên khoản không được để trống");
    }

    const { error } = await getSupabase().rpc("commit_regular_item", {
      item_id: id,
      new_name: name,
      new_amount: amount
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const newNames = formData.getAll("new_name").map((value) => String(value).trim());
  const newAmounts = formData.getAll("new_amount").map((value) => String(value));

  for (let index = 0; index < newNames.length; index += 1) {
    const name = newNames[index];
    const rawAmount = newAmounts[index] ?? "";

    if (!name && !rawAmount.trim()) {
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (!name) {
      throw new Error("Tên khoản không được để trống");
    }

    const { error } = await getSupabase().from("items").insert({
      name,
      amount,
      type: "regular"
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry");
}

async function upsertAvailableBalance(amount: number) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("items")
    .select("id")
    .eq("type", "available")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id) {
    const { error: updateError } = await supabase
      .from("items")
      .update({ name: "Số dư khả dụng", amount })
      .eq("id", data.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  const { error: insertError } = await supabase.from("items").insert({
    name: "Số dư khả dụng",
    amount,
    type: "available"
  });

  if (insertError) {
    if (insertError.message.includes("items_type_check")) {
      throw new Error(
        "Database schema is out of date. Run supabase/migrations/202607230001_available_balance.sql so items.type accepts 'available'."
      );
    }
    throw new Error(insertError.message);
  }
}

async function getAvailableBalanceRecord() {
  const { data, error } = await getSupabase()
    .from("items")
    .select("id,amount")
    .eq("type", "available")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Chưa có Số dư khả dụng. Hãy nhập số dư khả dụng trước.");
  }

  return {
    id: data.id,
    amount: toNumber(data.amount)
  };
}

async function applySavingsDeltaToAvailable(delta: number) {
  if (delta === 0) {
    return;
  }

  const available = await getAvailableBalanceRecord();
  const nextAmount = available.amount - delta;

  if (nextAmount < 0) {
    throw new Error("Số dư khả dụng không đủ cho khoản đầu tư hoặc tiết kiệm này.");
  }

  const { error } = await getSupabase()
    .from("items")
    .update({ name: "Số dư khả dụng", amount: nextAmount })
    .eq("id", available.id)
    .eq("type", "available");

  if (error) {
    throw new Error(error.message);
  }
}

async function addToAvailableBalance(amount: number) {
  if (amount === 0) {
    return;
  }

  const available = await getAvailableBalanceRecord();

  const { error } = await getSupabase()
    .from("items")
    .update({ name: "Số dư khả dụng", amount: available.amount + amount })
    .eq("id", available.id)
    .eq("type", "available");

  if (error) {
    throw new Error(error.message);
  }
}

async function deleteAllRegularItems() {
  const { error } = await getSupabase().from("items").delete().eq("type", "regular");

  if (error) {
    throw new Error(error.message);
  }
}

async function deleteItems(ids: string[], type: "regular" | "savings") {
  if (ids.length === 0) {
    return;
  }

  const { error } = await getSupabase().from("items").delete().in("id", ids).eq("type", type);

  if (error) {
    throw new Error(error.message);
  }
}

async function saveItemGroup(formData: FormData, type: "regular" | "savings") {
  const supabase = getSupabase();
  const itemIds = formData.getAll("item_id").map(String).filter(Boolean);

  for (const id of itemIds) {
    const name = String(formData.get(`name_${id}`) ?? "").trim();
    const amount = parseAmount(formData.get(`amount_${id}`));

    if (!name) {
      throw new Error("Tên khoản không được để trống");
    }
    if (amount < 0) {
      throw new Error("Số tiền không được nhỏ hơn 0");
    }

    const { error } = await supabase
      .from("items")
      .update({ name, amount })
      .eq("id", id)
      .eq("type", type);

    if (error) {
      throw new Error(error.message);
    }
  }

  const newNames = formData.getAll("new_name").map((value) => String(value).trim());
  const newAmounts = formData.getAll("new_amount").map((value) => String(value));

  for (let index = 0; index < newNames.length; index += 1) {
    const name = newNames[index];
    const rawAmount = newAmounts[index] ?? "";

    if (!name && !rawAmount.trim()) {
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (!name) {
      throw new Error("Tên khoản không được để trống");
    }
    if (amount < 0) {
      throw new Error("Số tiền không được nhỏ hơn 0");
    }

    const { error } = await supabase.from("items").insert({
      name,
      amount,
      type
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await deleteItems(formData.getAll("deleted_item_id").map(String).filter(Boolean), type);
}

async function saveSavingsGroupAndAdjustAvailable(formData: FormData) {
  const supabase = getSupabase();
  const itemIds = formData.getAll("item_id").map(String).filter(Boolean);
  const deletedIds = formData.getAll("deleted_item_id").map(String).filter(Boolean);
  const refundDeletedIds = formData.getAll("refund_deleted_item_id").map(String).filter(Boolean);
  const referencedIds = Array.from(new Set([...itemIds, ...deletedIds]));
  const oldAmounts = new Map<string, number>();

  if (referencedIds.length > 0) {
    const { data, error } = await supabase
      .from("items")
      .select("id,amount")
      .in("id", referencedIds)
      .eq("type", "savings");

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      oldAmounts.set(row.id, toNumber(row.amount));
    }
  }

  let savingsDelta = 0;

  for (const id of itemIds) {
    const name = String(formData.get(`name_${id}`) ?? "").trim();
    const amount = parseAmount(formData.get(`amount_${id}`));

    if (!name) {
      throw new Error("Tên khoản không được để trống");
    }
    if (amount < 0) {
      throw new Error("Số tiền không được nhỏ hơn 0");
    }

    savingsDelta += amount - (oldAmounts.get(id) ?? 0);
  }

  const newNames = formData.getAll("new_name").map((value) => String(value).trim());
  const newAmounts = formData.getAll("new_amount").map((value) => String(value));

  for (let index = 0; index < newNames.length; index += 1) {
    const name = newNames[index];
    const rawAmount = newAmounts[index] ?? "";

    if (!name && !rawAmount.trim()) {
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (!name) {
      throw new Error("Tên khoản không được để trống");
    }
    if (amount < 0) {
      throw new Error("Số tiền không được nhỏ hơn 0");
    }

    savingsDelta += amount;
  }

  for (const id of refundDeletedIds) {
    savingsDelta -= oldAmounts.get(id) ?? 0;
  }

  await applySavingsDeltaToAvailable(savingsDelta);
  await saveItemGroup(formData, "savings");
}

export async function saveAvailableBalance(formData: FormData) {
  const amount = parseAmount(formData.get("available_amount"));

  if (amount < 0) {
    throw new Error("Số dư không được nhỏ hơn 0");
  }

  await upsertAvailableBalance(amount);

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry?step=additions");
}

export async function saveRegularItems(formData: FormData) {
  await saveItemGroup(formData, "regular");

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry?step=savings");
}

export async function saveAdditionalAmounts(formData: FormData) {
  const amounts = formData.getAll("addition_amount");
  let totalAddition = 0;

  for (const rawAmount of amounts) {
    if (!String(rawAmount).trim()) {
      continue;
    }

    const amount = parseAmount(rawAmount);
    if (amount < 0) {
      throw new Error("Số tiền không được nhỏ hơn 0");
    }

    totalAddition += amount;
  }

  await addToAvailableBalance(totalAddition);
  await deleteAllRegularItems();

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry?step=savings");
}

export async function saveSavingsAndSnapshot(formData: FormData) {
  await saveSavingsGroupAndAdjustAvailable(formData);

  const total = await getTotal();
  const { error } = await getSupabase().from("balances").insert({ total });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/");
}

export async function createSavings(formData: FormData) {
  const amount = parseAmount(formData.get("amount"));
  const name = String(formData.get("new_savings_name") ?? "").trim();

  if (!name || amount <= 0) {
    throw new Error("Thiếu tên tiết kiệm hoặc số tiền không hợp lệ");
  }

  await applySavingsDeltaToAvailable(amount);

  const { error } = await getSupabase().from("items").insert({
    name,
    amount,
    type: "savings"
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry");
}

export async function addNewItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const amount = parseAmount(formData.get("initial_amount"));

  if (!name) {
    throw new Error("Tên khoản không được để trống");
  }

  const { error } = await getSupabase().from("items").insert({
    name,
    amount,
    type: "regular"
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/entry");
  redirect("/entry");
}
