import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "https://api.payouter.com";
const MERCHANT_ID = process.env.MERCHANT_ID || "";
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || "";
const PAYOUT_API_KEY = process.env.PAYOUT_API_KEY || "";
const TEST_MODE = process.env.TEST_MODE === "true";

console.log("TEST_MODE:", TEST_MODE);
if (TEST_MODE) console.log("Running in TEST MODE");

interface CreateResp {
  id?: string;
  invoiceId?: string;
  [key: string]: any;
}

// Helper function to create MD5 signature as per Payouter docs
function createSignature(data: any, apiKey: string): string {
  // Sort the object keys alphabetically as required by Payouter
  const getSortedObject = (obj: any): any => {
    if (typeof obj !== "object" || Array.isArray(obj) || obj === null) return obj;
    const sortedObject: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => sortedObject[key] = getSortedObject(obj[key]));
    return sortedObject;
  };

  const sortedObject = getSortedObject(data);
  const json = JSON.stringify(sortedObject).replace(/[']/g, '');
  const base64Data = Buffer.from(json).toString('base64');
  
  return crypto.createHash('md5').update(`${base64Data}${apiKey}`).digest('hex');
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
  
  // Prepare the payload according to Payouter API requirements
  const payload = {
    amount: amount.toString(),
    currency: currency,
    order_id: `order_${Date.now()}`, // Generate unique order ID
    payment_type: "CARD", // Default payment type, can be made configurable
    additional_data: "Payment via API",
    url_callback: process.env.CALLBACK_URL || "https://your-domain.com/webhook/payouter",
    url_success: process.env.SUCCESS_URL || "https://your-domain.com/success",
    url_error: process.env.ERROR_URL || "https://your-domain.com/error",
    fingerprint: MERCHANT_ID
  };

  // Create signature as per Payouter documentation
  const signature = createSignature(payload, PAYMENT_API_KEY);
  
  console.log("Creating payin invoice with payload:", JSON.stringify(payload, null, 2));
  
  try {
    // According to Payouter docs, all requests must be POST
    const response = await axios.post(`${BASE_URL}/payment`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYMENT_API_KEY,
        'Signature': signature
      },
      timeout: 10000,
    });
    
    console.log("Payouter payin response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Payouter payin error:", error.response?.data || error.message);
    throw error;
  }
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

  // Prepare the payload for payout according to Payouter API
  const payload = {
    amount: amount.toString(),
    currency: currency,
    order_id: `payout_${Date.now()}`,
    payout_type: "CARD", // Default payout type
    recipient_card: process.env.DEFAULT_RECIPIENT_CARD || "", // Should be provided
    additional_data: "Payout via API",
    url_callback: process.env.CALLBACK_URL || "https://your-domain.com/webhook/payouter",
    fingerprint: MERCHANT_ID
  };

  const signature = createSignature(payload, PAYOUT_API_KEY);
  
  console.log("Creating payout invoice with payload:", JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/payout`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYOUT_API_KEY,
        'Signature': signature
      },
      timeout: 10000,
    });
    
    console.log("Payouter payout response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Payouter payout error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getTransactionStatus(externalId: string, type: "payin" | "payout") {
  if (TEST_MODE) {
    console.log("TEST MODE: Mocking transaction status check");
    return { 
      id: externalId, 
      status: "SUCCESS", 
      type,
      order_id: externalId
    };
  }

  // For status checks, we typically need to provide the order_id or transaction_id
  const payload = {
    order_id: externalId,
    fingerprint: MERCHANT_ID
  };

  const apiKey = type === "payin" ? PAYMENT_API_KEY : PAYOUT_API_KEY;
  const signature = createSignature(payload, apiKey);
  
  try {
    // Status endpoint is typically different - might be /status or similar
    const endpoint = type === "payin" ? "/payment/status" : "/payout/status";
    
    const response = await axios.post(`${BASE_URL}${endpoint}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'Signature': signature
      },
      timeout: 10000,
    });
    
    console.log("Payouter status response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Payouter status error:", error.response?.data || error.message);
    throw error;
  }
}
