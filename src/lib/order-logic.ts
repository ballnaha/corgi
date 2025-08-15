import { CartItem } from "@/types";

export interface OrderAnalysis {
  hasPets: boolean;
  requiresDeposit: boolean;
  totalAmount: number;
  totalAmountAfterDiscount: number;
  depositAmount: number | null;
  remainingAmount: number | null;
  paymentType: "FULL_PAYMENT" | "DEPOSIT_PAYMENT";
  suggestedShippingMethod: "pickup" | "delivery";
  petProducts: CartItem[];
  nonPetProducts: CartItem[];
}

export interface DiscountInfo {
  type: "percentage" | "fixed";
  value: number;
  code?: string;
}

/**
 * วิเคราะห์คำสั่งซื้อและกำหนดเงื่อนไขการชำระเงินและจัดส่ง
 */
export function analyzeOrder(
  cartItems: CartItem[],
  discount?: DiscountInfo | null
): OrderAnalysis {
  // แยกสินค้าตามประเภท
  const petProducts = cartItems.filter((item) =>
    isPetProduct(item.product.category)
  );

  const nonPetProducts = cartItems.filter(
    (item) => !isPetProduct(item.product.category)
  );

  const hasPets = petProducts.length > 0;

  // คำนวณราคารวมก่อนส่วนลด
  const totalAmount = cartItems.reduce((total, item) => {
    const price = item.product.salePrice || item.product.price;
    return total + price * item.quantity;
  }, 0);

  // คำนวณส่วนลด
  let discountAmount = 0;
  if (discount) {
    if (discount.type === "percentage") {
      discountAmount = (totalAmount * discount.value) / 100;
    } else if (discount.type === "fixed") {
      discountAmount = discount.value;
    }
  }

  // ราคารวมหลังหักส่วนลด
  const totalAmountAfterDiscount = Math.max(0, totalAmount - discountAmount);

  // กำหนดเงื่อนไขการชำระเงิน - ใช้ราคาหลังหักส่วนลด
  let requiresDeposit = false;
  let depositAmount: number | null = null;
  let remainingAmount: number | null = null;
  let paymentType: "FULL_PAYMENT" | "DEPOSIT_PAYMENT" = "FULL_PAYMENT";

  // เงื่อนไข: สัตว์เลี้ยงราคาเกิน 10,000 บาท (หลังหักส่วนลด) ต้องชำระมัดจำ 10%
  if (hasPets && totalAmountAfterDiscount > 10000) {
    requiresDeposit = true;
    depositAmount = Math.round(totalAmountAfterDiscount * 0.1 * 100) / 100; // 10% rounded to 2 decimal places
    remainingAmount =
      Math.round((totalAmountAfterDiscount - depositAmount) * 100) / 100;
    paymentType = "DEPOSIT_PAYMENT";
  }

  // กำหนดวิธีการจัดส่ง
  const suggestedShippingMethod: "pickup" | "delivery" = hasPets
    ? "pickup"
    : "delivery";

  return {
    hasPets,
    requiresDeposit,
    totalAmount,
    totalAmountAfterDiscount,
    depositAmount,
    remainingAmount,
    paymentType,
    suggestedShippingMethod,
    petProducts,
    nonPetProducts,
  };
}

/**
 * ตรวจสอบว่าสินค้าเป็นสัตว์เลี้ยงหรือไม่
 */
export function isPetProduct(category: string): boolean {
  const petCategories = ["dogs", "cats", "birds", "สุนัข", "แมว", "นก"];
  return petCategories.some((petCat) =>
    category.toLowerCase().includes(petCat.toLowerCase())
  );
}

/**
 * กรองตัวเลือกการจัดส่งตามประเภทสินค้า
 */
export function filterShippingOptions(
  shippingOptions: any[],
  orderAnalysis: OrderAnalysis
) {
  return shippingOptions.filter((option) => {
    // ถ้ามีสัตว์เลี้ยง ให้แสดงเฉพาะ pickup options
    if (orderAnalysis.hasPets) {
      return option.method === "pickup";
    }

    // ถ้าไม่มีสัตว์เลี้ยง ให้แสดงเฉพาะ delivery options หรือ pickup ทั่วไป
    return !option.forPetsOnly;
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
    : orderAnalysis.totalAmountAfterDiscount;

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

  return `ชำระเต็มจำนวน ${orderAnalysis.totalAmountAfterDiscount.toLocaleString()} บาท`;
}

/**
 * สร้างข้อความอธิบายการจัดส่ง
 */
export function getShippingDescription(orderAnalysis: OrderAnalysis): string {
  if (orderAnalysis.hasPets) {
    return (
      "เนื่องจากมีสัตว์เลี้ยงในคำสั่งซื้อ ทางเราจะทำการจัดส่งน้องด้วยตัวเอง " +
      "ตามนัดหมาย"
    );
  }

  return "จัดส่งด่วน";
}
