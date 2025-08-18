# การตั้งค่า LIFF Auto Login

## ภาพรวม

ระบบ LIFF Auto Login ช่วยให้ผู้ใช้ที่เข้าผ่าน LINE LIFF สามารถเข้าสู่ระบบอัตโนมัติโดยไม่ต้องกดปุ่ม "เข้าสู่ระบบ" ใหม่

## การตั้งค่า Environment Variables

เพิ่มตัวแปรต่อไปนี้ในไฟล์ `.env.local`:

```bash
# LIFF Configuration
NEXT_PUBLIC_LIFF_ID="your-liff-id-here"

# LINE OAuth (จำเป็นสำหรับ auto login)
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"

# NextAuth Configuration
NEXTAUTH_URL="https://corgi.theredpotion.com"
NEXTAUTH_SECRET="your-secret-key"
```

## Callback URL Configuration

ใน LINE Developer Console ให้ตั้งค่า Callback URL ดังนี้:

```
https://corgi.theredpotion.com/api/auth/callback/line
```

## วิธีการทำงาน

### 1. LIFF Environment Detection
- ระบบจะตรวจสอบว่าผู้ใช้เข้าผ่าน LIFF environment หรือไม่
- ตรวจสอบ User Agent และ URL patterns

### 2. LIFF Auto Login Flow
1. เมื่อเข้าผ่าน LIFF และ LIFF ล็อกอินแล้ว
2. ระบบจะเรียก `signIn('line')` อัตโนมัติ
3. NextAuth จะจัดการ OAuth flow กับ LINE
4. ผู้ใช้จะถูก redirect กลับมาพร้อม session

### 3. การจัดการ Session
- ใช้ NextAuth session management
- Session จะถูกสร้างหลังจาก LINE OAuth สำเร็จ
- ข้อมูลผู้ใช้จะถูกบันทึกในฐานข้อมูล

## ไฟล์ที่เกี่ยวข้อง

### Frontend Components
- `src/hooks/useLiff.ts` - LIFF SDK integration และ auto login logic
- `src/components/LineAuthProvider.tsx` - Authentication wrapper
- `src/middleware.ts` - LIFF environment detection

### Backend Configuration
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API routes

## การทดสอบ

### ในสภาพแวดล้อม Development
1. ตั้งค่า LIFF URL ใน LINE Developer Console
2. เปิด LIFF app จาก LINE
3. ตรวจสอบ console logs สำหรับ auto login process

### ใน Production
1. ให้แน่ใจว่า Callback URL ตั้งค่าถูกต้อง
2. ตรวจสอบ HTTPS certificate
3. ทดสอบจาก LINE app จริง

## Debug และ Troubleshooting

### Console Logs
ระบบจะแสดง logs ดังนี้:
- `🔄 Starting LIFF auto login process...`
- `✅ User already authenticated via NextAuth`
- `🔗 Triggering NextAuth LINE login for LIFF user...`

### Common Issues
1. **LIFF ID ไม่ถูกต้อง**: ตรวจสอบ `NEXT_PUBLIC_LIFF_ID`
2. **Callback URL ผิด**: ตรวจสอบ URL ใน LINE Developer Console
3. **Environment Variables**: ตรวจสอบ `.env.local`

### Error Handling
- หาก auto login ไม่สำเร็จ ผู้ใช้จะเห็นหน้า signin ปกติ
- ระบบจะแสดง error message ใน console
- ผู้ใช้สามารถล็อกอินด้วยตนเองได้

## Performance Considerations

- LIFF SDK จะถูกโหลดแบบ lazy loading
- Auto login จะทำงานเฉพาะใน LIFF environment
- Session จะถูก cache เพื่อประสิทธิภาพ

## Security

- ใช้ NextAuth สำหรับ session management
- LINE OAuth tokens จะถูกตรวจสอบกับ LINE API
- State parameter ถูกใช้เพื่อป้องกัน CSRF attacks
