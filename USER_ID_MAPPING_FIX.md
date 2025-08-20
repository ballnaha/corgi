# แก้ไขปัญหา User ID Mapping

## 🐛 ปัญหาที่พบ

ระบบมีปัญหาในการ mapping ระหว่าง LINE User ID และ Internal Database ID:

1. **Session User ID**: ใช้ LINE User ID (`U240b6492c0bffe4c330ce3457459b35f`)
2. **Database Orders**: ค้นหาด้วย User ID ที่ไม่ตรงกัน
3. **ผลลัพธ์**: ไม่พบ orders สำหรับ user

## 🔧 การแก้ไขที่ทำ

### 1. แก้ไข NextAuth Configuration (`src/lib/auth.ts`)
- เพิ่ม `token.id` เพื่อเก็บ internal database ID
- ปรับ `session.user.id` ให้ใช้ internal ID แทน LINE ID
- เพิ่ม fallback เพื่อรองรับ backward compatibility

### 2. ปรับปรุง Orders API (`src/app/api/orders/route.ts`)
- เพิ่มการตรวจสอบ user ID mapping
- รองรับทั้ง internal ID และ LINE ID
- เพิ่ม logging เพื่อ debug

### 3. สร้างสคริปต์ตรวจสอบ (`scripts/fix-user-id-mapping.js`)
- ตรวจสอบข้อมูล users และ orders ในฐานข้อมูล
- แสดง ID mapping patterns

## 📋 วิธีการทดสอบ

### 1. รันสคริปต์ตรวจสอบ
```bash
node scripts/fix-user-id-mapping.js
```

### 2. ทดสอบการล็อกอินใหม่
1. ลงชื่อออกจากระบบ
2. ลงชื่อเข้าใช้ผ่าน LINE อีกครั้ง
3. ตรวจสอบ console logs สำหรับ user ID ใหม่

### 3. ทดสอบ Payment Notification
1. เข้าหน้า payment-notification ด้วย orderNumber ที่ถูกต้อง
2. ตรวจสอบ console สำหรับ debug information
3. ตรวจสอบว่าระบบแสดงข้อมูลได้ถูกต้อง

## 🔍 Debug Information ที่ควรดู

### Console Logs ที่สำคัญ:
```
✅ Found user by lineUserId, using internal ID: [INTERNAL_ID]
Using userId for orders search: [INTERNAL_ID]
Searching for order with orderNumber: [ORDER_NUMBER]
```

### การตรวจสอบ Session:
```javascript
// ใน browser console
console.log(await fetch('/api/auth/session').then(r => r.json()));
```

## 🚨 หากยังมีปัญหา

### กรณีที่ 1: User ไม่มี Orders
- ตรวจสอบว่า orders ในฐานข้อมูลใช้ user ID ที่ถูกต้อง
- รันสคริปต์ตรวจสอบเพื่อดูความสัมพันธ์

### กรณีที่ 2: Session ID ยังไม่อัปเดต
- ลงชื่อออกและเข้าใหม่
- เคลียร์ browser cache/cookies
- ตรวจสอบ NextAuth configuration

### กรณีที่ 3: Orders ไม่ตรงกับ User
- ตรวจสอบ userId ใน orders table
- อาจต้องอัปเดต orders ให้ใช้ internal user ID

## 📞 ติดต่อ Support

หากยังมีปัญหา กรุณาส่งข้อมูลดังนี้:
1. Console logs จากการรันสคริปต์
2. Screenshot ของ error message
3. OrderNumber ที่ใช้ทดสอบ
4. Browser console logs
