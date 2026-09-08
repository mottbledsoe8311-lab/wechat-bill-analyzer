const BASE_URL = process.env.TEST_URL ?? 'http://127.0.0.1:3000/';
const PDF_PATH = process.argv[2] ?? '/home/ubuntu/upload/sui(20250501-20260308).pdf';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPageTarget() {
  const response = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await response.json();
  const target = targets.find((item) => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) throw new Error('No Chromium page target found');
  return target;
}

const target = await getPageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression, returnByValue = true) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Browser evaluation failed');
  }
  return returnByValue ? result.result?.value : result.result;
}

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');
await send('Page.navigate', { url: BASE_URL });
await sleep(2500);

const uploadInputs = await evaluate(`Array.from(document.querySelectorAll('input[type="file"]')).map((input, index) => ({
  index,
  accept: input.accept,
  multiple: input.multiple,
  outerHTML: input.outerHTML.slice(0, 300)
}))`);
console.log(JSON.stringify({ step: 'inputs', uploadInputs }, null, 2));

const inputInfo = await evaluate(`(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
  const index = inputs.findIndex((input) => /pdf|wps/i.test(input.accept || ''));
  return { index, count: inputs.length };
})()`);
if (inputInfo.index < 0) throw new Error('PDF file input not found');

const documentResult = await send('DOM.getDocument', { depth: -1, pierce: true });
const inputNode = await send('DOM.querySelector', {
  nodeId: documentResult.root.nodeId,
  selector: `input[type="file"][accept*="pdf"]`,
});
if (!inputNode.nodeId) throw new Error('PDF file input node disappeared after page load');
await send('DOM.setFileInputFiles', { nodeId: inputNode.nodeId, files: [PDF_PATH] });
await evaluate(`(() => {
  const input = Array.from(document.querySelectorAll('input[type="file"]'))[${inputInfo.index}];
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
})()`);
await sleep(1000);

const afterUpload = await evaluate(`({
  body: document.body.innerText.slice(0, 5000),
  buttons: Array.from(document.querySelectorAll('button')).map((button) => ({ text: button.innerText.trim(), disabled: button.disabled })).filter((button) => button.text)
})`);
console.log(JSON.stringify({ step: 'after-upload', afterUpload }, null, 2));

const clickResult = await evaluate(`(() => {
  const button = Array.from(document.querySelectorAll('button')).find((candidate) => {
    const text = candidate.innerText.trim();
    return !candidate.disabled && /开始分析|分析账单|开始/.test(text);
  });
  if (!button) return { clicked: false };
  button.click();
  return { clicked: true, text: button.innerText.trim() };
})()`);
console.log(JSON.stringify({ step: 'start-analysis', clickResult }, null, 2));
if (!clickResult.clicked) throw new Error('Analysis start button not found after upload');

let lastState = '';
let finalState;
for (let attempt = 0; attempt < 180; attempt += 1) {
  await sleep(1000);
  const state = await evaluate(`(() => {
    const section = document.getElementById('bankcardsummary');
    const text = section?.innerText || '';
    const body = document.body.innerText;
    return {
      state: body.includes('正在分析') || body.includes('正在解析') ? 'analyzing' : (section ? 'report' : 'upload'),
      sectionText: text.slice(0, 12000),
      hasCard: /工商银行|华夏银行|中信银行|招商银行|农业银行|广发银行/.test(text),
      hasEmpty: text.includes('暂无银行卡支出记录'),
      bodyTail: body.slice(-1200)
    };
  })()`);
  const marker = `${state.state}|${state.hasCard}|${state.hasEmpty}|${state.sectionText.length}`;
  if (marker !== lastState && (attempt % 5 === 0 || state.state === 'report' || state.hasCard || state.hasEmpty)) {
    console.log(JSON.stringify({ step: 'poll', attempt, state }, null, 2));
    lastState = marker;
  }
  finalState = state;
  if (state.hasCard || (state.state === 'report' && !state.hasEmpty)) break;
  if (state.state === 'upload' && attempt > 20) break;
}

console.log(JSON.stringify({ step: 'final', finalState }, null, 2));
if (!finalState?.hasCard) process.exitCode = 2;

const detailState = await evaluate(`(() => {
  const section = document.getElementById('bankcardsummary');
  const cardButton = section?.querySelector('button');
  if (!cardButton) return { expanded: false, rowCount: 0, rows: [] };
  cardButton.click();
  return { expanded: true };
})()`);
await sleep(500);
const expandedDetails = await evaluate(`(() => {
  const section = document.getElementById('bankcardsummary');
  const rows = Array.from(section?.querySelectorAll('.border-t .space-y-2 > div') ?? []).map((row) => row.innerText.trim()).filter(Boolean);
  return { rows, rowCount: rows.length, hasDate: rows.some((row) => /20\\d{2}|26-03|25-/.test(row)), hasAmount: rows.some((row) => /¥/.test(row)) };
})()`);
console.log(JSON.stringify({ step: 'expanded-details', detailState, expandedDetails }, null, 2));
if (!expandedDetails.hasDate || !expandedDetails.hasAmount || expandedDetails.rowCount === 0) process.exitCode = 3;
socket.close();
