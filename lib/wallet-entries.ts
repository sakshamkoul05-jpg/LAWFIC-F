export type WalletEntry = {
  id: string;
  direction: "credit" | "debit";
  amount_paise: number;
  reason: string;
  created_at: string;
  gateway_payment_id: string | null;
  order_id: string | null;
};
