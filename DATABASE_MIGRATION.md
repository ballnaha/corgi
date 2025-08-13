# Database Migration Guide

## การอัปเดต Database Schema สำหรับข้อมูลสัตว์เลี้ยงที่สมบูรณ์

### ฟิลด์ใหม่ที่เพิ่มใน Product table:

#### ข้อมูลพื้นฐานของสัตว์เลี้ยง:
- `gender` (Gender enum): เพศ - MALE, FEMALE, UNKNOWN
- `age` (String): อายุ เช่น "3 เดือน", "1 ปี"
- `weight` (String): น้ำหนัก เช่น "2.5 กก."
- `breed` (String): สายพันธุ์
- `color` (String): สี

#### ข้อมูลสุขภาพและใบรับรอง:
- `vaccinated` (Boolean): ฉีดวัคซีนแล้ว
- `certified` (Boolean): มีใบรับรอง
- `healthNote` (Text): หมายเหตุสุขภาพ

#### ข้อมูลติดต่อและสถานที่:
- `location` (String): สถานที่
- `contactInfo` (Text): ข้อมูลติดต่อ

### Table ใหม่: ProductImage
สำหรับรองรับรูปภาพหลายรูป:
- `id` (String): Primary key
- `productId` (String): Foreign key ไปยัง Product
- `imageUrl` (String): URL ของรูปภาพ
- `altText` (String): ข้อความอธิบายรูป
- `order` (Int): ลำดับการแสดงรูป
- `isMain` (Boolean): รูปหลัก
- `createdAt` (DateTime): วันที่สร้าง

### Enums ใหม่:
- `Gender`: MALE, FEMALE, UNKNOWN
- `PetCategory`: DOGS, CATS, BIRDS, FISH, RABBITS, HAMSTERS, FOOD, TOYS, ACCESSORIES, OTHER

## วิธีการ Migration:

### 1. Generate และ Apply Migration:
```bash
npx prisma migrate dev --name add_pet_details
```

### 2. Generate Prisma Client:
```bash
npx prisma generate
```

### 3. Seed ข้อมูลใหม่:
```bash
node scripts/seed.js
```

### 4. Reset Database (ถ้าจำเป็น):
```bash
npx prisma migrate reset
```

## การใช้งานใน Code:

### 1. API Routes:
- ทุก API routes ได้รับการอัปเดตให้ include ProductImage
- รองรับการ query ข้อมูลสัตว์เลี้ยงที่สมบูรณ์

### 2. Components:
- ProductDetail: แสดงข้อมูลสัตว์เลี้ยงครบถ้วน รวมถึงรูปภาพหลายรูป
- ProductCard: รองรับรูปภาพจาก database
- Types: อัปเดต Product interface ให้รองรับฟิลด์ใหม่

### 3. Features ใหม่:
- แสดงเพศ อายุ น้ำหนัก ในหน้ารายละเอียด
- แสดงสายพันธุ์ สี สถานะวัคซีน ใบรับรอง
- รองรับรูปภาพหลายรูปพร้อม swipe
- แสดงสถานที่และข้อมูลติดต่อ

## หมายเหตุ:
- ข้อมูลเก่าจะยังคงทำงานได้ปกติ (backward compatibility)
- ฟิลด์ใหม่เป็น optional ทั้งหมด
- รูปภาพเก่าจะใช้ imageUrl field เดิม
- รูปภาพใหม่จะใช้ ProductImage table