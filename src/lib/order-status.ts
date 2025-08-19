// ประเภทสถานะคำสั่งซื้อ (ตามที่มีใน schema)
export type OrderStatus = 
  | "PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED" 
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

// สถานะของคำสั่งซื้อพร้อมคำอธิบาย (ตาม schema)
export const ORDER_STATUS_INFO: Record<OrderStatus, {
  label: string;
  description: string;
  color: string;
  icon: string;
  priority: number;
}> = {
  PENDING: {
    label: "รอการชำระเงิน",
    description: "คำสั่งซื้อถูกสร้างแล้ว รอการยืนยันจากร้านค้า",
    color: "#FF9800",
    icon: "⏳",
    priority: 1
  },
  PAYMENT_PENDING: {
    label: "รอตรวจสอบการชำระเงิน",
    description: "รอการชำระเงินส่วนที่เหลือ (สำหรับกรณีมัดจำ)",
    color: "#F44336",
    icon: "💳",
    priority: 2
  },
  CONFIRMED: {
    label: "ยืนยันการชำระเงิน",
    description: "ร้านค้ายืนยันคำสั่งซื้อแล้ว",
    color: "#2196F3",
    icon: "✅",
    priority: 3
  },
  PROCESSING: {
    label: "กำลังจัดเตรียมสินค้า",
    description: "กำลังเตรียมสินค้าหรือสัตว์เลี้ยงสำหรับส่งมอบ",
    color: "#9C27B0",
    icon: "📦",
    priority: 4
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    description: "สินค้าถูกจัดส่งแล้ว",
    color: "#607D8B",
    icon: "🚚",
    priority: 5
  },
  DELIVERED: {
    label: "ส่งมอบแล้ว",
    description: "สินค้าถูกส่งมอบแล้ว เสร็จสิ้นแล้ว",
    color: "#4CAF50",
    icon: "✅",
    priority: 6
  },
  CANCELLED: {
    label: "ยกเลิก",
    description: "คำสั่งซื้อถูกยกเลิก",
    color: "#F44336",
    icon: "❌",
    priority: 99
  }
} as const;

// สถานะที่สามารถเปลี่ยนแปลงได้จากสถานะปัจจุบัน (ตาม schema)
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAYMENT_PENDING", "CONFIRMED", "CANCELLED"],
  PAYMENT_PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [], // สถานะสุดท้าย
  CANCELLED: [] // สถานะสุดท้าย
};

// ตรวจสอบว่าสามารถเปลี่ยนสถานะได้หรือไม่
export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

// รับสถานะถัดไปที่แนะนำ
export function getNextRecommendedStatus(
  currentStatus: OrderStatus, 
  orderDetails: {
    requiresDeposit: boolean;
    shippingMethod: string;
    paymentType: string;
  }
): OrderStatus | null {
  const { requiresDeposit, shippingMethod, paymentType } = orderDetails;
  
  switch (currentStatus) {
    case "PENDING":
      if (requiresDeposit && paymentType === "DEPOSIT_PAYMENT") {
        return "PAYMENT_PENDING";
      }
      return "CONFIRMED";
      
    case "PAYMENT_PENDING":
      return "CONFIRMED";
      
    case "CONFIRMED":
      return "PROCESSING";
      
    case "PROCESSING":
      return "SHIPPED";
        
    case "SHIPPED":
      return "DELIVERED";
      
    default:
      return null;
  }
}

// รับข้อมูลสถานะ
export function getStatusInfo(status: OrderStatus) {
  return ORDER_STATUS_INFO[status];
}

// รับสถานะทั้งหมดที่เรียงลำดับ
export function getAllStatuses(): OrderStatus[] {
  return Object.keys(ORDER_STATUS_INFO).sort((a, b) => {
    const aInfo = ORDER_STATUS_INFO[a as OrderStatus];
    const bInfo = ORDER_STATUS_INFO[b as OrderStatus];
    return aInfo.priority - bInfo.priority;
  }) as OrderStatus[];
}

// รับสถานะที่สามารถเปลี่ยนได้
export function getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

// ตรวจสอบว่าสถานะเป็นสถานะสุดท้ายหรือไม่
export function isFinalStatus(status: OrderStatus): boolean {
  return ["DELIVERED", "CANCELLED"].includes(status);
}

// ตรวจสอบว่าสถานะเป็นสถานะที่ถูกยกเลิกหรือไม่
export function isCancelledStatus(status: OrderStatus): boolean {
  return ["CANCELLED"].includes(status);
}

// รับ progress percentage ของสถานะ
export function getStatusProgress(status: OrderStatus): number {
  const info = ORDER_STATUS_INFO[status];
  if (isCancelledStatus(status)) return 0;
  
  const maxPriority = Math.max(...Object.values(ORDER_STATUS_INFO)
    .filter(s => s.priority < 90) // ไม่นับสถานะ cancelled/refunded
    .map(s => s.priority));
    
  return Math.round((info.priority / maxPriority) * 100);
}
