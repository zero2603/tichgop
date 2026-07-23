export type ItemType = "available" | "regular" | "savings";

export type Item = {
  id: string;
  name: string;
  amount: number;
  type: ItemType;
};

export type BalancePoint = {
  total: number;
  snapshot_at: string;
};

export type GroupedItems = {
  available: Item | null;
  regular: Item[];
  savings: Item[];
};
