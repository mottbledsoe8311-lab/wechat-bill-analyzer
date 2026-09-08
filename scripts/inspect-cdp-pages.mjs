const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const pages = targets.filter((item) => item.type === 'page');
console.log('targets', pages.map(({ id, title, url }) => ({ id, title, url })));

for (const page of pages) {
  const socket = new WebSocket(page.webSocketDebuggerUrl);
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
  const evaluate = (expression) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });
  console.log(JSON.stringify({ page: page.id, state: await evaluate('({url:location.href,title:document.title,ready:document.readyState,body:document.body?.innerText?.slice(0,500),inputs:document.querySelectorAll(\'input[type=file]\').length})') }, null, 2));
  socket.close();
}
