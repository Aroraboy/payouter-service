"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveInvoice = saveInvoice;
exports.getInvoice = getInvoice;
exports.updateInvoiceStatus = updateInvoiceStatus;
exports.listInvoices = listInvoices;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_PATH = path_1.default.join(process.cwd(), "data", "invoices.json");
function ensureDataFile() {
    const dir = path_1.default.dirname(DATA_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    if (!fs_1.default.existsSync(DATA_PATH))
        fs_1.default.writeFileSync(DATA_PATH, "[]");
}
function readAll() {
    ensureDataFile();
    const raw = fs_1.default.readFileSync(DATA_PATH, "utf8");
    try {
        return JSON.parse(raw);
    }
    catch (err) {
        console.error("Failed to parse invoices.json, resetting.", err);
        fs_1.default.writeFileSync(DATA_PATH, "[]");
        return [];
    }
}
function writeAll(items) {
    ensureDataFile();
    fs_1.default.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2));
}
function saveInvoice(inv) {
    const all = readAll();
    const idx = all.findIndex((x) => x.id === inv.id);
    if (idx === -1)
        all.push(inv);
    else
        all[idx] = inv;
    writeAll(all);
}
function getInvoice(id) {
    const all = readAll();
    return all.find((x) => x.id === id || x.externalId === id);
}
function updateInvoiceStatus(id, status) {
    const all = readAll();
    const idx = all.findIndex((x) => x.id === id || x.externalId === id);
    if (idx !== -1) {
        all[idx].status = status;
        writeAll(all);
        return true;
    }
    return false;
}
function listInvoices() {
    return readAll();
}
