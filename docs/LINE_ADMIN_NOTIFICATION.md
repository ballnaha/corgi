# LINE Admin Notification Setup Guide

## ภาพรวม
ระบบจะส่ง LINE notification ให้ admin เมื่อมีคำสั่งซื้อใหม่เข้ามา ทั้งจากการชำระด้วย:
- **บัตรเครดิต (Stripe)** - ส่งทันทีเมื่อชำระสำเร็จผ่าน webhook
- **โอนเงินผ่านธนาคาร** - ส่งทันทีเมื่อลูกค้าสั่งซื้อ (สถานะ PENDING)
- **วิธีอื่นๆ** - ส่งทันทีเมื่อลูกค้าสั่งซื้อ

## การตั้งค่า

### 1. หา LINE User ID ของ Admin

#### วิธีที่ 1: ใช้ Official Account Manager
1. ไปที่ https://developers.line.biz/console/
2. เลือก Provider และ Channel ของคุณ
3. ไปที่แท็บ "Messaging API"
4. เลื่อนลงมาหาส่วน "Your user ID"
5. คัดลอก User ID (รูปแบบ: `Uxxxxxxxxxxxxxxxxx`)

#### วิธีที่ 2: ใช้ Webhook Test
1. ส่งข้อความอะไรก็ได้ไปที่ Official Account ของคุณ
2. ดูใน webhook logs จะเห็น `userId` ในส่วน `source`

### 2. เพิ่ม Environment Variable

แก้ไขไฟล์ `.env.local`:

```bash
# LINE Admin Notification
LINE_ADMIN_USER_ID=U1234567890abcdefghijklmnopqrstu
```

**หมายเหตุ:** 
- ห้ามมีเครื่องหมาย quotes (" หรือ ')
- User ID ต้องขึ้นต้นด้วย `U` และมีความยาว 33 ตัวอักษร

### 3. Restart Application

หลังจากเพิ่ม environment variable แล้ว ต้อง restart application:

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## รูปแบบ Notification

### สำหรับ User (ลูกค้า)
ได้รับใบเสร็จรายละเอียดแบบเต็ม ประกอบด้วย:
- ข้อมูลคำสั่งซื้อ (Order Number, Customer Name, Phone)
- รายการสินค้าทั้งหมด (สูงสุด 5 รายการแรก)
- สรุปการชำระเงิน (ยอดรวม, ค่าจัดส่ง, ส่วนลด)
- สถานะคำสั่งซื้อ
- ที่อยู่จัดส่ง

### สำหรับ Admin
ได้รับ notification แบบย่อ ประกอบด้วย:
- 🔔 หัวข้อ "คำสั่งซื้อใหม่!"
- Order Number
- ชื่อลูกค้า และ เบอร์โทร
- **รายการสินค้า (3 อันแรก พร้อมราคา)**
- จำนวนสินค้าทั้งหมด
- วิธีการจัดส่ง
- **ยอดเงินที่ต้องเก็บ** (มัดจำหรือเต็มจำนวน)
- สถานะการชำระเงิน (ชำระแล้ว/รอชำระ)
- วิธีการชำระเงิน (บัตรเครดิต/โอนเงิน)
- ที่อยู่จัดส่ง (แบบย่อ)
- ปุ่ม "ดูรายละเอียดเต็ม" → ไปที่หน้า Admin Orders

## การทำงาน

### กรณี: ลูกค้าชำระด้วยบัตรเครดิต (Stripe)
1. ลูกค้ากดปุ่ม "ชำระเงิน" → ไปหน้า Stripe Checkout
2. ลูกค้าชำระเงินสำเร็จ
3. Stripe ส่ง webhook มาที่ `/api/stripe/webhook`
4. ระบบสร้าง order ด้วยสถานะ `CONFIRMED`
5. **ส่ง notification ให้ user** (ใบเสร็จเต็ม)
6. **ส่ง notification ให้ admin** (แจ้งเตือนคำสั่งซื้อใหม่)

### กรณี: ลูกค้าชำระด้วยโอนเงิน/วิธีอื่นๆ
1. ลูกค้ากดปุ่ม "ชำระเงิน"
2. ระบบสร้าง order ด้วยสถานะ `PENDING`
3. **ส่ง notification ให้ user** (ใบเสร็จ + แจ้งให้โอนเงิน)
4. **ส่ง notification ให้ admin** (แจ้งเตือนคำสั่งซื้อใหม่)

## ข้อดีของระบบ

✅ **สำหรับ Admin:**
- รับแจ้งเตือนทันทีเมื่อมีคำสั่งซื้อใหม่
- ดูข้อมูลสรุปได้ทันทีโดยไม่ต้องเปิด Admin Panel
- **เห็นรายการสินค้า 3 อันแรกพร้อมราคา** (ถ้ามีมากกว่า 3 จะบอกจำนวนที่เหลือ)
- คลิกปุ่มเดียวไปดูรายละเอียดเต็มได้เลย
- แยกแยะได้ชัดว่าชำระแล้วหรือยัง

✅ **สำหรับ User:**
- ได้รับใบเสร็จรายละเอียดครบถ้วน
- สามารถดูข้อมูลคำสั่งซื้อได้ทุกเมื่อ
- ไม่รบกวน admin ในการขอใบเสร็จ

✅ **สำหรับระบบ:**
- ไม่ส่ง spam (แยกข้อความ user/admin ชัดเจน)
- ถ้าส่งให้ admin ไม่สำเร็จ ยังส่งให้ user ได้ปกติ
- Graceful degradation (ถ้าไม่ตั้งค่า LINE_ADMIN_USER_ID ก็ไม่ error)

## Troubleshooting

### ไม่ได้รับ notification
1. ตรวจสอบ `LINE_ADMIN_USER_ID` ถูกต้องหรือไม่
2. ตรวจสอบ LINE Channel Access Token ใช้งานได้หรือไม่
3. ดู logs ใน console:
   ```
   👨‍💼 Sending admin notification to: Uxxxxx...
   ✅ Admin notification sent successfully
   ```

### ได้รับ notification แต่ไม่ครบ
- ตรวจสอบว่า restart application แล้วหรือยัง
- ลอง clear cache ของ LINE app

### Error: "LINE_API_NOT_CONFIGURED"
- ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN` ในไฟล์ `.env.local`
- ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ

## Logs ที่ควรเห็น

```
🚀 LINE API called
🔍 Request source check:
  User-Agent: ...
  Is webhook call: false/true
📝 Parsing receipt data...
✅ Flex message created successfully
🚀 Calling sendLineMessage...
🎯 Target LINE User ID: Uxxxxx...
📨 sendLineMessage completed with status: 200
👨‍💼 Sending admin notification to: Uxxxxx...
✅ Admin notification sent successfully with status: 200
```

## Security Note

⚠️ **ข้อควรระวัง:**
- อย่า commit ไฟล์ `.env.local` ลง Git
- LINE_ADMIN_USER_ID เป็นข้อมูลส่วนตัว
- ใช้ LINE Official Account ที่ตั้งค่าความปลอดภัยเรียบร้อย
