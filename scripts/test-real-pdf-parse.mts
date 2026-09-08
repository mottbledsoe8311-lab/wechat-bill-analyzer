import { readFile } from "node:fs/promises";
import { parsePDF } from "../client/src/lib/pdfParser";

const pdfPath = process.argv[2] ?? "/home/ubuntu/upload/sui(20250501-20260308).pdf";
const buffer = await readFile(pdfPath);
const file = new File([buffer], "sui(20250501-20260308).pdf", { type: "application/pdf" });

let lastProgress = -1;
const result = await parsePDF(file, (progress, message) => {
  const bucket = Math.floor(progress / 10);
  if (bucket !== lastProgress) {
    lastProgress = bucket;
    console.log(`[progress] ${progress.toFixed(1)}% ${message}`);
  }
});

const bankCardTransactions = result.transactions.filter((tx) => {
  const method = String(tx.method ?? "").replace(/\s+/g, "");
  return tx.direction === "支出" && /(银行卡|储蓄卡|信用卡)/.test(method);
});

const methodCounts = new Map<string, number>();
for (const tx of bankCardTransactions) {
  const method = String(tx.method ?? "").replace(/\s+/g, " ").trim();
  methodCounts.set(method, (methodCounts.get(method) ?? 0) + 1);
}

console.log(JSON.stringify({
  pdfPath,
  totalPages: result.totalPages,
  transactionCount: result.transactions.length,
  parseErrorCount: result.parseErrors.length,
  parseErrors: result.parseErrors.slice(0, 10),
  expenseCount: result.transactions.filter((tx) => tx.direction === "支出").length,
  bankCardExpenseCount: bankCardTransactions.length,
  bankCardMethods: Object.fromEntries(methodCounts),
  sampleTransactions: result.transactions.slice(0, 5).map((tx) => ({
    date: tx.date.toISOString(),
    direction: tx.direction,
    method: tx.method,
    amount: tx.amount,
    counterpart: tx.counterpart,
  })),
}, null, 2));

if (bankCardTransactions.length === 0) {
  process.exitCode = 1;
}
