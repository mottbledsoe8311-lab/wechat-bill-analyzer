import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const pdfPath = process.argv[2] ?? "/home/ubuntu/upload/sui(20250501-20260308).pdf";
const data = new Uint8Array(await readFile(pdfPath));
const loadingTask = pdfjsLib.getDocument({
  data,
  disableWorker: true,
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
});
const pdf = await loadingTask.promise;
console.log(`pages=${pdf.numPages}`);

for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 3); pageNo += 1) {
  const page = await pdf.getPage(pageNo);
  const content = await page.getTextContent({ normalizeWhitespace: true });
  const items = content.items as Array<any>;
  const rows = new Map<number, Array<{ x: number; str: string }>>();
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const y = Math.round(item.transform[5]);
    const row = rows.get(y) ?? [];
    row.push({ x: item.transform[4], str: item.str });
    rows.set(y, row);
  }
  const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0]);
  console.log(`--- page ${pageNo} rows=${sorted.length} ---`);
  for (const [y, cells] of sorted) {
    cells.sort((a, b) => a.x - b.x);
    const line = cells.map((cell) => cell.str).join(" ");
    if (/2026-03|2025-05|储|蓄|信用|支出|零钱|交易时间/.test(line)) {
      console.log(JSON.stringify({ y, cells, line }));
    }
  }
}
