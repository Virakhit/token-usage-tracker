const KEY = 'token-usage-tracker-v1';
const SYNC_URL = '/api/hermes-usage';
const REFRESH_MS = 20000; // auto-refresh Hermes data via local server
const form = document.querySelector('#usageForm');
const rows = document.querySelector('#usageRows');
const empty = document.querySelector('#emptyState');
const search = document.querySelector('#search');
const syncBtn = document.querySelector('#syncBtn');
const syncStatus = document.querySelector('#syncStatus');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 });
const number = new Intl.NumberFormat('en-US');
let entries = JSON.parse(localStorage.getItem(KEY) || '[]');

document.querySelector('[name=date]').value = new Date().toISOString().slice(0, 10);

function save() { localStorage.setItem(KEY, JSON.stringify(entries)); }
function totals() {
  const input = entries.reduce((n, x) => n + x.input, 0);
  const output = entries.reduce((n, x) => n + x.output, 0);
  const cache = entries.reduce((n, x) => n + (x.cache_read ?? 0) + (x.cache_write ?? 0), 0);
  document.querySelector('#inputTokens').textContent = number.format(input);
  document.querySelector('#outputTokens').textContent = number.format(output);
  document.querySelector('#cacheTokens').textContent = number.format(cache);
  document.querySelector('#totalTokens').textContent = number.format(input + output + cache);
  document.querySelector('#requestCount').textContent = number.format(entries.length);
}
function sourceBadge(x) {
  if (x.source === 'hermes') return `<span class="src hermes">Hermes</span>`;
  return `<span class="src manual">local</span>`;
}
function render() {
  const term = search.value.trim().toLowerCase();
  const filtered = entries.filter(x => `${x.provider} ${x.model} ${x.note} ${x.source}`.toLowerCase().includes(term));
  rows.innerHTML = filtered.map(x => {
    const cache = (x.cache_read ?? 0) + (x.cache_write ?? 0);
    return `<tr>
      <td>${x.date}</td><td>${sourceBadge(x)}</td>
      <td><strong>${escapeHtml(x.provider)}</strong><small>${escapeHtml(x.model)}${x.note ? ` · ${escapeHtml(x.note)}` : ''}</small></td>
      <td class="num">${number.format(x.input)}</td><td class="num">${number.format(x.output)}</td>
      <td class="num">${cache ? number.format(cache) : '—'}</td><td class="num">${x.reasoning ? number.format(x.reasoning) : '—'}</td>
      <td class="num"><strong>${number.format(x.input + x.output + cache)}</strong></td>
      <td class="num">${(x.cost ?? 0) ? money.format(x.cost) : '—'}</td>
      <td>${x.source === 'hermes' ? '' : `<button class="delete" data-id="${x.id}" title="ลบรายการ">×</button>`}</td></tr>`;
  }).join('');
  empty.hidden = filtered.length > 0;
  empty.textContent = entries.length && !filtered.length ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีข้อมูล — เพิ่มรายการแรกทางซ้าย';
  totals();
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
form.addEventListener('submit', e => {
  e.preventDefault(); const data = new FormData(form);
  entries.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, provider: data.get('provider').trim(), model: data.get('model').trim(), input: Number(data.get('input')) || 0, output: Number(data.get('output')) || 0, cost: Number(data.get('cost')) || 0, date: data.get('date'), note: data.get('note').trim(), source: 'manual' });
  save(); form.reset(); document.querySelector('[name=date]').value = new Date().toISOString().slice(0, 10); render();
});
rows.addEventListener('click', e => { const id = e.target.dataset.id; if (!id) return; entries = entries.filter(x => x.id !== id); save(); render(); });
search.addEventListener('input', render);

// --- Hermes realtime sync ---
function setSync(msg, kind) {
  syncStatus.hidden = !msg;
  syncStatus.textContent = msg || '';
  syncStatus.className = `sync-status ${kind || ''}`;
}
async function fetchHermes() {
  try {
    const res = await fetch(SYNC_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'endpoint error');
    mergeHermes(data.sessions || []);
    setSync(`Sync สำเร็จ · ${data.count} session จาก Hermes state.db`, 'ok');
  } catch (err) {
    setSync(`Sync Hermes ล้มเหลว (${err.message}) — ต้องเปิด local server ด้วย python local_server.py`, 'err');
  }
}
function mergeHermes(sessions) {
  const map = new Map(entries.map(x => [x.id, x]));
  let upserted = 0;
  for (const s of sessions) {
    if (!s || !s.id) continue;
    // upsert by hermes:<session_id> so the cumulative session row is updated, never appended
    if (map.has(s.id)) upserted += 1;
    map.set(s.id, s);
  }
  entries = Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  upserted = upserted || sessions.length;
  save(); render();
}
syncBtn.addEventListener('click', fetchHermes);

// Enable Sync button only when a local server answers /api/hermes-usage.
function probeLocalServer() {
  fetch(SYNC_URL, { method: 'GET', cache: 'no-store' })
    .then(() => {
      syncBtn.disabled = false;
      syncBtn.title = 'Sync ข้อมูล Hermes จาก state.db (ผ่าน local server)';
      autoFetch(); // server is up -> keep Hermes data fresh
    })
    .catch(() => {
      syncBtn.disabled = true;
      syncBtn.title = 'เปิด local server (python local_server.py) เพื่อ enable Sync Hermes';
      setSync('ยังตรวจไม่พบ local server — เปิดด้วย python local_server.py แล้ว sync ดูข้อมูล Hermes จริง', 'hint');
    });
}
let lastAuto = 0;
function autoFetch() {
  const now = Date.now();
  if (now - lastAuto < REFRESH_MS) return; // throttle: one fetch per interval
  lastAuto = now;
  fetchHermes();
}

document.querySelector('#logFile').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  const imported = UsageParser.parseUsageText(await file.text());
  const date = new Date().toISOString().slice(0, 10);
  entries = [...imported.map(x => ({ ...x, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, date, source: 'manual' })), ...entries];
  save(); render(); e.target.value = '';
  alert(imported.length ? `นำเข้า ${imported.length} รายการแล้ว` : 'ไม่พบ usage ที่รองรับในไฟล์นี้');
});
document.querySelector('#clearBtn').addEventListener('click', () => { if (entries.length && confirm('ลบข้อมูลทั้งหมดใช่ไหม?')) { entries = []; save(); render(); } });
document.querySelector('#exportBtn').addEventListener('click', () => {
  const head = ['date','source','provider','model','input_tokens','output_tokens','cache_read','cache_write','reasoning','total_tokens','cost_usd','note'];
  const csv = [head, ...entries.map(x => [x.date, x.source || 'manual', x.provider, x.model, x.input, x.output, x.cache_read ?? 0, x.cache_write ?? 0, x.reasoning ?? 0, x.input + x.output + (x.cache_read ?? 0) + (x.cache_write ?? 0), x.cost ?? 0, x.note])].map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], {type:'text/csv;charset=utf-8'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'token-usage.csv'; a.click(); URL.revokeObjectURL(a.href);
});

render();
// Probe once on load, then keep polling so Sync stays live with the local server.
probeLocalServer();
setInterval(probeLocalServer, REFRESH_MS);