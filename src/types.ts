export type InvoiceType = "payin" | "payout";
export type InvoiceStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Invoice {
  id: string;           // local id (may equal externalId)
  externalId?: string;  // id returned by Payouter (if available)
  type: InvoiceType;
  amount: number;
  currency: string;
  createdAt: string; // ISO
  status: InvoiceStatus;
  meta?: Record<string, any>;
}
