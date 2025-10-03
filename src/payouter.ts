import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "https://api.payouter.com";
const MERCHANT_ID = process.env.MERCHANT_ID || "";
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || "";
const PAYOUT_API_KEY = process.env.PAYOUT_API_KEY || "";
const TEST_MODE = true;

console.log("TEST_MODE:", TEST_MODE);
if (TEST_MODE) console.log("Running in TEST MODE");

interface CreateResp {
  id?: string;
  invoiceId?: string;
  [key: string]: any;
}

export async function createPayInInvoice(amount: number, currency: string): Promise<CreateResp> {
  if (TEST_MODE) {
    console.log("TEST MODE: Mocking payin invoice creation");
    return {
      id: "test_payin_" + Date.now(),
      invoiceId: "test_payin_" + Date.now(),
      status: "pending",
      amount,
      currency
    };
  }
  
  const payload = { merchantId: MERCHANT_ID, amount, currency };
  const res = await axios.post(`${BASE_URL}/payments/invoices`, payload, {
    headers: { Authorization: `Bearer ${PAYMENT_API_KEY}`, "Content-Type": "application/json" },
    timeout: 10000,
  });
  return res.data;
}

export async function createPayoutInvoice(amount: number, currency: string): Promise<CreateResp> {
  if (TEST_MODE) {
    console.log("TEST MODE: Mocking payout invoice creation");
    return {
      id: "test_payout_" + Date.now(),
      invoiceId: "test_payout_" + Date.now(),
      status: "pending",
      amount,
      currency
    };
  }

  const payload = { merchantId: MERCHANT_ID, amount, currency };
  const res = await axios.post(`${BASE_URL}/payouts/invoices`, payload, {
    headers: { Authorization: `Bearer ${PAYOUT_API_KEY}`, "Content-Type": "application/json" },
    timeout: 10000,
  });
  return res.data;
}

export async function getTransactionStatus(externalId: string, type: "payin" | "payout") {
  if (TEST_MODE) {
    return { id: externalId, status: "SUCCESS", type };
  }

  const endpoint = type === "payin" ? "payments" : "payouts";
  const apiKey = type === "payin" ? PAYMENT_API_KEY : PAYOUT_API_KEY;
  const res = await axios.get(`${BASE_URL}/${endpoint}/invoices/${encodeURIComponent(externalId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 10000,
  });
  return res.data;
}
