# HANDOFF2 — Hermes Token Usage Tracker

วันที่สรุป: 2026-08-16
โปรเจกต์: `C:\Users\verak\projects\token-usage-tracker`

## เป้าหมายล่าสุด

ผู้ใช้ต้องการ track token ที่ **Hermes Agent ใช้งานจริง** ไม่ใช่ import token จาก API ทั่วไป โดยอ่านข้อมูลจาก Hermes ในเครื่องอัตโนมัติ

## ทำเสร็จแล้ว

### ฟีเจอร์เดิมที่เสร็จและ deploy แล้ว

- เว็บ tracker แบบ static minimal
- เพิ่มรายการ provider/model แบบ manual
- เก็บ input/output/total tokens, cost และวันที่
- ค้นหา, ลบรายการ, export CSV
- เก็บข้อมูล tracker ใน browser `localStorage`
- Import JSON/JSONL response/log จาก OpenAI, Anthropic และ Gemini
- มี parser แยกโครงสร้าง usage ของแต่ละ provider
- GitHub repo: https://github.com/Virakhit/token-usage-tracker
- Vercel production: https://token-usage-tracker-mocha.vercel.app
- Deployment เดิมสถานะ `READY`

### การตรวจสอบ Hermes ในเครื่อง

พบว่า Hermes เก็บ cumulative usage ไว้ที่:

```text
C:\Users\verak\AppData\Local\hermes\state.db
```

ตาราง `sessions` มีข้อมูลสำคัญ:

- `input_tokens`
- `output_tokens`
- `cache_read_tokens`
- `cache_write_tokens`
- `reasoning_tokens`
- `model`
- `model_config` ซึ่งมี provider ใน `gateway_runtime.provider`
- `estimated_cost_usd` / `actual_cost_usd`
- `started_at`
- `title`

### งานที่เริ่มทำสำหรับ Hermes โดยตรง

สร้างไฟล์ใหม่:

- `hermes_usage.py`
  - อ่าน `state.db` แบบ read-only ผ่าน SQLite query
  - แปลง session ของ Hermes เป็นรายการ tracker
  - ใช้ `HERMES_HOME` ถ้ามี หรือ fallback ไป `%LOCALAPPDATA%\hermes\state.db`
  - ไม่อ่านหรือส่ง API key
  - ส่งออก `id`, date, provider, model, input/output, cache, reasoning, cost และ note

- `test_hermes_usage.py`
  - ทดสอบอ่าน session usage และ provider จาก SQLite fixture

ผลทดสอบล่าสุด:

```text
python test_hermes_usage.py
Ran 1 test ... OK

python hermes_usage.py
sessions= 20 tokens= 44512128
```

ตัวเลขข้างต้นเป็นข้อมูลที่อ่านได้จริงจาก Hermes state database ณ ตอนตรวจสอบ ไม่ใช่ค่าที่สร้างขึ้น

## ยังไม่เสร็จ

- ยังไม่ได้เชื่อม `hermes_usage.py` เข้ากับหน้าเว็บ
- ยังไม่มีปุ่ม `Sync Hermes`
- หน้าเว็บ production บน Vercel ยังอ่าน `state.db` ในเครื่องผู้ใช้ไม่ได้ เพราะ Vercel ไม่มีสิทธิ์เข้าถึงไฟล์ local ของเครื่องนี้
- ยังไม่มี local HTTP server/API สำหรับให้หน้าเว็บอ่านข้อมูล Hermes แบบอัตโนมัติ
- ยังไม่ได้ทำ auto-refresh/polling
- ยังไม่ได้ commit/push/deploy การเปลี่ยนแปลงรอบ Hermes
- ยังไม่มีการแสดง cache tokens และ reasoning tokens ใน UI

## ไฟล์ที่แก้/สร้างในรอบล่าสุด

รอบล่าสุดที่เริ่มทำ Hermes integration มีไฟล์ใหม่ที่ยังไม่ได้ commit:

- `hermes_usage.py` — reader/parser สำหรับ Hermes `state.db`
- `test_hermes_usage.py` — unit test ของ reader
- `HANDOFF2.md` — handoff ฉบับนี้

ไฟล์จากฟีเจอร์เดิมที่มีอยู่ใน repo และ deploy แล้ว:

- `index.html`
- `styles.css`
- `app.js`
- `usage-parser.js`
- `usage-parser.test.js`
- `README.md`
- `.gitignore`

## สถานะ Git ณ จุด handoff

- ฟีเจอร์เดิมถูก push ไป `main` แล้ว
- งาน Hermes integration (`hermes_usage.py`, `test_hermes_usage.py`) ยังเป็นงาน local ที่ยังไม่ commit/push
- `HANDOFF2.md` เป็นไฟล์ใหม่ที่กำลังถูกเขียนตามคำสั่ง handoff

## Next steps

1. สร้าง local server ด้วย Python standard library สำหรับเสิร์ฟเว็บและ endpoint เช่น `/api/hermes-usage` ที่เรียก `read_sessions()`
2. เพิ่มปุ่ม `Sync Hermes` ใน `index.html` และให้ `app.js` fetch endpoint local แล้ว merge รายการด้วย `hermes:<session_id>` เพื่อไม่เกิด duplicate
3. เพิ่ม auto-refresh ทุกประมาณ 15–30 วินาทีเมื่อเปิดผ่าน local server
4. แสดง source/provider/model/date และ cache/reasoning token ให้ชัดเจน
5. เพิ่มวิธีรันที่ง่าย เช่น `python local_server.py` และอัปเดต README
6. รัน unit test, syntax check และทดสอบ local HTTP จริง
7. commit การเปลี่ยนแปลง, push GitHub และ deploy Vercel
8. ระบุในหน้าเว็บให้ชัดว่า:
   - Vercel ใช้ดูข้อมูลที่ import/manual ได้
   - การ sync Hermes realtime ต้องเปิด local server บนเครื่องที่มี Hermes `state.db`

## ข้อควรระวัง

- ห้ามเขียนแก้ `state.db` ของ Hermes; อ่านอย่างเดียว
- ห้ามส่ง API key หรือ system prompt ออกจากเครื่อง
- Vercel ไม่สามารถอ่านไฟล์ `C:\Users\verak\AppData\Local\hermes\state.db` โดยตรง
- session token ใน Hermes เป็น cumulative ต่อ session ดังนั้นการ sync ต้องใช้ ID เดิมเพื่อ update ไม่ใช่ append ซ้ำ
- อย่ารายงานว่า realtime integration เสร็จจนกว่าจะมี local endpoint และทดสอบหน้าเว็บกับข้อมูล Hermes จริง
