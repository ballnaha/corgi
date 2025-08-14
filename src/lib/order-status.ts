import { OrderStatus } from "@prisma/client";

// สถานะของคำสั่งซื้อพร้อมคำอธิบาย
export const ORDER_STATUS_INFO = {
  PENDING: {
    label: "รอการยืนยัน",
    description: "คำสั่งซื้อถูกสร้างแล้ว รอการยืนยันจากร้านค้า",
    color: "#FF9800",
    icon: "⏳",
    priority: 1
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    description: "ร้านค้ายืนยันคำสั่งซื้อแล้ว",
    color: "#2196F3",
    icon: "✅",
    priority: 2
  },
  PAYMENT_PENDING: {
    label: "รอการชำระเงิน",
    description: "รอการชำระเงินส่วนที่เหลือ (สำหรับกรณีมัดจำ)",
    color: "#F44336",
    icon: "💳",
    priority: 3
  },
  PAID: {
    label: "ชำระเงินแล้ว",
    description: "ชำระเงินครบถ้วนแล้ว",
    color: "#4CAF50",
    icon: "💰",
    priority: 4
  },
  PREPARING: {
    label: "กำลังเตรียมสินค้า",
    description: "กำลังเตรียมสินค้าหรือสัตว์เลี้ยงสำหรับส่งมอบ",
    color: "#9C27B0",
    icon: "📦",
    priority: 5
  },
  READY_FOR_PICKUP: {
    label: "พร้อมรับสินค้า",
    description: "สินค้าพร้อมสำหรับการรับด้วยตัวเอง",
    color: "#00BCD4",
    icon: "🏪",
    priority: 6
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    description: "สินค้าถูกจัดส่งแล้ว",
    color: "#607D8B",
    icon: "🚚",
    priority: 7
  },
  OUT_FOR_DELIVERY: {
    label: "กำลังส่งมอบ",
    description: "สินค้ากำลังอยู่ในขั้นตอนการส่งมอบ",
    color: "#795548",
    icon: "🛵",
    priority: 8
  },
  DELIVERED: {
    label: "ส่งมอบแล้ว",
    description: "สินค้าถูกส่งมอบแล้ว",
    color: "#8BC34A",
    icon: "📍",
    priority: 9
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    description: "การสั่งซื้อเสร็จสิ้นสมบูรณ์",
    color: "#4CAF50",
    icon: "🎉",
    priority: 10
  },
  CANCELLED: {
    label: "ยกเลิก",
    description: "คำสั่งซื้อถูกยกเลิก",
    color: "#F44336",
    icon: "❌",
    priority: 99
  },
  REFUNDED: {
    label: "คืนเงินแล้ว",
    description: "เงินถูกคืนให้กับลูกค้าแล้ว",
    color: "#FF5722",
    icon: "💸",
    priority: 98
  }
} as const;

// สถานะที่สามารถเปลี่ยนแปลงได้จากสถานะปัจจุบัน
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PAYMENT_PENDING, OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PAYMENT_PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  READY_FOR_PICKUP: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.SHIPPED], // อาจส่งไม่สำเร็จ
  DELIVERED: [OrderStatus.COMPLETED],
  COMPLETED: [], // สถานะสุดท้าย
  CANCELLED: [OrderStatus.REFUNDED],
  REFUNDED: [] // สถานะสุดท้าย
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
    case OrderStatus.PENDING:
      return OrderStatus.CONFIRMED;
      
    case OrderStatus.CONFIRMED:
      if (requiresDeposit && paymentType === "DEPOSIT_PAYMENT") {
        return OrderStatus.PAYMENT_PENDING;
      }
      return OrderStatus.PAID;
      
    case OrderStatus.PAYMENT_PENDING:
      return OrderStatus.PAID;
      
    case OrderStatus.PAID:
      return OrderStatus.PREPARING;
      
    case OrderStatus.PREPARING:
      return shippingMethod.includes("pickup") || shippingMethod.includes("รับด้วยตัวเอง")
        ? OrderStatus.READY_FOR_PICKUP
        : OrderStatus.SHIPPED;
        
    case OrderStatus.READY_FOR_PICKUP:
      return OrderStatus.COMPLETED;
      
    case OrderStatus.SHIPPED:
      return OrderStatus.OUT_FOR_DELIVERY;
      
    case OrderStatus.OUT_FOR_DELIVERY:
      return OrderStatus.DELIVERED;
      
    case OrderStatus.DELIVERED:
      return OrderStatus.COMPLETED;
      
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
  return [OrderStatus.COMPLETED, OrderStatus.REFUNDED].includes(status);
}

// ตรวจสอบว่าสถานะเป็นสถานะที่ถูกยกเลิกหรือไม่
export function isCancelledStatus(status: OrderStatus): boolean {
  return [OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(status);
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
