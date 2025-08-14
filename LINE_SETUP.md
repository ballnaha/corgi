# การตั้งค่า LINE API สำหรับส่ง Flex Message

## ตัวแปรที่จำเป็นใน .env.local

สร้างไฟล์ `.env.local` ในรูท directory ของโปรเจ็ค:

```bash
# Database
DATABASE_URL="mysql://root:@localhost:3306/corgi"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-for-development"
NEXTAUTH_URL="http://localhost:3000"

# LINE OAuth (สำหรับ login ผู้ใช้)
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"

# LINE Messaging API (สำหรับส่ง message)
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"
LINE_CHANNEL_SECRET="your-line-channel-secret"

# Application
NODE_ENV="development"
```

⚠️ **หมายเหตุ**: หากไม่ได้ตั้งค่า `LINE_CHANNEL_ACCESS_TOKEN` ระบบจะยังคงทำงานได้ปกติ แต่จะไม่ส่ง LINE message และแสดงข้อความ "สั่งซื้อสำเร็จ! (LINE messaging ยังไม่ได้ตั้งค่า)"

### วิธีสร้างไฟล์ .env.local

**Windows (PowerShell):**
```powershell
# สร้างไฟล์ .env.local
New-Item -Path ".env.local" -ItemType File

# หรือใช้ echo เพื่อสร้างไฟล์พร้อมเนื้อหาเบื้องต้น
echo "DATABASE_URL=`"mysql://root:@localhost:3306/corgi`"" > .env.local
echo "NEXTAUTH_SECRET=`"your-secret-key-for-development`"" >> .env.local
echo "NEXTAUTH_URL=`"http://localhost:3000`"" >> .env.local
echo "LINE_CHANNEL_ACCESS_TOKEN=`"`"" >> .env.local
```

**หรือสร้างด้วยมือ:**
1. สร้างไฟล์ใหม่ชื่อ `.env.local` ในโฟลเดอร์หลักของโปรเจ็ค
2. คัดลอกเนื้อหาข้างบนใส่ในไฟล์
3. ใส่ค่าจริงของ LINE tokens

## ขั้นตอนการตั้งค่า

### 1. สร้าง LINE Messaging API Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider ใหม่หรือเลือก Provider ที่มีอยู่
3. สร้าง Channel ใหม่ประเภท "Messaging API"
4. ตั้งค่าชื่อ Channel และข้อมูลอื่นๆ

### 2. รับ Channel Access Token

1. ในหน้า Channel Settings
2. ไปที่แท็บ "Messaging API"
3. สร้าง Channel Access Token
4. คัดลอกและเก็บ Token นี้ใส่ใน `LINE_CHANNEL_ACCESS_TOKEN`

### 3. รับ Channel Secret

1. ในหน้า Channel Settings
2. ไปที่แท็บ "Basic Settings"
3. คัดลอก Channel Secret
4. เก็บ Secret นี้ใส่ใน `LINE_CHANNEL_SECRET`

### 4. ตั้งค่า Webhook (ถ้าต้องการ)

1. ในแท็บ "Messaging API"
2. ตั้งค่า Webhook URL: `https://yourdomain.com/api/webhooks/line`
3. เปิดใช้งาน Webhook

## การทำงานของระบบ

### เมื่อผู้ใช้สั่งซื้อสินค้า:

1. ✅ ข้อมูลการสั่งซื้อจะถูกประมวลผล
2. ✅ สร้าง Flex Message ในรูปแบบใบเสร็จ
3. ✅ ส่ง Message ไปยัง LINE ของผู้ใช้
4. ✅ แสดงการยืนยันว่าส่งสำเร็จหรือไม่

### รูปแบบใบเสร็จ Flex Message:

- 🐾 Header ของร้าน
- 📄 เลขที่คำสั่งซื้อ
- 👤 ข้อมูลลูกค้า
- 🛍️ รายการสินค้าทั้งหมด
- 💰 สรุปราคา (รวมส่วนลด/ค่าจัดส่ง)
- 📦 ข้อมูลการจัดส่ง
- ⏰ วันที่/เวลาสั่งซื้อ

### กรณีชำระมัดจำ:

- แสดงยอดมัดจำที่ชำระ (20%)
- แสดงยอดคงเหลือที่ต้องชำระเมื่อรับสินค้า
- แสดงข้อมูลการรับสินค้าด้วยตัวเอง

## การทดสอบ

1. เข้าสู่ระบบด้วย LINE
2. เพิ่มสินค้าลงตะกร้า
3. ไปที่หน้า Checkout
4. กรอกข้อมูลและกดสั่งซื้อ
5. ตรวจสอบ LINE ว่าได้รับ Flex Message หรือไม่

## หมายเหตุ

- ต้องมี LINE_CHANNEL_ACCESS_TOKEN เพื่อส่ง message ได้
- ผู้ใช้ต้อง login ด้วย LINE เพื่อให้ระบบทราบ LINE User ID
- Flex Message จะส่งไปยัง LINE User ID ที่ได้จาก session
