# การจัดการ Upload รูปภาพใน Production

## ⚠️ ปัญหาที่พบบ่อย: รูปภาพไม่แสดงใน Production

### สาเหตุหลัก:

1. **Serverless Platform (Vercel, Netlify, AWS Lambda)**
   - File system เป็น READ-ONLY
   - ไฟล์ที่ upload จะหายหลัง deployment ใหม่
   - **แนะนำ**: ใช้ Cloud Storage แทน

2. **Traditional Server (VPS, Dedicated Server)**
   - โฟลเดอร์ uploads ไม่มีสิทธิ์เขียนไฟล์
   - โฟลเดอร์ไม่ถูกสร้างบน production
   - **แนะนำ**: ตั้งค่า permissions และโฟลเดอร์

---

## 🔧 วิธีแก้ไขตามประเภท Deployment

### Option 1: Vercel / Serverless (แนะนำสำหรับ Production)

**ใช้ Vercel Blob Storage** (ง่ายที่สุด):

```bash
npm install @vercel/blob
```

#### 1. ตั้งค่า Environment Variables ใน Vercel Dashboard:
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

#### 2. สร้างไฟล์ใหม่ `src/lib/blob-storage.ts`:
```typescript
import { put, del } from '@vercel/blob';

export async function uploadToBlob(
  file: File,
  pathname: string
): Promise<string> {
  const blob = await put(pathname, file, {
    access: 'public',
  });
  return blob.url;
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}
```

#### 3. แก้ไข `src/app/api/upload/image/route.ts`:
```typescript
import { uploadToBlob } from '@/lib/blob-storage';

// แทนที่ writeFile ด้วย:
const blobUrl = await uploadToBlob(
  file, 
  `uploads/products/${filename}`
);

// Return blobUrl แทน local path
```

**หรือใช้ Cloudinary** (ฟรี, แนะนำ):

```bash
npm install cloudinary
```

#### 1. สมัครที่ https://cloudinary.com

#### 2. เพิ่มใน `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 3. สร้าง `src/lib/cloudinary.ts`:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string
): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

---

### Option 2: Traditional Server (VPS, cPanel, Dedicated Server)

#### 1. SSH เข้า Server:
```bash
ssh user@your-server.com
cd /path/to/your/app
```

#### 2. สร้างโฟลเดอร์ uploads:
```bash
mkdir -p public/uploads/products
mkdir -p public/uploads/blog
mkdir -p public/uploads/banners
mkdir -p public/uploads/payment-slips
```

#### 3. ตั้งค่า Permissions:
```bash
# ให้สิทธิ์เขียนโฟลเดอร์
chmod -R 755 public/uploads

# เปลี่ยน owner (แก้ www-data เป็น user ของ web server คุณ)
sudo chown -R www-data:www-data public/uploads
```

**หาชื่อ web server user:**
```bash
# สำหรับ nginx:
ps aux | grep nginx | grep -v grep

# สำหรับ apache:
ps aux | grep apache | grep -v grep
```

#### 4. ตรวจสอบ Permissions:
```bash
ls -la public/uploads
# ควรเห็น drwxr-xr-x (755)
```

#### 5. ตั้งค่า Nginx/Apache ให้ serve static files:

**Nginx** (`/etc/nginx/sites-available/your-site`):
```nginx
server {
    location /uploads/ {
        alias /path/to/your/app/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache** (`.htaccess`):
```apache
<IfModule mod_expires.c>
  <FilesMatch "\.(jpg|jpeg|png|gif|svg|webp)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
  </FilesMatch>
</IfModule>
```

#### 6. Restart Web Server:
```bash
# Nginx
sudo systemctl restart nginx

# Apache
sudo systemctl restart apache2
```

---

## 🧪 ทดสอบ Upload

### 1. ตรวจสอบว่า Local Storage ทำงานหรือไม่:

```bash
# เพิ่มใน API route เพื่อทดสอบ
import { isLocalStorageAvailable } from '@/lib/upload-storage';

const available = await isLocalStorageAvailable();
console.log('Local Storage Available:', available);
```

### 2. ทดสอบ Upload รูปภาพ:
- ลอง upload รูปใหม่ผ่าน Admin Panel
- ตรวจสอบว่ามี logs error หรือไม่
- เช็คว่าไฟล์ถูกสร้างใน `public/uploads/`

### 3. ตรวจสอบ URL:
- เปิด DevTools > Network
- ดูว่า request ไปที่ `/uploads/products/filename.jpg` ได้ status 200 หรือไม่

---

## 📋 Checklist สำหรับ Production

- [ ] โฟลเดอร์ `public/uploads/*` มีอยู่
- [ ] Permissions เป็น 755 (โฟลเดอร์) และ 644 (ไฟล์)
- [ ] Web server มีสิทธิ์เขียนไฟล์
- [ ] `.gitignore` ignore ไฟล์ uploads แต่เก็บ `.gitkeep`
- [ ] เพิ่ม `.gitkeep` ในทุกโฟลเดอร์ uploads
- [ ] Nginx/Apache config ให้ serve static files
- [ ] Environment variables ตั้งค่าครบ (ถ้าใช้ cloud storage)
- [ ] ทดสอบ upload และแสดงผล

---

## 🔍 Debug การ Upload

### 1. เช็ค Server Logs:
```bash
# Next.js logs
npm run build
npm start

# ดู logs ตอน upload
tail -f .next/server.log
```

### 2. ตรวจสอบ Network Request:
```javascript
// เพิ่มใน upload API route
console.log('Upload directory:', uploadDir);
console.log('File path:', filePath);
console.log('File exists:', await fs.access(filePath).then(() => true).catch(() => false));
```

### 3. ทดสอบ Permissions:
```bash
# SSH เข้า server
cd public/uploads/products
touch test.txt
# ถ้า error แสดงว่าไม่มีสิทธิ์เขียน
```

---

## 💡 Tips

1. **Development**: ใช้ local storage (public/uploads)
2. **Production**: ใช้ Cloud Storage (Cloudinary, Vercel Blob, S3)
3. **Backup**: สำรองรูปภาพอัตโนมัติ
4. **CDN**: ใช้ CDN สำหรับโหลดรูปเร็วขึ้น
5. **Image Optimization**: ใช้ Sharp หรือ Cloudinary transformation

---

## 🆘 ยังมีปัญหา?

1. เช็ค browser console มี error หรือไม่
2. เช็ค server logs (pm2 logs, vercel logs)
3. ทดสอบ direct access: `https://yourdomain.com/uploads/test.jpg`
4. ตรวจสอบ firewall/security rules
5. Verify DNS และ SSL certificate

---

## 📚 Resources

- [Next.js Static Files](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
