# วิธีการหา LINE User ID สำหรับ Admin Notification

## ภาพรวม
คุณต้องการหา **LINE User ID** ของบัญชีที่จะรับ notification คำสั่งซื้อใหม่

## วิธีที่ 1: ใช้ Messaging API Console (แนะนำ)

### ขั้นตอน:
1. เปิดเบราว์เซอร์ไปที่ https://developers.line.biz/console/
2. Login ด้วยบัญชี LINE ที่ใช้สร้าง Official Account
3. เลือก **Provider** ของคุณ
4. เลือก **Channel** (Messaging API)
5. ไปที่แท็บ **"Messaging API"**
6. เลื่อนลงมาหาส่วน **"Your user ID"**
7. คัดลอก User ID (รูปแบบ: `Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### ตัวอย่าง:
```
Your user ID: U1234567890abcdefghijklmnopqrstu
```

---

## วิธีที่ 2: ใช้ LINE Notify API (สำหรับ advanced users)

### ขั้นตอน:
1. สร้าง test endpoint ใน project:

```typescript
// src/app/api/line/get-my-id/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    lineUserId: session?.user?.lineUserId,
    displayName: session?.user?.name,
  });
}
```

2. Login เข้าระบบผ่าน LINE
3. เข้า URL: `https://your-domain.com/api/line/get-my-id`
4. คัดลอก `lineUserId` จาก response

---

## วิธีที่ 3: ใช้ Webhook Test

### ขั้นตอน:
1. ไปที่ LINE Developers Console > Messaging API
2. ตั้งค่า Webhook URL (ถ้ายังไม่ได้ตั้ง)
3. เปิด **"Use webhook"** และ **"Verify"** webhook
4. สร้าง temporary endpoint เพื่อดู webhook payload:

```typescript
// src/app/api/line/webhook-test/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  console.log("=== LINE WEBHOOK RECEIVED ===");
  console.log(JSON.stringify(body, null, 2));
  
  // หา userId จาก events
  const events = body.events || [];
  const userIds = events.map((event: any) => event.source?.userId);
  
  console.log("User IDs:", userIds);
  
  return NextResponse.json({ ok: true });
}
```

5. ส่งข้อความใดๆ ไปที่ Official Account ของคุณ
6. ดู console logs จะเห็น `userId` ในส่วน `events[0].source.userId`

### ตัวอย่าง Webhook Payload:
```json
{
  "events": [
    {
      "type": "message",
      "source": {
        "type": "user",
        "userId": "U1234567890abcdefghijklmnopqrstu"  // <-- นี่คือที่ต้องการ
      },
      "message": {
        "type": "text",
        "text": "สวัสดี"
      }
    }
  ]
}
```

---

## วิธีที่ 4: ใช้ LINE Login (ถ้ามี NextAuth setup)

### ขั้นตอน:
1. Login เข้าระบบด้วย LINE account ที่ต้องการรับ notification
2. เปิด Developer Tools (F12)
3. ไปที่ Console
4. พิมพ์คำสั่ง:
```javascript
fetch('/api/auth/session')
  .then(r => r.json())
  .then(d => console.log('LINE User ID:', d.user?.lineUserId))
```
5. คัดลอก LINE User ID จาก console

---

## การตรวจสอบ User ID ที่ได้

✅ **User ID ที่ถูกต้อง:**
- ขึ้นต้นด้วย `U` (ตัวพิมพ์ใหญ่)
- มีความยาว **33 ตัวอักษร**
- ประกอบด้วย a-z, A-Z, 0-9 เท่านั้น
- ตัวอย่าง: `U1234567890abcdefghijklmnopqrstu`

❌ **User ID ที่ผิด:**
- `@xxx` - นี่คือ LINE ID ไม่ใช่ User ID
- `xxx-yyy-zzz` - นี่คือ Display Name
- ขึ้นต้นด้วย `C` หรือ `R` - นี่คือ Group ID หรือ Room ID

---

## หลังจากได้ User ID แล้ว

1. เปิดไฟล์ `.env.local`
2. เพิ่มบรรทัด:
```bash
LINE_ADMIN_USER_ID=U1234567890abcdefghijklmnopqrstu
```
3. **Restart application**
4. ทดสอบโดยสร้างคำสั่งซื้อใหม่

---

## การทดสอบ

### Test Script (Optional):
```typescript
// src/app/api/line/test-admin-notify/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const adminUserId = process.env.LINE_ADMIN_USER_ID;
  
  if (!adminUserId) {
    return NextResponse.json({ 
      error: "LINE_ADMIN_USER_ID not configured" 
    }, { status: 400 });
  }
  
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: adminUserId,
      messages: [
        {
          type: "text",
          text: "✅ Test notification successful! Admin notification is working."
        }
      ]
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true,
    message: "Test message sent to admin!" 
  });
}
```

**ใช้งาน:**
```bash
curl http://localhost:3000/api/line/test-admin-notify
```

---

## Troubleshooting

### ❌ Error: "Invalid user ID"
- ตรวจสอบว่า User ID ขึ้นต้นด้วย `U` และมี 33 ตัวอักษร
- ลองคัดลอก User ID ใหม่ (อาจมี space หรือ newline ติดมา)

### ❌ Error: "The request body has X error(s)"
- ตรวจสอบว่า LINE Channel Access Token ถูกต้อง
- ตรวจสอบว่า webhook ใช้งานได้

### ❌ ไม่ได้รับ notification
- ตรวจสอบว่า admin account เป็นเพื่อนกับ Official Account แล้ว
- ตรวจสอบว่าไม่ได้ block Official Account

---

## คำแนะนำด้านความปลอดภัย

🔒 **Best Practices:**
1. ใช้ account แยกสำหรับ admin เท่านั้น
2. อย่าแชร์ User ID ให้คนอื่น
3. เก็บ `.env.local` เป็นความลับ (อย่า commit ลง Git)
4. ใช้ LINE Official Account ที่ตั้งค่า 2FA เรียบร้อย

---

## คำถามที่พบบ่อย

**Q: ใช้ @username ได้ไหม?**  
A: ไม่ได้ ต้องใช้ User ID ที่ขึ้นต้นด้วย `U` เท่านั้น

**Q: สามารถส่งให้หลาย admin ได้ไหม?**  
A: ปัจจุบันรองรับ 1 admin เท่านั้น หากต้องการหลายคน แนะนำให้สร้าง LINE Group แทน

**Q: ต้อง restart server ทุกครั้งหรือไม่?**  
A: ใช่ เพราะ environment variable จะโหลดตอน startup เท่านั้น

**Q: User ID มีวันหมดอายุไหม?**  
A: ไม่มี User ID จะไม่เปลี่ยนตลอดชีพของ LINE account
