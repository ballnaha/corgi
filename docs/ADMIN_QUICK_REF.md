# 🚀 Quick Reference: Admin Notification

## การตั้งค่าใน 3 ขั้นตอน

### 1️⃣ หา LINE User ID
```
https://developers.line.biz/console/
→ Provider → Channel → Messaging API
→ "Your user ID" → คัดลอก (Uxxxxx...)
```

### 2️⃣ เพิ่ม Environment Variable
```bash
# ไฟล์: .env.local
LINE_ADMIN_USER_ID=U1234567890abcdefghijklmnopqrstu
```

### 3️⃣ Restart Application
```bash
npm run dev
# หรือ production: npm start
```

---

## ✅ Checklist

- [ ] เป็นเพื่อนกับ Official Account แล้ว
- [ ] ได้ LINE User ID แล้ว (ขึ้นต้นด้วย `U`, ยาว 33 ตัว)
- [ ] เพิ่ม `LINE_ADMIN_USER_ID` ใน `.env.local` แล้ว
- [ ] Restart application แล้ว
- [ ] ทดสอบสั่งซื้อแล้ว → ได้รับ notification

---

## 🔍 Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|--------|
| ไม่ได้รับ notification | ตรวจสอบ User ID ถูกต้องหรือไม่ |
| Error: Invalid user ID | ต้องขึ้นต้นด้วย `U` และยาว 33 ตัว |
| ได้รับแต่ไม่ครบ | Restart application |
| Notification ว่างเปล่า | ตรวจสอบ Channel Access Token |

---

## 📊 ข้อมูลที่ได้รับ

```
🔔 คำสั่งซื้อใหม่!
─────────────
Order: #OR12345678
ลูกค้า: คุณ ABC
เบอร์: 081-xxx-xxxx
─────────────
�️ สินค้า (3 รายการ)
1. สินค้า A    x2  ฿500
2. สินค้า B    x1  ฿800
3. สินค้า C    x3  ฿200
─────────────
�💳 ยอด: ฿1,500
สถานะ: ⏳/✅
─────────────
[ดูรายละเอียดเต็ม]
```

---

## 🎯 สิ่งที่ควรรู้

### ส่งเมื่อไหร่?
✅ ลูกค้าสั่งซื้อ (ทุกช่องทาง)  
✅ ลูกค้าชำระเงินด้วยบัตร (Stripe)

### ส่งอะไร?
✅ Order Number  
✅ ชื่อ + เบอร์ลูกค้า  
✅ **รายการสินค้า (3 อันแรก + ราคา)**  
✅ ยอดเงิน (มัดจำ/เต็ม)  
✅ สถานะการชำระ  
✅ ที่อยู่จัดส่ง  

### ไม่ส่งเมื่อไหร่?
❌ ลูกค้าดูสินค้า  
❌ ลูกค้าใส่ตะกร้า  
❌ ลูกค้า login  

---

## 📚 เอกสารเพิ่มเติม

- [LINE_ADMIN_NOTIFICATION.md](./LINE_ADMIN_NOTIFICATION.md) - คู่มือละเอียด
- [HOW_TO_GET_LINE_USER_ID.md](./HOW_TO_GET_LINE_USER_ID.md) - วิธีหา User ID
- [LINE_NOTIFICATION_EXAMPLES.md](./LINE_NOTIFICATION_EXAMPLES.md) - ตัวอย่างข้อความ

---

## 🔒 Security

⚠️ **ห้าม:**
- ❌ Commit `.env.local` ลง Git
- ❌ แชร์ User ID ให้คนอื่น
- ❌ ใช้ User ID ของลูกค้า

✅ **ควร:**
- ✅ ใช้ account แยกสำหรับ admin
- ✅ เปิด 2FA ใน LINE account
- ✅ Backup `.env.local` ไว้ปลอดภัย

---

## 🧪 Test Commands

### ทดสอบส่ง notification (ถ้ามี test endpoint)
```bash
curl http://localhost:3000/api/line/test-admin-notify
```

### ดู User ID จาก session
```javascript
// Developer Tools Console
fetch('/api/auth/session')
  .then(r => r.json())
  .then(d => console.log(d.user?.lineUserId))
```

---

## 📞 Support

ถ้าติดปัญหา:
1. ตรวจสอบ logs ใน console
2. ดูคู่มือใน `/docs`
3. ลองทดสอบด้วย test script

---

**เวอร์ชัน:** 1.0  
**อัปเดต:** 4 ตุลาคม 2568  
**สถานะ:** ✅ พร้อมใช้งาน
