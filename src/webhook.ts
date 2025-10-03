import { Request, Response } from "express";
import { updateInvoiceStatus, saveInvoice } from "./store";
import { Invoice } from "./types";

export async function handlePayouterWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;

    // Example shapes: { invoiceId, status, type, amount, currency, ... }
    const invoiceId = payload.invoiceId || payload.id || payload.invoice_id;
    const status = payload.status || payload.state;
    const type = payload.type || payload.kind || (payload.payout ? "payout" : "payin");

    if (!invoiceId || !status) {
      console.warn("Webhook missing invoiceId or status", payload);
      return res.status(400).json({ error: "invalid webhook payload" });
    }

    const updated = updateInvoiceStatus(invoiceId, status);
    if (!updated) {
      // create a minimal invoice record if unknown
      const inv: Invoice = {
        id: invoiceId,
        externalId: invoiceId,
        type: type === "payout" ? "payout" : "payin",
        amount: payload.amount || 0,
        currency: payload.currency || "USD",
        createdAt: new Date().toISOString(),
        status,
        meta: payload,
      };
      saveInvoice(inv);
      console.log("Created invoice from webhook:", inv.id);
    } else {
      console.log(`Updated invoice ${invoiceId} -> ${status}`);
    }

    if (process.env.LOG_WEBHOOKS === "true") console.log("webhook payload:", JSON.stringify(payload));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "internal error" });
  }
}
