# Orders API และ Profile Purchase History

## 🔧 API ที่สร้างใหม่:

### `/api/user/orders` (GET)
- **ฟังก์ชัน**: ดึงประวัติการซื้อของผู้ใช้
- **Authentication**: ต้อง login ผ่าน NextAuth
- **Response**: Array ของ orders พร้อม order items และ product details

### Response Structure:
```json
[
  {
    "id": "order_id",
    "status": "DELIVERED",
    "totalAmount": 25000,
    "createdAt": "2025-01-15T00:00:00.000Z",
    "items": [
      {
        "id": "item_id",
        "quantity": 1,
        "price": 25000,
        "product": {
          "id": "product_id",
          "name": "คอร์กี้ผู้ชาย",
          "category": "dogs",
          "imageUrl": "/product/corgi-1.jpg",
          "breed": "คอร์กี้",
          "gender": "MALE",
          "age": "3 เดือน"
        }
      }
    ]
  }
]
```

## 📦 Seed Script สำหรับ Orders:

### `scripts/seed-orders.js`
- สร้างข้อมูล orders ตัวอย่าง
- เชื่อมโยงกับ test user และ products ที่มีอยู่
- สร้าง orders ในสถานะต่างๆ (DELIVERED, PROCESSING)

### วิธีใช้:
```bash
# Seed orders ตัวอย่าง
node scripts/seed-orders.js
```

## 🎯 Features ในหน้า Profile:

### ✅ **ประวัติการซื้อจาก Database:**
- ดึงข้อมูลจาก API จริง
- แสดงรูปภาพสินค้า
- แสดงข้อมูลสัตว์เลี้ยง (เพศ, อายุ, สายพันธุ์)
- แสดงสถานะคำสั่งซื้อ
- กรองตามหมวดหมู่

### 🔍 **การกรองข้อมูล:**
- **สุนัข**: แสดงเฉพาะ orders ที่มี category = "dogs"
- **แมว**: แสดงเฉพาะ orders ที่มี category = "cats"  
- **นก**: แสดงเฉพาะ orders ที่มี category = "birds"
- **ปลา**: แสดงเฉพาะ orders ที่มี category = "fish"
- **อื่นๆ**: แสดง orders ที่ไม่ใช่ 4 หมวดหมู่ข้างต้น

### 🎨 **UI/UX Features:**
- Loading state ขณะดึงข้อมูล
- Empty state เมื่อไม่มีข้อมูล
- Status badges สีต่างๆ ตามสถานะ
- รูปภาพสินค้าจริงจาก database
- การแสดงราคารวมสำหรับ orders ที่มีหลายรายการ

### 📱 **Responsive Design:**
- Card layout ที่สวยงาม
- รองรับ mobile และ desktop
- Smooth transitions และ animations

## 🔗 **Database Relations:**
```
User -> Orders -> OrderItems -> Products -> ProductImages
```

## 🚀 **การใช้งาน:**
1. Login เข้าระบบ
2. ไปหน้า Profile
3. ดูประวัติการซื้อแยกตามหมวดหมู่
4. ข้อมูลจะดึงจาก database จริง

## 📝 **หมายเหตุ:**
- ต้องมี test user ในระบบ
- ต้องมี products และ orders ใน database
- API ใช้ NextAuth session สำหรับ authentication