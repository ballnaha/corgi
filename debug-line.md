# 🔍 DEBUG: LINE Message ไม่ส่ง

## สาเหตุที่เป็นไปได้:

### 1. 👤 **User ไม่ได้ Login ผ่าน LINE**
- ต้อง Login ด้วย LINE Account (ไม่ใช่ Google)
- Check: `session?.user?.lineUserId` ต้องมีค่า

### 2. 🔑 **LINE API Configuration**
```env
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
```

### 3. 🤖 **LINE Bot Setup**
- User ต้องเพิ่ม LINE Bot เป็นเพื่อนก่อน
- Bot ต้องมีสิทธิ์ส่งข้อความ

## 🧪 วิธี Debug:

### A. ทดสอบ LINE API โดยตรง:
1. ไปที่ http://localhost:3001/line-test
2. กด "Test LINE API" 
3. ดูผลลัพธ์

### B. ตรวจสอบ Server Logs:
1. สั่งซื้อสินค้า
2. ดู terminal ที่รัน npm run dev
3. มองหา error messages

### C. ตรวจสอบ Session:
```javascript
// ใน browser console
console.log(await fetch('/api/auth/session').then(r => r.json()))
```

## 🎯 ผลลัพธ์ที่คาดหวัง:

### ✅ สำเร็จ:
```json
{
  "success": true,
  "message": "Receipt sent to LINE successfully"
}
```

### ⚠️ ยังไม่ตั้งค่า:
```json
{
  "success": false,
  "message": "LINE messaging is not configured",
  "skipLine": true
}
```

### ❌ Error:
```json
{
  "error": "Failed to send LINE receipt",
  "details": "error details here"
}
```
