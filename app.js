const KEY = 'token-usage-tracker-v1';
const form = document.querySelector('#usageForm');
const rows = document.querySelector('#usageRows');
const empty = document.querySelector('#emptyState');
const search = document.querySelector('#search');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 });
const number = new Intl.NumberFormat('en-US');
let entries = JSON.parse(localStorage.getItem(KEY) || '[]');

document.querySelector('[name=date]').value = new Date().toISOString().slice(0, 10);

function save() { localStorage.setItem(KEY, JSON.stringify(entries)); }
function totals() {
  const input = entries.reduce((n, x) => n + x.input, 0);
  const output = entries.reduce((n, x) => n + x.output, 0);
  document.querySelector('#inputTokens').textContent = number.format(input);
  document.querySelector('#outputTokens').textContent = number.format(output);
  document.querySelector('#totalTokens').textContent = number.format(input + output);
  document.querySelector('#requestCount').textContent = number.format(entries.length);
}
function render() {
  const term = search.value.trim().toLowerCase();
  const filtered = entries.filter(x => `${x.provider} ${x.model} ${x.note}`.toLowerCase().includes(term));
  rows.innerHTML = filtered.map(x => `<tr>
    <td>${x.date}</td><td><strong>${escapeHtml(x.provider)}</strong><small>${escapeHtml(x.model)}${x.note ? ` · ${escapeHtml(x.note)}` : ''}</small></td>
    <td class="num">${number.format(x.input)}</td><td class="num">${number.format(x.output)}</td><td class="num"><strong>${number.format(x.input + x.output)}</strong></td>
    <td class="num">${money.format(x.cost)}</td><td><button class="delete" data-id="${x.id}" title="ลบรายการ">×</button></td></tr>`).join('');
  empty.hidden = filtered.length > 0;
  empty.textContent = entries.length && !filtered.length ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีข้อมูล — เพิ่มรายการแรกทางซ้าย';
  totals();
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
form.addEventListener('submit', e => {
  e.preventDefault(); const data = new FormData(form);
  entries.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, provider: data.get('provider').trim(), model: data.get('model').trim(), input: Number(data.get('input')) || 0, output: Number(data.get('output')) || 0, cost: Number(data.get('cost')) || 0, date: data.get('date'), note: data.get('note').trim() });
  save(); form.reset(); document.querySelector('[name=date]').value = new Date().toISOString().slice(0, 10); render();
});
rows.addEventListener('click', e => { const id = e.target.dataset.id; if (!id) return; entries = entries.filter(x => x.id !== id); save(); render(); });
search.addEventListener('input', render);
document.querySelector('#clearBtn').addEventListener('click', () => { if (entries.length && confirm('ลบข้อมูลทั้งหมดใช่ไหม?')) { entries = []; save(); render(); } });
document.querySelector('#exportBtn').addEventListener('click', () => {
  const head = ['date','provider','model','input_tokens','output_tokens','total_tokens','cost_usd','note'];
  const csv = [head, ...entries.map(x => [x.date,x.provider,x.model,x.input,x.output,x.input+x.output,x.cost,x.note])].map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], {type:'text/csv;charset=utf-8'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'token-usage.csv'; a.click(); URL.revokeObjectURL(a.href);
});
render();
