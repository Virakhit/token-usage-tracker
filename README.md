# Token Usage Tracker

เว็บเล็กๆ แบบ local-first สำหรับบันทึกจำนวน token แยกตาม provider/model — และ sync ข้อมูล token ที่ **Hermes Agent ใช้จริง** จาก `state.db` ในเครื่อง

## ใช้งานแบบ static (Vercel / เปิด index.html ตรงๆ)

เปิด `index.html` ด้วย browser ได้เลย ไม่ต้องติดตั้ง dependency หรือ backend

- เพิ่ม provider, model, input/output tokens, cost และวันที่
- สรุป total tokens / cache tokens / requests / input / output
- ค้นหาและลบรายการ
- Export เป็น CSV (รวม cache/reasoning)
- Import response/log แบบ JSON หรือ JSONL จาก OpenAI, Anthropic และ Gemini อัตโนมัติ
- ข้อมูลเก็บใน `localStorage` ของ browser เท่านั้น

## ใช้งานแบบ realtime Hermes sync (local server)

อยากเห็น token ที่ Hermes ใช้จริง (อ่านจากเครื่องนี้เอง) ให้รัน local server ที่โฟลเดอร์โปรเจกต์:

```bash
python local_server.py
# แล้วเปิด http://127.0.0.1:8787
```

- ปุ่ม **Sync Hermes** จะ enabled เมื่อตรวจพบ local server → fetch `/api/hermes-usage` แล้ว upsert ตาม id `hermes:<session_id>` (update เดิม ไม่ append ซ้ำ)
- auto-refresh ทุก ~20 วินาทีขณะเปิดผ่าน local server
- แสดง cache_read / cache_write / reasoning token และ badge source (Hermes / local)
- server อ่าน `state.db` แบบ read-only เท่านั้น ไม่ส่ง API key หรือ system prompt ออกนอกเครื่อง

ตัวเลือกคำสั่ง:

```bash
python local_server.py --port 9000      # เปลี่ยน port (default 8787)
python local_server.py --db C:/path/state.db   # ระบุ path state.db เอง (default: อ่านอัตโนมัติ)
```

## ข้อควรระวัง / ขอบเขต

- **Vercel ใช้ดูข้อมูล manual/import ที่คุณบันทึกเอง** — ไม่สามารถอ่าน `C:\Users\verak\AppData\Local\hermes\state.db` ในเครื่องได้
- **การ sync Hermes realtime ต้องเปิด local server บนตัวเครื่องที่มี `state.db`** (เครื่องที่รัน Hermes)
- ห้ามเขียนแก้ `state.db`; อ่านอย่างเดียว
- session token ใน Hermes เป็น cumulative ต่อ session → sync ใช้ id เดิมเพื่อ update ไม่ใช่ append ซ้ำ

## รูปแบบที่รองรับ (import ไฟล์)

นำ response JSON หรือไฟล์ JSONL ที่มีโครงสร้าง usage มาวาง/เลือกไฟล์ได้ เช่น

- OpenAI: `usage.prompt_tokens` และ `usage.completion_tokens`
- Anthropic: `usage.input_tokens` และ `usage.output_tokens`
- Gemini: `usageMetadata.promptTokenCount` และ `usageMetadata.candidatesTokenCount`

การเรียก API จริงจากหน้าเว็บโดยตรงไม่ใส่ไว้ในแอป เพราะจะทำให้ API key รั่ว ฝั่ง production ควรส่ง response/log ที่ไม่มี secret เข้ามาแทน

## โครงสร้างไฟล์

- `index.html` / `styles.css` — UI
- `app.js` — logic ฝั่ง browser (localStorage, render, sync Hermes, auto-refresh)
- `usage-parser.js` — parser import log OpenAI/Anthropic/Gemini
- `hermes_usage.py` — reader Hermes `state.db` (read-only, คืนรายการ session usage)
- `local_server.py` — local HTTP server + endpoint `/api/hermes-usage`
- `test_hermes_usage.py` — unit test ของ reader