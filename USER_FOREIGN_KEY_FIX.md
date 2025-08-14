# 🔧 แก้ไขปัญหา Foreign Key Constraint ใน User ID

## 🚨 ปัญหาที่เกิดขึ้น

```
Foreign key constraint violated on the fields: (`user_id`)
```

เกิดขึ้นเมื่อพยายามสร้าง Order โดยมี `userId` ที่ไม่มีอยู่ในตาราง `users`

## 🔍 สาเหตุ

1. **Session มี user ID แต่ไม่มีในฐานข้อมูล**
   - User login ผ่าน LINE OAuth แต่ยังไม่ถูกสร้างในฐานข้อมูล
   - Session token มี user data แต่ table `users` ยังไม่มี record

2. **Race Condition**
   - หลาย request พยายามสร้าง user พร้อมกัน
   - การตรวจสอบและสร้าง user ไม่ atomic

3. **Migration Issues**
   - การเปลี่ยนแปลง schema ทำให้ข้อมูลไม่ sync
   - User data หายไประหว่าง migration

## ✅ วิธีแก้ไข

### 1. สร้าง Helper Function

สร้างไฟล์ `src/lib/user-utils.ts`:

```typescript
export async function ensureUserExists(sessionUser: SessionUser): Promise<User | null> {
  try {
    // ตรวจสอบ user ในฐานข้อมูล
    let user = await prisma.user.findUnique({
      where: { id: sessionUser.id }
    });

    if (!user) {
      // สร้าง user ใหม่หากไม่มี
      user = await prisma.user.create({
        data: {
          id: sessionUser.id,
          name: sessionUser.name || "Unknown User",
          email: sessionUser.email,
          lineUserId: sessionUser.lineUserId,
        }
      });
    }

    return user;
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    return null;
  }
}
```

### 2. ใช้ Helper ใน API

ในทุก API ที่ต้องการ user validation:

```typescript
import { ensureUserExists } from "@/lib/user-utils";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ ตรวจสอบและสร้าง user หากจำเป็น
  const user = await ensureUserExists(session.user);
  
  if (!user) {
    return NextResponse.json(
      { error: "Failed to validate user" }, 
      { status: 500 }
    );
  }

  // ✅ ตอนนี้แน่ใจแล้วว่า user มีอยู่ในฐานข้อมูล
  // สามารถใช้ session.user.id ได้อย่างปลอดภัย
}
```

### 3. Race Condition Protection

```typescript
try {
  user = await prisma.user.create({
    data: { ... }
  });
} catch (userCreateError) {
  // อาจมีการสร้างพร้อมกัน ลองหาอีกครั้ง
  user = await prisma.user.findUnique({
    where: { id: sessionUser.id }
  });
  
  if (!user) {
    throw new Error("Failed to create or find user");
  }
}
```

## 🛠️ API ที่ได้รับการแก้ไข

### 1. `/api/orders/create`
- ✅ ตรวจสอบและสร้าง user ก่อนสร้าง order
- ✅ Error handling สำหรับ user creation
- ✅ Race condition protection

### 2. `/api/orders/[orderId]`
- ✅ ตรวจสอบ user ก่อนดูหรือแก้ไข order
- ✅ Access control validation

### 3. `/api/orders/[orderId]/status`
- ✅ ตรวจสอบ user ก่อนดูสถานะ order

### 4. `/api/orders`
- ✅ ตรวจสอบ user ก่อนดูรายการ orders

## 🔧 Helper Functions

### `ensureUserExists(sessionUser)`
- ตรวจสอบและสร้าง user หากไม่มี
- Return: `User | null`

### `syncUserFromSession(sessionUser)`
- อัปเดตข้อมูล user จาก session
- Return: `User | null`

### `canAccessResource(userId, resourceUserId)`
- ตรวจสอบสิทธิ์เข้าถึง resource
- Return: `boolean`

### `getUserWithRelations(userId)`
- ดึงข้อมูล user พร้อม orders และ favorites
- Return: `User with relations | null`

## 🧪 การทดสอบ

### Test Case 1: User ใหม่
```javascript
// Login ครั้งแรก
const session = { user: { id: "new-user-123", name: "Test User" } };

// เรียก API สร้าง order
const response = await fetch("/api/orders/create", {
  method: "POST",
  body: JSON.stringify(orderData)
});

// ✅ ต้องสำเร็จ เพราะ user จะถูกสร้างอัตโนมัติ
```

### Test Case 2: User เก่า
```javascript
// User ที่มีอยู่แล้ว
const response = await fetch("/api/orders", {
  method: "GET"
});

// ✅ ต้องสำเร็จ เพราะ user มีอยู่แล้ว
```

### Test Case 3: Race Condition
```javascript
// สร้าง order หลายรายการพร้อมกัน
const promises = Array(5).fill(null).map(() => 
  fetch("/api/orders/create", {
    method: "POST",
    body: JSON.stringify(orderData)
  })
);

const results = await Promise.all(promises);

// ✅ ทุก request ต้องสำเร็จ
```

## 📋 Checklist การแก้ไข

- ✅ สร้าง `src/lib/user-utils.ts`
- ✅ อัปเดต `/api/orders/create/route.ts`
- ✅ อัปเดต `/api/orders/[orderId]/route.ts`
- ✅ อัปเดต `/api/orders/[orderId]/status/route.ts`
- ✅ อัปเดต `/api/orders/route.ts`
- ✅ เพิ่ม error handling
- ✅ เพิ่ม logging สำหรับ debugging
- ✅ Race condition protection

## 🔮 การป้องกันในอนาคต

### 1. Database Triggers
สร้าง trigger ใน database เพื่อสร้าง user อัตโนมัติ:

```sql
DELIMITER $$
CREATE TRIGGER create_user_if_not_exists 
BEFORE INSERT ON orders 
FOR EACH ROW 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
    INSERT INTO users (id, name, created_at, updated_at) 
    VALUES (NEW.user_id, 'Auto Created User', NOW(), NOW());
  END IF;
END$$
DELIMITER ;
```

### 2. Middleware Validation
สร้าง middleware เพื่อตรวจสอบ user ทุก request:

```typescript
export async function userValidationMiddleware(req: NextRequest) {
  const session = await getServerSession();
  
  if (session?.user?.id) {
    await ensureUserExists(session.user);
  }
}
```

### 3. Background Sync
สร้าง background job เพื่อ sync users จาก session:

```typescript
// จาก LINE webhook หรือ cron job
async function syncUsersFromSessions() {
  // ดึง sessions ที่ active
  // ตรวจสอบและสร้าง users ที่หายไป
}
```

## 💡 Best Practices

1. **Always Validate User Existence**
   - ทุก API ที่ต้องการ user ต้องเรียก `ensureUserExists()`

2. **Handle Race Conditions**
   - ใช้ try-catch เมื่อสร้าง user
   - Retry mechanism หากเกิด conflict

3. **Log Everything**
   - Log การสร้าง user
   - Log foreign key errors
   - Log race conditions

4. **Test Edge Cases**
   - ทดสอบ concurrent requests
   - ทดสอบ network failures
   - ทดสอบ invalid sessions

ตอนนี้ปัญหา Foreign key constraint ได้รับการแก้ไขแล้ว และมีระบบป้องกันไม่ให้เกิดขึ้นอีก! 🎉
