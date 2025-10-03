import fs from "fs";
import path from "path";
import { Invoice } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "invoices.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]");
}

function readAll(): Invoice[] {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  try {
    return JSON.parse(raw) as Invoice[];
  } catch (err) {
    console.error("Failed to parse invoices.json, resetting.", err);
    fs.writeFileSync(DATA_PATH, "[]");
    return [];
  }
}

function writeAll(items: Invoice[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2));
}

export function saveInvoice(inv: Invoice) {
  const all = readAll();
  const idx = all.findIndex((x) => x.id === inv.id);
  if (idx === -1) all.push(inv);
  else all[idx] = inv;
  writeAll(all);
}

export function getInvoice(id: string): Invoice | undefined {
  const all = readAll();
  return all.find((x) => x.id === id || x.externalId === id);
}

export function updateInvoiceStatus(id: string, status: Invoice["status"]) {
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id || x.externalId === id);
  if (idx !== -1) {
    all[idx].status = status;
    writeAll(all);
    return true;
  }
  return false;
}

export function listInvoices() {
  return readAll();
}
