# Token Usage Tracker

เว็บเล็กๆ แบบ local-only สำหรับบันทึกจำนวน token แยกตาม provider/model

## ใช้งาน

เปิด `index.html` ด้วย browser ได้เลย ไม่ต้องติดตั้ง dependency หรือ backend

- เพิ่ม provider, model, input/output tokens, cost และวันที่
- สรุป total tokens / requests / input / output
- ค้นหาและลบรายการ
- Export เป็น CSV
- ข้อมูลเก็บใน `localStorage` ของ browser เท่านั้น

> ตอนนี้เป็น manual log ถ้าจะต่อ API จริงภายหลัง สามารถเพิ่ม ingestion endpoint หรืออ่านจาก log ของ provider ได้
