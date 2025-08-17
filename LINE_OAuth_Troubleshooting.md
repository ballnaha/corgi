# แก้ไขปัญหา LINE OAuth "State cookie was missing"

## สาเหตุของปัญหา

ปัญหา "State cookie was missing" ในการเข้าสู่ระบบ LINE ครั้งแรกมักเกิดจาก:

1. **Callback URL ไม่ตรงกัน** - URL ที่ตั้งใน LINE Developer Console ไม่ตรงกับ localhost
2. **State parameter หายไป** - เบราว์เซอร์บล็อกหรือลบ cookies ระหว่าง OAuth flow
3. **Session configuration ไม่เหมาะสม** - การตั้งค่า NextAuth ไม่ครบถ้วน

## การแก้ไขที่ได้ทำไปแล้ว ✅

### 1. ปรับปรุง NextAuth Configuration
```typescript
// เพิ่มการตั้งค่า cookies ครบถ้วน
cookies: {
  sessionToken: { /* ... */ },
  callbackUrl: { /* ... */ },
  csrfToken: { /* ... */ },
  state: {
    name: `next-auth.state`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60, // 10 minutes
    },
  },
  // ...
}
```

### 2. เพิ่มการตรวจสอบ State Parameter
```typescript
{
  id: "line",
  name: "LINE",
  type: "oauth",
  authorization: {
    url: "https://access.line.me/oauth2/v2.1/authorize",
    params: {
      scope: "profile",
      response_type: "code",
      state: true, // เพิ่มการจัดการ state
    },
  },
  checks: ["state"], // บังคับตรวจสอบ state
}
```

### 3. ปรับปรุงหน้า Error Handler
- เพิ่มข้อความอธิบายปัญหาที่ชัดเจน
- เพิ่มปุ่ม "ล้างแคชและลองใหม่" สำหรับ OAuth errors
- การจัดการ error แบบเฉพาะเจาะจง

## วิธีแก้ปัญหาเพิ่มเติม

### 1. ตรวจสอบ LINE Developer Console

ไปที่ [LINE Developers](https://developers.line.biz/) และตรวจสอบ:

1. **Login Channel Settings:**
   - Callback URL: `http://localhost:3000/api/auth/callback/line`
   - App types: Web app
   - Email permission: Optional

2. **Channel ID และ Secret:**
   ```
   LINE_CLIENT_ID="2007609360"
   LINE_CLIENT_SECRET="c21d2e938f3fe568bb4cbce60686f994"
   ```

### 2. ล้างแคชเบราว์เซอร์

```javascript
// ใช้ปุ่มใน error page หรือทำด้วยตนเอง:
// 1. เปิด Developer Tools (F12)
// 2. ไปที่ Application/Storage tab
// 3. ลบ cookies ทั้งหมดสำหรับ localhost:3000
// 4. ลองเข้าสู่ระบบใหม่
```

### 3. ทดสอบขั้นตอนการแก้ไข

1. **ปิดเบราว์เซอร์ทั้งหมด**
2. **เปิดเบราว์เซอร์ใหม่**
3. **ไปที่ `http://localhost:3000/auth/signin`**
4. **คลิก "เข้าสู่ระบบด้วย LINE"**
5. **หากเกิด error ให้คลิก "🧹 ล้างแคชและลองใหม่"**

## ตรวจสอบการทำงาน

### เมื่อสำเร็จจะเห็น:
```
✅ LINE OAuth sign-in successful {
  userId: "...",
  provider: "line",
  accountId: "..."
}
```

### เมื่อเกิดปัญหาจะเห็น:
```
GET /api/auth/error?error=OAuthCallback 302
```

## หากยังมีปัญหา

1. **ตรวจสอบ Network Tab ใน Developer Tools**
2. **ดู Console สำหรับ error messages**
3. **ตรวจสอบว่า .env.local มีค่าครบถ้วน**
4. **ลอง restart development server**

## การป้องกันในอนาคต

1. **ใช้ HTTPS ใน production**
2. **ตั้งค่า domain ที่ถาวร**
3. **ตรวจสอบ LINE app configuration อย่างสม่ำเสมอ**
4. **Backup การตั้งค่า environment variables**

---

**หมายเหตุ:** การแก้ไขเหล่านี้จะช่วยให้การเข้าสู่ระบบ LINE ทำงานได้เสถียรขึ้น และมีการจัดการ error ที่ดีขึ้น
