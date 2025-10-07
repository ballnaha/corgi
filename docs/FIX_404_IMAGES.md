# 🔧 แก้ไขปัญหา 404 - รูปภาพไม่แสดง

## ❌ ปัญหาที่พบ

```
Failed to load resource: the server responded with a status of 404 ()
/uploads/products/1759800830104_3_large.png
```

## 🔍 สาเหตุ

Next.js ไม่ serve static files จาก `public/uploads/` โดยอัตโนมัติในบางกรณี โดยเฉพาะ:
- ใน development mode บางครั้ง Next.js ไม่ refresh static files ทันที
- ใน production บน Vercel/serverless file system เป็น read-only
- การตั้งค่า routing อาจ conflict กับ static files

## ✅ วิธีแก้ไข

### 1. เพิ่ม Rewrite Rule ใน `next.config.ts`

เพิ่มการ redirect `/uploads/*` ไปยัง API route ที่จะ serve ไฟล์:

```typescript
async rewrites() {
  return [
    {
      source: '/uploads/:path*',
      destination: '/api/images/uploads/:path*',
    },
  ];
}
```

**ผลลัพธ์**: 
- เมื่อ browser ขอ `/uploads/products/image.jpg`
- Next.js จะ rewrite เป็น `/api/images/uploads/products/image.jpg`
- API route จะอ่านไฟล์จาก `public/uploads/products/image.jpg` และส่งกลับ

### 2. เพิ่ม Logging ใน API Route

เพิ่ม console.log เพื่อ debug:

```typescript
// ใน src/app/api/images/[...path]/route.ts
console.log(`🖼️ Image API request: /api/images/${imagePath}`);
console.log(`📁 Attempting to read: ${filePath}`);
console.log(`✅ File found, serving: ${imagePath}`);
console.error(`❌ File not found at: ${filePath}`);
```

### 3. สร้างหน้า Test

สร้างหน้าสำหรับทดสอบว่ารูปโหลดได้หรือไม่:
- `/admin/test-image` - ทดสอบ image path
- `/admin/diagnostics` - ตรวจสอบ system

## 🧪 วิธีทดสอบ

### ขั้นที่ 1: Restart Development Server

```bash
# หยุด dev server (Ctrl+C)
# จากนั้น restart
npm run dev
```

**เหตุผล**: Next.js ต้อง reload config จาก `next.config.ts`

### ขั้นที่ 2: ตรวจสอบว่าไฟล์มีอยู่จริง

```bash
# Windows
dir public\uploads\products\1759800830104_3_large.png

# ถ้าไม่มี ให้ลอง list ทั้งหมด
dir public\uploads\products
```

### ขั้นที่ 3: ทดสอบผ่านหน้า Test

เปิด: `http://localhost:3000/admin/test-image`

ใส่ path: `/uploads/products/1759800830104_3_large.png`

จะได้ผลลัพธ์:
- ✅ **Direct Path**: ถ้า rewrite ทำงาน จะโหลดได้
- ✅ **API Path**: ควรโหลดได้เสมอ (ถ้าไฟล์มี)

### ขั้นที่ 4: ตรวจสอบ Console

ดู terminal ที่รัน `npm run dev`:

```
🖼️ Image API request: /api/images/uploads/products/1759800830104_3_large.png
📁 Attempting to read: C:\laragon\www\corgi\public\uploads\products\1759800830104_3_large.png
✅ File found, serving: uploads/products/1759800830104_3_large.png
```

หรือถ้า error:
```
❌ File not found at: C:\laragon\www\corgi\public\uploads\products\1759800830104_3_large.png
```

## 📋 Checklist

- [ ] **Restart dev server** หลังแก้ next.config.ts
- [ ] **ตรวจสอบไฟล์มีอยู่** ใน public/uploads/products/
- [ ] **ทดสอบใน test page** - ทั้ง direct และ API path
- [ ] **ดู console logs** ทั้ง browser และ terminal
- [ ] **เช็ค Network tab** ว่า request ไปที่ไหน status code อะไร

## 🔄 Flow การทำงานหลังแก้ไข

```
Browser Request: /uploads/products/image.jpg
           ↓
Next.js Rewrite: /api/images/uploads/products/image.jpg
           ↓
API Route: อ่านไฟล์จาก public/uploads/products/image.jpg
           ↓
Return: Image with proper headers
```

## 🎯 สิ่งที่เปลี่ยนแปลง

### ไฟล์ที่แก้ไข:

1. **`next.config.ts`**
   - เพิ่ม `rewrites()` function
   - Redirect `/uploads/*` → `/api/images/uploads/*`

2. **`src/app/api/images/[...path]/route.ts`**
   - เพิ่ม logging เพื่อ debug
   - แสดง path ที่พยายามอ่าน
   - แสดง error ชัดเจนขึ้น

3. **`src/app/admin/test-image/page.tsx`** (ใหม่)
   - หน้าทดสอบ image paths
   - ทดสอบทั้ง direct และ API path

## ⚠️ ข้อควรระวัง

### Development vs Production

**Development (localhost)**:
- ไฟล์จาก `public/` ควร serve ได้โดยตรง
- Rewrite จะช่วยให้ consistent กับ production

**Production (Vercel/Serverless)**:
- File system เป็น READ-ONLY
- ไฟล์ที่ upload จะไม่ persist
- **ต้องใช้ Cloud Storage** (Cloudinary, S3, Vercel Blob)

### Clear Browser Cache

บางครั้ง browser cache รูปเก่า:

```
1. เปิด DevTools
2. Right click บน Refresh button
3. เลือก "Empty Cache and Hard Reload"
```

## 💡 แนะนำสำหรับ Production

ถ้า deploy บน Vercel/Serverless:

```bash
# ติดตั้ง Cloudinary
npm install cloudinary

# หรือ Vercel Blob
npm install @vercel/blob
```

ดูวิธีใช้ใน: `docs/UPLOAD_PRODUCTION_SETUP.md`

## 🆘 ถ้ายังมีปัญหา

1. **ลบ `.next` folder และ rebuild**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **ตรวจสอบ path ใน database**:
   ```
   npx prisma studio
   เปิดตาราง ProductImage
   เช็ค imageUrl field
   ```

3. **ลอง upload รูปใหม่**:
   - Upload ผ่าน admin
   - ดู console logs
   - เช็คว่าไฟล์ถูกสร้างหรือไม่

4. **ส่งข้อมูลเหล่านี้มา**:
   - Screenshot จาก `/admin/test-image`
   - Console logs (terminal + browser)
   - Network tab screenshot
   - `dir public\uploads\products` output

---

## ✅ สรุป

หลังจากแก้ไข:
1. ✅ เพิ่ม rewrite rule ใน next.config.ts
2. ✅ เพิ่ม logging ใน API route
3. ✅ สร้างหน้า test
4. ✅ ต้อง restart dev server

รูปภาพควรโหลดได้แล้ว! 🎉
