"use client";

import { Button } from "@/components/Button";

export function AddItemForm({ onAdd }: { onAdd: () => void }) {
  return (
    <Button type="button" tone="secondary" onClick={onAdd}>+ Thêm khoản</Button>
  );
}
