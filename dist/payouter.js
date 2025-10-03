"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayInInvoice = createPayInInvoice;
exports.createPayoutInvoice = createPayoutInvoice;
exports.getTransactionStatus = getTransactionStatus;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BASE_URL = process.env.BASE_URL || "https://api.payouter.com";
const MERCHANT_ID = process.env.MERCHANT_ID || "";
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || "";
const PAYOUT_API_KEY = process.env.PAYOUT_API_KEY || "";
if (!MERCHANT_ID)
    console.warn("MERCHANT_ID missing in .env");
async function createPayInInvoice(amount, currency) {
    const payload = { merchantId: MERCHANT_ID, amount, currency };
    const url = `${BASE_URL}/payments/invoices`;
    console.log("Making payin request to:", url);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("Headers:", {
        Authorization: `Bearer ${PAYMENT_API_KEY.substring(0, 10)}...`,
        "Content-Type": "application/json"
    });
    try {
        const res = await axios_1.default.post(url, payload, {
            headers: { Authorization: `Bearer ${PAYMENT_API_KEY}`, "Content-Type": "application/json" },
            timeout: 10000,
        });
        console.log("Response:", res.status, res.data);
        return res.data;
    }
    catch (error) {
        console.error("API Error Details:");
        console.error("Status:", error.response?.status);
        console.error("Status Text:", error.response?.statusText);
        console.error("Response Data:", error.response?.data);
        console.error("Request URL:", error.config?.url);
        throw error;
    }
}
async function createPayoutInvoice(amount, currency) {
    const payload = { merchantId: MERCHANT_ID, amount, currency };
    const res = await axios_1.default.post(`${BASE_URL}/payouts/invoices`, payload, {
        headers: { Authorization: `Bearer ${PAYOUT_API_KEY}`, "Content-Type": "application/json" },
        timeout: 10000,
    });
    return res.data;
}
async function getTransactionStatus(externalId, type) {
    const endpoint = type === "payin" ? "payments" : "payouts";
    const apiKey = type === "payin" ? PAYMENT_API_KEY : PAYOUT_API_KEY;
    const res = await axios_1.default.get(`${BASE_URL}/${endpoint}/invoices/${encodeURIComponent(externalId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
    });
    return res.data;
}
