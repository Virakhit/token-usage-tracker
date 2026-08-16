# Token Usage Tracker

เว็บเล็กๆ แบบ local-only สำหรับบันทึกจำนวน token แยกตาม provider/model

## ใช้งาน

เปิด `index.html` ด้วย browser ได้เลย ไม่ต้องติดตั้ง dependency หรือ backend

- เพิ่ม provider, model, input/output tokens, cost และวันที่
- สรุป total tokens / requests / input / output
- ค้นหาและลบรายการ
- Export เป็น CSV
- Import response/log แบบ JSON หรือ JSONL จาก OpenAI, Anthropic และ Gemini อัตโนมัติ
- ข้อมูลเก็บใน `localStorage` ของ browser เท่านั้น

## รูปแบบที่รองรับ

นำ response JSON หรือไฟล์ JSONL ที่มีโครงสร้าง usage มาวาง/เลือกไฟล์ได้ เช่น

- OpenAI: `usage.prompt_tokens` และ `usage.completion_tokens`
- Anthropic: `usage.input_tokens` และ `usage.output_tokens`
- Gemini: `usageMetadata.promptTokenCount` และ `usageMetadata.candidatesTokenCount`

การเรียก API จริงจากหน้าเว็บโดยตรงไม่ใส่ไว้ในแอป เพราะจะทำให้ API key รั่ว ฝั่ง production ควรส่ง response/log ที่ไม่มี secret เข้ามาแทน
