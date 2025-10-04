import { CartItem } from "@/types";

export interface OrderAnalysis {
  hasPets: boolean;
  requiresDeposit: boolean;
  totalAmount: number; // ✅ ราคาที่ลูกค้าจ่ายจริง (หลังหักส่วนลด)
  totalAmountBeforeDiscount: number; // ราคาเดิมก่อนหักส่วนลด
  depositAmount: number | null;
  remainingAmount: number | null;
  depositRate: number; // เปอร์เซ็นต์การจ่ายมัดจำ (เช่น 50 สำหรับ 50%)
  paymentType: "FULL_PAYMENT" | "DEPOSIT_PAYMENT";
  suggestedShippingMethod: "pickup" | "delivery";
  petProducts: CartItem[];
  nonPetProducts: CartItem[];
}

export interface DepositSettings {
  minAmount: number;
  percentage: number;
  enabled: boolean;
}

export interface DiscountInfo {
  type: "percentage" | "fixed";
  value: number;
  code?: string;
}

/**
 * วิเคราะห์ข้อมูลคำสั่งซื้อ รวมถึงการคำนวณมัดจำและส่วนลด
 */
export async function analyzeOrder(
  cartItems: CartItem[],
  discountInfo?: DiscountInfo,
  depositSettings?: DepositSettings
): Promise<OrderAnalysis> {
  // แยกสินค้าตามประเภท
  const petProducts = cartItems.filter((item) =>
    isPetProduct(item.product.category)
  );

  const nonPetProducts = cartItems.filter(
    (item) => !isPetProduct(item.product.category)
  );

  const hasPets = petProducts.length > 0;

  // คำนวณราคารวมก่อนส่วนลด (ให้สอดคล้องกับ UI: รองรับ salePrice และ discountPercent)
  const originalAmount = cartItems.reduce((total, item) => {
    const basePrice = item.product.price;
    const hasSalePrice = item.product.salePrice != null;
    const hasDiscountPercent =
      !hasSalePrice && item.product.discountPercent != null && (item.product.discountPercent as number) > 0;

    const unitPrice = hasSalePrice
      ? (item.product.salePrice as number)
      : hasDiscountPercent
      ? Math.max(0, basePrice - basePrice * ((item.product.discountPercent as number) / 100))
      : basePrice;

    return total + unitPrice * item.quantity;
  }, 0);

  // คำนวณส่วนลด
  let discountAmount = 0;
  if (discountInfo) {
    if (discountInfo.type === "percentage") {
      discountAmount = (originalAmount * discountInfo.value) / 100;
    } else if (discountInfo.type === "fixed") {
      discountAmount = discountInfo.value;
    }
  }

  // ราคารวมหลังหักส่วนลด (นี่คือราคาที่ลูกค้าจ่ายจริง)
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  // Debug logging
  if (discountInfo) {
    console.log("💰 Order Logic Debug:");
    console.log("  Original Amount:", originalAmount);
    console.log("  Discount Info:", discountInfo);
    console.log("  Calculated Discount Amount:", discountAmount);
    console.log("  Final Amount:", finalAmount);
  }

  // ดึงการตั้งค่า deposit จาก parameter หรือใช้ค่า default
  const settings = depositSettings || {
    minAmount: 10000,
    percentage: 0.1,
    enabled: true
  };

  // กำหนดเงื่อนไขการชำระเงิน - ใช้ราคาหลังหักส่วนลดและการตั้งค่าจาก parameter
  let requiresDeposit = false;
  let depositAmount: number | null = null;
  let remainingAmount: number | null = null;
  let paymentType: "FULL_PAYMENT" | "DEPOSIT_PAYMENT" = "FULL_PAYMENT";

  // เงื่อนไข: สัตว์เลี้ยงราคาเกินจำนวนที่กำหนดใน settings ต้องชำระมัดจำตามเปอร์เซ็นต์ที่กำหนด
  if (hasPets && settings.enabled && finalAmount > settings.minAmount) {
    requiresDeposit = true;
    depositAmount = Math.round(finalAmount * settings.percentage * 100) / 100; // rounded to 2 decimal places
    remainingAmount = Math.round((finalAmount - depositAmount) * 100) / 100;
    paymentType = "DEPOSIT_PAYMENT";
  }

  // กำหนดวิธีการจัดส่ง
  const suggestedShippingMethod: "pickup" | "delivery" = hasPets
    ? "pickup"
    : "delivery";

  return {
    hasPets,
    requiresDeposit,
    totalAmount: finalAmount, // ✅ ราคาที่ลูกค้าจ่ายจริง (หลังหักส่วนลด)
    totalAmountBeforeDiscount: originalAmount, // ราคาเดิมก่อนหักส่วนลด
    depositAmount,
    remainingAmount,
    depositRate: Math.round(settings.percentage * 100), // แปลงจาก 0.1 เป็น 10%
    paymentType,
    suggestedShippingMethod,
    petProducts,
    nonPetProducts,
  };
}

/**
 * วิเคราะห์ข้อมูลคำสั่งซื้อแบบ server-side (ใช้ได้เฉพาะใน API routes)
 */
export async function analyzeOrderWithDatabase(
  cartItems: CartItem[],
  discountInfo?: DiscountInfo
): Promise<OrderAnalysis> {
  // Import แบบ dynamic เพื่อป้องกันการโหลด PrismaClient ใน browser
  const { getDepositSettings } = await import("./system-settings");
  const depositSettings = await getDepositSettings();
  
  return analyzeOrder(cartItems, discountInfo, depositSettings);
}

/**
 * ตรวจสอบว่าสินค้าเป็นสัตว์เลี้ยงหรือไม่
 */
export function isPetProduct(category: string): boolean {
  const petCategories = [
    "dogs", "cats", "birds", "fish", "rabbits", "hamsters", "reptiles", "small-pets",
    "สุนัข", "แมว", "นก", "ปลา", "กระต่าย", "แฮมสเตอร์", "สัตว์เลื้อยคลาน", "สัตว์เลี้ยงตัวเล็ก"
  ];
  return petCategories.some((petCat) =>
    category.toLowerCase().includes(petCat.toLowerCase())
  );
}

/**
 * กรองตัวเลือกการจัดส่งตามประเภทสินค้า
 * - ถ้ามีสัตว์เลี้ยง: แสดงเฉพาะ "ทางร้านเป็นคนจัดส่ง"
 * - ถ้าไม่มีสัตว์เลี้ยง: แสดงเฉพาะ "จัดส่งด่วน"
 */
export function filterShippingOptions(
  shippingOptions: any[],
  orderAnalysis: OrderAnalysis
) {
  return shippingOptions.filter((option) => {
    // ถ้ามีสัตว์เลี้ยงในรายการ ให้แสดงเฉพาะตัวเลือกสำหรับสัตว์เลี้ยง (ทางร้านเป็นคนจัดส่ง)
    if (orderAnalysis.hasPets) {
      return option.method === "pickup" && option.forPetsOnly === true;
    }

    // ถ้าไม่มีสัตว์เลี้ยง ให้แสดงเฉพาะตัวเลือกจัดส่งด่วน
    return option.method === "delivery" && option.forPetsOnly === false;
  });
}

/**
 * คำนวณยอดเงินที่ต้องชำระ (รวมส่วนลดแล้ว)
 */
export function calculatePaymentAmount(
  orderAnalysis: OrderAnalysis,
  shippingFee: number = 0,
  shippingDiscount: number = 0
): number {
  const baseAmount = orderAnalysis.requiresDeposit
    ? orderAnalysis.depositAmount || 0
    : orderAnalysis.totalAmount; // ✅ ใช้ totalAmount ใหม่ (หลังหักส่วนลดแล้ว)

  return baseAmount + shippingFee - shippingDiscount;
}

/**
 * สร้างข้อความอธิบายการชำระเงิน
 */
export function getPaymentDescription(orderAnalysis: OrderAnalysis): string {
  if (orderAnalysis.requiresDeposit) {
    return (
      `ชำระมัดจำ ${orderAnalysis.depositAmount?.toLocaleString()} บาท (10%) ` +
      `ยอดคงเหลือ ${orderAnalysis.remainingAmount?.toLocaleString()} บาท ` +
      `ชำระเมื่อรับสัตว์เลี้ยง`
    );
  }

  return `ชำระเต็มจำนวน ${orderAnalysis.totalAmount.toLocaleString()} บาท`;
}

/**
 * สร้างข้อความอธิบายการจัดส่ง
 */
export function getShippingDescription(orderAnalysis: OrderAnalysis): string {
  if (orderAnalysis.hasPets) {
    return (
      "เนื่องจากมีสัตว์เลี้ยงในรายการ ทางร้านเป็นคนจัดส่งด้วยตัวเอง " +
      "ตามนัดหมาย เพื่อความปลอดภัยของน้องๆ"
    );
  }

  return "จัดส่งด่วนภายใน 1-2 วันทำการ สำหรับสินค้าทั่วไป";
}
