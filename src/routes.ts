import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createPayInInvoice, createPayoutInvoice, getTransactionStatus } from "./payouter";
import { saveInvoice, getInvoice, listInvoices } from "./store";
import { handlePayouterWebhook } from "./webhook";
import { Invoice } from "./types";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

router.post("/invoice/payin", async (req: Request, res: Response) => {
  console.log("🔵 POST /invoice/payin received");
  console.log("Request body:", req.body);
  
  try {
    const { amount, currency } = req.body;
    console.log("Extracted amount:", amount, "currency:", currency);
    
    if (typeof amount !== "number" || !currency) {
      console.log("❌ Validation failed: amount or currency invalid");
      return res.status(400).json({ error: "amount (number) and currency required" });
    }

    console.log("✅ Validation passed, calling createPayInInvoice...");
    const external = await createPayInInvoice(amount, currency);
    const externalId = external?.id ?? external?.invoiceId;
    const id = externalId ?? uuidv4();

    const inv: Invoice = {
      id,
      externalId,
      type: "payin",
      amount,
      currency,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      meta: external,
    };

    saveInvoice(inv);
    return res.status(201).json({ invoice: inv });
  } catch (err: any) {
    console.error("Create payin error:", err?.message ?? err);
    return res.status(500).json({ error: "failed to create payin invoice", details: err?.message });
  }
});

router.post("/invoice/payout", async (req: Request, res: Response) => {
  try {
    const { amount, currency } = req.body;
    if (typeof amount !== "number" || !currency) return res.status(400).json({ error: "amount (number) and currency required" });

    const external = await createPayoutInvoice(amount, currency);
    const externalId = external?.id ?? external?.invoiceId;
    const id = externalId ?? uuidv4();

    const inv: Invoice = {
      id,
      externalId,
      type: "payout",
      amount,
      currency,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      meta: external,
    };

    saveInvoice(inv);
    return res.status(201).json({ invoice: inv });
  } catch (err: any) {
    console.error("Create payout error:", err?.message ?? err);
    return res.status(500).json({ error: "failed to create payout invoice", details: err?.message });
  }
});

router.get("/status/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const inv = getInvoice(id);
    if (!inv) return res.status(404).json({ error: "invoice not found" });

    if (inv.externalId) {
      try {
        const external = await getTransactionStatus(inv.externalId, inv.type);
        return res.json({ invoice: inv, external });
      } catch (err) {
        console.warn("Failed to fetch external status:", (err as any)?.message ?? err);
      }
    }

    return res.json({ invoice: inv });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
});

router.get("/invoices", (_req, res) => {
  const all = listInvoices();
  res.json({ invoices: all });
});

router.post("/webhook/payouter", handlePayouterWebhook);

export default router;
