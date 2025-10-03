"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const payouter_1 = require("./payouter");
const store_1 = require("./store");
const webhook_1 = require("./webhook");
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
router.post("/invoice/payin", async (req, res) => {
    try {
        const { amount, currency } = req.body;
        if (typeof amount !== "number" || !currency)
            return res.status(400).json({ error: "amount (number) and currency required" });
        const external = await (0, payouter_1.createPayInInvoice)(amount, currency);
        const externalId = external?.id ?? external?.invoiceId;
        const id = externalId ?? (0, uuid_1.v4)();
        const inv = {
            id,
            externalId,
            type: "payin",
            amount,
            currency,
            createdAt: new Date().toISOString(),
            status: "PENDING",
            meta: external,
        };
        (0, store_1.saveInvoice)(inv);
        return res.status(201).json({ invoice: inv });
    }
    catch (err) {
        console.error("Create payin error:", err?.message ?? err);
        return res.status(500).json({ error: "failed to create payin invoice", details: err?.message });
    }
});
router.post("/invoice/payout", async (req, res) => {
    try {
        const { amount, currency } = req.body;
        if (typeof amount !== "number" || !currency)
            return res.status(400).json({ error: "amount (number) and currency required" });
        const external = await (0, payouter_1.createPayoutInvoice)(amount, currency);
        const externalId = external?.id ?? external?.invoiceId;
        const id = externalId ?? (0, uuid_1.v4)();
        const inv = {
            id,
            externalId,
            type: "payout",
            amount,
            currency,
            createdAt: new Date().toISOString(),
            status: "PENDING",
            meta: external,
        };
        (0, store_1.saveInvoice)(inv);
        return res.status(201).json({ invoice: inv });
    }
    catch (err) {
        console.error("Create payout error:", err?.message ?? err);
        return res.status(500).json({ error: "failed to create payout invoice", details: err?.message });
    }
});
router.get("/status/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const inv = (0, store_1.getInvoice)(id);
        if (!inv)
            return res.status(404).json({ error: "invoice not found" });
        if (inv.externalId) {
            try {
                const external = await (0, payouter_1.getTransactionStatus)(inv.externalId, inv.type);
                return res.json({ invoice: inv, external });
            }
            catch (err) {
                console.warn("Failed to fetch external status:", err?.message ?? err);
            }
        }
        return res.json({ invoice: inv });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "internal" });
    }
});
router.get("/invoices", (_req, res) => {
    const all = (0, store_1.listInvoices)();
    res.json({ invoices: all });
});
router.post("/webhook/payouter", webhook_1.handlePayouterWebhook);
exports.default = router;
