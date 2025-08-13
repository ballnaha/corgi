# Database Setup Guide

## Prerequisites

1. **MySQL Server** - ติดตั้ง MySQL Server (แนะนำ XAMPP, WAMP, หรือ MAMP)
2. **Node.js** - เวอร์ชัน 18 หรือใหม่กว่า

## Setup Steps

### 1. เริ่ม MySQL Server
```bash
# สำหรับ XAMPP/WAMP
# เปิด Control Panel และเริ่ม MySQL service

# หรือใช้ command line
mysql.server start
```

### 2. สร้าง Database
```bash
# วิธีที่ 1: ใช้ script อัตโนมัติ
npm run db:setup

# วิธีที่ 2: สร้างด้วยตนเอง
mysql -u root -p
CREATE DATABASE corgi_shop;
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Push Database Schema
```bash
# สำหรับ development (ไม่สร้าง migration files)
npm run db:push

# หรือสร้าง migration (แนะนำสำหรับ production)
npm run db:migrate
```

### 5. Seed ข้อมูลตัวอย่าง
```bash
npm run db:seed
```

### 6. เปิด Prisma Studio (ตัวจัดการ database)
```bash
npm run db:studio
```

## Database Schema

### Users Table
- `id` - Primary key
- `lineUserId` - LINE User ID (unique)
- `displayName` - ชื่อแสดง
- `pictureUrl` - URL รูปโปรไฟล์
- `email` - อีเมล
- `statusMessage` - สถานะ
- `createdAt` - วันที่สร้าง
- `lastLoginAt` - เข้าใช้งานล่าสุด

### Products Table
- `id` - Primary key
- `name` - ชื่อสินค้า
- `description` - รายละเอียด
- `price` - ราคา
- `imageUrl` - URL รูปสินค้า
- `category` - หมวดหมู่
- `stock` - จำนวนคงเหลือ
- `isActive` - สถานะเปิด/ปิด

### Orders & OrderItems Tables
- สำหรับระบบสั่งซื้อในอนาคต

### Favorites Table
- สำหรับระบบรายการโปรดในอนาคต

## Environment Variables

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/corgi_shop"

# สำหรับ production
DATABASE_URL="mysql://username:password@host:port/database_name"
```

## Troubleshooting

### ปัญหา Connection
1. ตรวจสอบ MySQL server ทำงานหรือไม่
2. ตรวจสอบ username/password ใน DATABASE_URL
3. ตรวจสอบ database name ถูกต้องหรือไม่

### ปัญหา Migration
```bash
# Reset database (ลบข้อมูลทั้งหมด)
npx prisma migrate reset

# หรือ push schema ใหม่
npm run db:push
```

### ปัญหา Prisma Client
```bash
# Generate client ใหม่
npm run db:generate

# หรือ
npx prisma generate
```

## Production Deployment

1. ใช้ MySQL service เช่น PlanetScale, Railway, หรือ AWS RDS
2. อัพเดท DATABASE_URL ใน production environment
3. รัน migration ใน production:
   ```bash
   npx prisma migrate deploy
   ```

## Useful Commands

```bash
# ดู database schema
npx prisma db pull

# สร้าง migration จาก schema changes
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```