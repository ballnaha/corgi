# 📋 คู่มือระบบ Order Status

## 🎯 ภาพรวม

ระบบ Order Status ได้รับการปรับปรุงให้มีความสมบูรณ์และเหมาะสมกับธุรกิจสัตว์เลี้ยง โดยมีการจัดการ status transitions, validation, และ UI components ที่ครบถ้วน

## 📊 Order Status ทั้งหมด

| Status | ไทย | คำอธิบาย | สี | Icon | Priority |
|--------|-----|----------|-----|------|----------|
| `PENDING` | รอการยืนยัน | คำสั่งซื้อถูกสร้างแล้ว รอการยืนยันจากร้านค้า | #FF9800 | ⏳ | 1 |
| `CONFIRMED` | ยืนยันแล้ว | ร้านค้ายืนยันคำสั่งซื้อแล้ว | #2196F3 | ✅ | 2 |
| `PAYMENT_PENDING` | รอการชำระเงิน | รอการชำระเงินส่วนที่เหลือ (สำหรับกรณีมัดจำ) | #F44336 | 💳 | 3 |
| `PAID` | ชำระเงินแล้ว | ชำระเงินครบถ้วนแล้ว | #4CAF50 | 💰 | 4 |
| `PREPARING` | กำลังเตรียมสินค้า | กำลังเตรียมสินค้าหรือสัตว์เลี้ยงสำหรับส่งมอบ | #9C27B0 | 📦 | 5 |
| `READY_FOR_PICKUP` | พร้อมรับสินค้า | สินค้าพร้อมสำหรับการรับด้วยตัวเอง | #00BCD4 | 🏪 | 6 |
| `SHIPPED` | จัดส่งแล้ว | สินค้าถูกจัดส่งแล้ว | #607D8B | 🚚 | 7 |
| `OUT_FOR_DELIVERY` | กำลังส่งมอบ | สินค้ากำลังอยู่ในขั้นตอนการส่งมอบ | #795548 | 🛵 | 8 |
| `DELIVERED` | ส่งมอบแล้ว | สินค้าถูกส่งมอบแล้ว | #8BC34A | 📍 | 9 |
| `COMPLETED` | เสร็จสิ้น | การสั่งซื้อเสร็จสิ้นสมบูรณ์ | #4CAF50 | 🎉 | 10 |
| `CANCELLED` | ยกเลิก | คำสั่งซื้อถูกยกเลิก | #F44336 | ❌ | 99 |
| `REFUNDED` | คืนเงินแล้ว | เงินถูกคืนให้กับลูกค้าแล้ว | #FF5722 | 💸 | 98 |

## 🔄 Status Transitions

### Flow Chart

```
PENDING → CONFIRMED → PAID → PREPARING → COMPLETED
    ↓         ↓         ↓        ↓           ↑
CANCELLED  CANCELLED  CANCELLED  ↓          /
    ↓                            ↓         /
REFUNDED                    READY_FOR_PICKUP
                                 ↑
                            (for pickup orders)

                            SHIPPED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
                               ↑             ↓                ↑
                               └─────────────┘               /
                                (retry delivery)           /
                                                          /
                            (for delivery orders) ──────/
```

### Transition Rules

**จาก PENDING:**
- ✅ `CONFIRMED` - ยืนยันคำสั่งซื้อ
- ✅ `CANCELLED` - ยกเลิกคำสั่งซื้อ

**จาก CONFIRMED:**
- ✅ `PAYMENT_PENDING` - รอชำระเงิน (กรณีมัดจำ)
- ✅ `PAID` - ชำระเงินแล้ว (กรณีชำระเต็ม)
- ✅ `PREPARING` - เตรียมสินค้า (ข้าม payment)
- ✅ `CANCELLED` - ยกเลิก

**จาก PAYMENT_PENDING:**
- ✅ `PAID` - ชำระเงินส่วนที่เหลือแล้ว
- ✅ `CANCELLED` - ยกเลิก

**จาก PAID:**
- ✅ `PREPARING` - เริ่มเตรียมสินค้า
- ✅ `CANCELLED` - ยกเลิก (ต้องคืนเงิน)

**จาก PREPARING:**
- ✅ `READY_FOR_PICKUP` - พร้อมรับ (สำหรับรับด้วยตัวเอง)
- ✅ `SHIPPED` - จัดส่งแล้ว (สำหรับ delivery)
- ✅ `CANCELLED` - ยกเลิก

**จาก READY_FOR_PICKUP:**
- ✅ `COMPLETED` - รับสินค้าแล้ว
- ✅ `CANCELLED` - ยกเลิก

**จาก SHIPPED:**
- ✅ `OUT_FOR_DELIVERY` - กำลังส่งมอบ
- ✅ `DELIVERED` - ส่งมอบแล้ว (ข้ามขั้นตอน)

**จาก OUT_FOR_DELIVERY:**
- ✅ `DELIVERED` - ส่งมอบสำเร็จ
- ✅ `SHIPPED` - ส่งไม่สำเร็จ (กลับไป retry)

**จาก DELIVERED:**
- ✅ `COMPLETED` - ยืนยันได้รับแล้ว

**จาก CANCELLED:**
- ✅ `REFUNDED` - คืนเงินแล้ว

## 🛠️ การใช้งาน

### 1. ในการสร้าง Order

```typescript
import { OrderStatus } from "@prisma/client";

const order = await prisma.order.create({
  data: {
    status: OrderStatus.PENDING, // เริ่มที่ PENDING เสมอ
    // ... ข้อมูลอื่นๆ
  }
});
```

### 2. การอัปเดต Status

```typescript
// ตรวจสอบก่อนอัปเดต
import { canTransitionTo } from "@/lib/order-status";

const currentStatus = OrderStatus.PENDING;
const newStatus = OrderStatus.CONFIRMED;

if (canTransitionTo(currentStatus, newStatus)) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });
}
```

### 3. การแสดงผล Status

```tsx
import OrderStatus from "@/components/OrderStatus";
import { OrderStatusTimeline } from "@/components/OrderStatus";

// แสดง status แบบง่าย
<OrderStatus status={order.status} />

// แสดง status พร้อม description และ progress
<OrderStatus 
  status={order.status} 
  showDescription={true}
  showProgress={true}
  size="large"
/>

// แสดง timeline
<OrderStatusTimeline 
  currentStatus={order.status}
  orderDetails={{
    requiresDeposit: order.requiresDeposit,
    shippingMethod: order.shippingMethod,
    paymentType: order.paymentType
  }}
/>
```

## 🌐 API Endpoints

### 1. อัปเดต Order Status

```http
PATCH /api/orders/[orderId]
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": { ... }
}
```

**Error Response:**
```json
{
  "error": "Cannot transition from PENDING to COMPLETED. Available transitions: CONFIRMED, CANCELLED",
  "currentStatus": "PENDING",
  "availableTransitions": ["CONFIRMED", "CANCELLED"]
}
```

### 2. ดูข้อมูล Status

```http
GET /api/orders/[orderId]/status
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order-id",
    "orderNumber": "OR12345678",
    "currentStatus": "PENDING",
    "statusInfo": {
      "label": "รอการยืนยัน",
      "description": "คำสั่งซื้อถูกสร้างแล้ว รอการยืนยันจากร้านค้า",
      "color": "#FF9800",
      "icon": "⏳",
      "priority": 1
    },
    "progress": 10,
    "nextRecommendedStatus": "CONFIRMED",
    "availableTransitions": ["CONFIRMED", "CANCELLED"],
    "transitionOptions": [
      {
        "status": "CONFIRMED",
        "info": { ... }
      }
    ]
  }
}
```

## 🎨 UI Components

### OrderStatus Component

**Props:**
- `status: OrderStatusEnum` - สถานะปัจจุบัน
- `showProgress?: boolean` - แสดง progress bar (default: false)
- `showDescription?: boolean` - แสดงคำอธิบาย (default: false)
- `size?: "small" | "medium" | "large"` - ขนาด (default: "medium")

### OrderStatusTimeline Component

**Props:**
- `currentStatus: OrderStatusEnum` - สถานะปัจจุบัน
- `orderDetails?` - ข้อมูล order สำหรับสร้าง timeline ที่เหมาะสม

## 🧪 การทดสอบ

### ทดสอบ Status Transitions

```typescript
import { canTransitionTo, getAvailableTransitions } from "@/lib/order-status";

// ทดสอบการเปลี่ยน status
console.log(canTransitionTo("PENDING", "CONFIRMED")); // true
console.log(canTransitionTo("PENDING", "COMPLETED")); // false

// ดู transitions ที่เป็นไปได้
console.log(getAvailableTransitions("PENDING")); // ["CONFIRMED", "CANCELLED"]
```

### ทดสอบ API

```bash
# อัปเดต status
curl -X PATCH http://localhost:3000/api/orders/[orderId] \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'

# ดูข้อมูล status
curl http://localhost:3000/api/orders/[orderId]/status
```

## 🚀 การปรับปรุงในอนาคต

1. **Email Notifications** - ส่งอีเมลแจ้งเตือนเมื่อ status เปลี่ยน
2. **SMS Notifications** - ส่ง SMS สำหรับ status สำคัญ
3. **Admin Dashboard** - หน้าจัดการ orders สำหรับ admin
4. **Status History** - บันทึกประวัติการเปลี่ยน status
5. **Automated Transitions** - เปลี่ยน status อัตโนมัติตามเงื่อนไข

## 📝 หมายเหตุ

- Status transitions มี validation เพื่อป้องกันการเปลี่ยนที่ไม่ถูกต้อง
- Progress calculation ใช้ priority ของแต่ละ status
- Timeline แสดงผลต่างกันขึ้นอยู่กับประเภทการจัดส่ง (pickup vs delivery)
- Component รองรับ responsive design และ Material-UI theming
