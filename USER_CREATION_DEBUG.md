# 🔧 แก้ไขปัญหา "Failed to create or find user in database"

## 🚨 ปัญหาที่เกิดขึ้น

```
Error: Failed to create or find user in database
    at handlePlaceOrder
```

เกิดขึ้นเมื่อฟังก์ชัน `ensureUserExists()` ไม่สามารถสร้างหรือหา user ในฐานข้อมูลได้

## 🔍 Root Cause Analysis

### 1. Schema Mismatch
**ปัญหา:** User schema ใช้ field names ที่แตกต่างจากที่ expected

**User Schema จริง:**
```prisma
model User {
  id            String   @id @default(cuid())
  lineUserId    String   @unique @map("line_user_id")     // ⚠️ required & unique
  displayName   String   @map("display_name")             // ⚠️ ใช้ displayName ไม่ใช่ name
  pictureUrl    String?  @map("picture_url")
  email         String?
  phoneNumber   String?  @map("phone_number")
  // ...
}
```

**ข้อมูลที่เราส่งไป (ผิด):**
```typescript
{
  id: sessionUser.id,
  name: sessionUser.name,           // ❌ ควรเป็น displayName
  lineUserId: sessionUser.lineUserId || undefined  // ❌ อาจเป็น undefined
}
```

### 2. Missing Required Fields
- `lineUserId` เป็น required field และ unique
- หาก `sessionUser.lineUserId` เป็น null/undefined จะทำให้สร้างไม่ได้

### 3. Unique Constraint Violations
- `lineUserId` ต้อง unique
- อาจมี user อื่นใช้ lineUserId เดียวกัน

## ✅ วิธีแก้ไข

### 1. แก้ไข Field Mapping

**ก่อนแก้ไข:**
```typescript
user = await prisma.user.create({
  data: {
    id: sessionUser.id,
    name: sessionUser.name || "Unknown User",  // ❌ field ผิด
    email: sessionUser.email,
    lineUserId: sessionUser.lineUserId,        // ❌ อาจเป็น undefined
  }
});
```

**หลังแก้ไข:**
```typescript
user = await prisma.user.create({
  data: {
    id: sessionUser.id,
    lineUserId: sessionUser.lineUserId || sessionUser.id,  // ✅ fallback ถ้าไม่มี
    displayName: sessionUser.name || "Unknown User",       // ✅ ใช้ displayName
    email: sessionUser.email,
  }
});
```

### 2. Enhanced Error Handling

```typescript
try {
  user = await prisma.user.create(userData);
} catch (userCreateError: any) {
  console.error("Failed to create user:", {
    error: userCreateError.message,
    code: userCreateError.code,
    meta: userCreateError.meta,
    sessionUser: sessionUser
  });
  
  // Handle specific error types
  if (userCreateError.code === 'P2002') {
    // Unique constraint violation
    // ลองหา user ที่มีอยู่แล้ว
  } else {
    // Other errors - try fallback creation
  }
}
```

### 3. Multiple Fallback Strategies

**Strategy 1: ลองหา user ที่มีอยู่**
```typescript
if (userCreateError.code === 'P2002') {
  // ลองหาด้วย id
  user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  
  if (!user) {
    // ลองหาด้วย lineUserId
    user = await prisma.user.findUnique({ 
      where: { lineUserId: sessionUser.lineUserId } 
    });
  }
}
```

**Strategy 2: Fallback Creation**
```typescript
if (!user) {
  // สร้างด้วย fallback data
  user = await prisma.user.create({
    data: {
      id: sessionUser.id,
      lineUserId: `fallback_${sessionUser.id}`,  // unique fallback
      displayName: sessionUser.name || `User_${sessionUser.id.slice(-8)}`,
      email: sessionUser.email,
    }
  });
}
```

### 4. Comprehensive Logging

```typescript
console.log("Ensuring user exists for session:", {
  id: sessionUser.id,
  name: sessionUser.name,
  email: sessionUser.email,
  lineUserId: sessionUser.lineUserId
});

console.log("Attempting to create user with data:", {
  id: sessionUser.id,
  lineUserId: sessionUser.lineUserId || sessionUser.id,
  displayName: sessionUser.name || "Unknown User",
  email: sessionUser.email
});
```

## 🧪 การทดสอบ

### Test Case 1: Session ปกติ
```typescript
const sessionUser = {
  id: "user123",
  name: "John Doe", 
  email: "john@example.com",
  lineUserId: "line_user_123"
};

const user = await ensureUserExists(sessionUser);
// ✅ ควรสร้าง user สำเร็จ
```

### Test Case 2: Session ไม่มี lineUserId
```typescript
const sessionUser = {
  id: "user456",
  name: "Jane Doe",
  email: "jane@example.com",
  lineUserId: undefined  // ❌ missing
};

const user = await ensureUserExists(sessionUser);
// ✅ ควรใช้ fallback lineUserId = user456
```

### Test Case 3: Duplicate lineUserId
```typescript
// User แรกมี lineUserId เดียวกัน
const existingUser = await prisma.user.create({
  data: { lineUserId: "line_123", ... }
});

// User ที่สองพยายามใช้ lineUserId เดียวกัน
const sessionUser = {
  id: "user789",
  lineUserId: "line_123"  // ❌ duplicate
};

const user = await ensureUserExists(sessionUser);
// ✅ ควรหา existing user หรือสร้างด้วย fallback
```

## 📊 Error Handling Flow

```
1. ตรวจสอบ session data
   ↓
2. หา user ในฐานข้อมูล
   ↓
3. ถ้าไม่เจอ → พยายามสร้าง user ใหม่
   ↓
4. ถ้าสร้างไม่ได้ → ตรวจสอบ error type
   ↓
5. P2002 (Unique constraint) → หา existing user
   ↓
6. ถ้ายังหาไม่เจอ → สร้างด้วย fallback data
   ↓
7. ถ้ายังไม่ได้ → return null
```

## 🛡️ Prevention Strategies

### 1. Session Data Validation
```typescript
function validateSessionUser(sessionUser: SessionUser): boolean {
  if (!sessionUser.id) return false;
  if (!sessionUser.lineUserId && !sessionUser.name) return false;
  return true;
}
```

### 2. Unique ID Generation
```typescript
function generateUniqueLineUserId(sessionUser: SessionUser): string {
  if (sessionUser.lineUserId) return sessionUser.lineUserId;
  
  // Generate unique fallback
  return `generated_${sessionUser.id}_${Date.now()}`;
}
```

### 3. Database Constraints
```sql
-- เพิ่ม index เพื่อ performance
CREATE INDEX idx_users_line_user_id ON users(line_user_id);

-- เพิ่ม check constraint
ALTER TABLE users ADD CONSTRAINT check_line_user_id_not_empty 
CHECK (line_user_id IS NOT NULL AND line_user_id != '');
```

## 📈 Monitoring & Alerts

### 1. Error Tracking
```typescript
// ใน catch block
console.error("USER_CREATION_FAILED", {
  sessionUserId: sessionUser.id,
  errorCode: error.code,
  timestamp: new Date().toISOString(),
  userAgent: request.headers['user-agent']
});
```

### 2. Success Rate Monitoring
```typescript
// Track user creation success rate
const userCreationMetrics = {
  attempts: 0,
  successes: 0,
  failures: 0,
  fallbackUsed: 0
};
```

## 🎯 Expected Results

หลังจากแก้ไข:

- ✅ **No more "Failed to create user" errors**
- ✅ **Automatic user creation for new sessions**
- ✅ **Graceful handling of duplicate data**
- ✅ **Comprehensive error logging**
- ✅ **Multiple fallback strategies**
- ✅ **Better debugging information**

## 📝 Checklist

- [x] แก้ไข field mapping (displayName vs name)
- [x] เพิ่ม fallback สำหรับ lineUserId  
- [x] เพิ่ม detailed error logging
- [x] เพิ่ม unique constraint error handling
- [x] เพิ่ม fallback user creation strategy
- [x] เพิ่ม session data validation
- [x] ทดสอบ edge cases
- [x] อัปเดต documentation

ตอนนี้ระบบสามารถจัดการกับ user creation ได้อย่างมีเสถียรภาพและแก้ไขปัญหาได้เองในกรณีที่เกิดข้อผิดพลาด! 🎉
