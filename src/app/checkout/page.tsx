"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  Chip,
  Slide,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  keyframes,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  GlobalStyles,
} from "@mui/material";
import type { SlideProps } from "@mui/material";
import {
  ArrowBack,
  CheckCircle,
  Close,
  CreditCard,
  AccountBalance,
  Wallet,
  LocalShipping,
  Add,
  Remove,
  Delete,
  ExpandMore,
  ExpandLess,
  LocalOffer,
  AccountCircle,
  Storefront,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { CartItem } from "@/types";
import { readCartFromStorage, clearCartStorage, updateQuantityInStorage, removeFromCartStorage } from "@/lib/cart";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";
import { 
  filterShippingOptions,
  calculatePaymentAmount,
  getPaymentDescription,
  getShippingDescription,
  OrderAnalysis,
  DiscountInfo
} from "@/lib/order-logic";

// Helper function to analyze order via API
const analyzeOrderViaAPI = async (cartItems: CartItem[], discountInfo?: DiscountInfo | null): Promise<OrderAnalysis> => {
  const response = await fetch('/api/analyze-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cartItems,
      discountInfo: discountInfo || undefined
    })
  });

  if (!response.ok) {
    throw new Error('Failed to analyze order');
  }

  return response.json();
};
import { getStripe } from "@/lib/stripe";
import ResponsiveHeader from "@/components/ResponsiveHeader";

// Define keyframes animation
const snackGrowAnimation = keyframes`
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
`;

interface DiscountCode {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minAmount?: number;
  description: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description?: string;
  method?: string;
  forPetsOnly?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: "credit_card" | "bank_transfer" | "e_wallet" | "cash_on_delivery";
  description?: string;
  icon?: string;
  isActive: boolean;
}

export default function CheckoutPage() {
  const SlideUpTransition = React.forwardRef<unknown, SlideProps>(
    function SlideUpTransition(props, ref) {
      return <Slide direction="up" ref={ref} {...props} />;
    }
  );

  const getMainImage = (product: CartItem['product']) => {
    // ลองหารูปหลักจาก images array ก่อน
    if (product.images && product.images.length > 0) {
      const mainImage = product.images.find(img => img.isMain);
      if (mainImage?.imageUrl) return mainImage.imageUrl;
      
      // ถ้าไม่มีรูปหลัก ใช้รูปแรก
      if (product.images[0]?.imageUrl) return product.images[0].imageUrl;
    }
    
    // fallback ไปยัง imageUrl หรือ image
    return product.imageUrl || product.image || "/images/icon-corgi.png";
  };

  // Get background color based on product ID (same as ProductCard)
  const getCardBgColor = (productId: string) => {
    const pastelColors = [
      colors.cardBg.orange,
      colors.cardBg.teal,
      colors.cardBg.yellow,
      colors.cardBg.blue,
      colors.cardBg.pink,
      colors.cardBg.lightOrange,
      colors.cardBg.lightTeal,
      colors.cardBg.lightYellow,
      colors.cardBg.lightBlue,
      colors.cardBg.lightPink,
    ];
    
    // Use product id to get consistent color for each product
    const colorIndex = Math.abs(productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % pastelColors.length;
    return pastelColors[colorIndex];
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "dogs":
        return "🐕";
      case "cats":
        return "🐱";
      case "birds":
        return "🐦";
      case "fish":
        return "🐠";
      default:
        return "🐾";
    }
  };

  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading } = useSimpleAuth();
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(
    null
  );
  const [selectedShipping, setSelectedShipping] = useState<string>("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [availableDiscountCodes, setAvailableDiscountCodes] = useState<
    DiscountCode[]
  >([]);
  const [orderAnalysis, setOrderAnalysis] = useState<OrderAnalysis | null>(null);
  const [filteredShippingOptions, setFilteredShippingOptions] = useState<ShippingOption[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderSuccessful, setOrderSuccessful] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    productName: string;
    productId: string;
  }>({ open: false, productName: "", productId: "" });
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);
  const [stripePromise] = useState(() => getStripe());
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // ฟังก์ชันแปลง appliedDiscount เป็น DiscountInfo
  const getDiscountInfo = (): DiscountInfo | null => {
    if (!appliedDiscount) return null;
    return {
      type: appliedDiscount.type as "percentage" | "fixed",
      value: appliedDiscount.value,
      code: appliedDiscount.code
    };
  };

  // ฟังก์ชันจัดการตะกร้าสินค้า
  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    const item = cartItems.find(item => item.product.id === productId);
    if (!item) return;

    const maxStock = item.product.stock || 0;
    
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQuantity > maxStock) {
      showSnackbar(`สินค้าในสต็อกเหลือเพียง ${maxStock} ชิ้น`, "warning");
      return;
    }

    updateQuantityInStorage(productId, newQuantity);
    const updatedItems = readCartFromStorage();
    setCartItems(updatedItems);
    
    // คำนวณ subtotal ใหม่ทันทีและตรวจสอบส่วนลด
    const newSubtotal = updatedItems.reduce((sum, item) => {
      return sum + calculateUnitPrice(item.product) * item.quantity;
    }, 0);
    
    console.log("🔄 Quantity Updated:", {
      productId,
      newQuantity,
      newSubtotal,
      hasDiscount: !!appliedDiscount,
      discountCode: appliedDiscount?.code,
      discountMinAmount: appliedDiscount?.minAmount,
      discountObject: appliedDiscount,
      shouldRemoveDiscount: appliedDiscount && appliedDiscount.minAmount && newSubtotal < appliedDiscount.minAmount
    });
    
    // ตรวจสอบส่วนลดทันที
    if (appliedDiscount && appliedDiscount.minAmount && newSubtotal < appliedDiscount.minAmount) {
      console.log(`🚫 Immediate removing discount ${appliedDiscount.code} - New Subtotal ${newSubtotal} < MinAmount ${appliedDiscount.minAmount}`);
      setAppliedDiscount(null);
      setDiscountCode("");
      showSnackbar(`ยกเลิกรหัสส่วนลด ${appliedDiscount.code} เนื่องจากยอดซื้อไม่ถึงขั้นต่ำ`, "warning");
    }
    
    // อัปเดต order analysis
    if (updatedItems.length > 0) {
      const analysis = await analyzeOrderViaAPI(updatedItems, getDiscountInfo());
      setOrderAnalysis(analysis);
    }

    showSnackbar("อัปเดตจำนวนสินค้าแล้ว", "success");
  };

  const handleRemoveItem = (productId: string) => {
    const item = cartItems.find(item => item.product.id === productId);
    if (!item) return;

    setConfirmDialog({
      open: true,
      productName: item.product.name,
      productId: productId,
    });
  };

  const confirmRemoveItem = async () => {
    const productId = confirmDialog.productId;
    removeFromCartStorage(productId);
    const updatedItems = readCartFromStorage();
    setCartItems(updatedItems);

    // คำนวณ subtotal ใหม่ (ถ้ามีสินค้าเหลือ)
    if (updatedItems.length > 0) {
      // การตรวจสอบส่วนลดจะถูกทำโดย useEffect โดยอัตโนมัติ
      // ไม่จำเป็นต้องตรวจสอบที่นี่
    } else {
      // ถ้าตะกร้าว่าง ให้ลบส่วนลดด้วย
      if (appliedDiscount) {
        console.log("🗑️ Cart is empty, removing discount");
        setAppliedDiscount(null);
        setDiscountCode("");
      }
    }

    // อัปเดต order analysis
    if (updatedItems.length > 0) {
      const analysis = await analyzeOrderViaAPI(updatedItems, getDiscountInfo());
      setOrderAnalysis(analysis);
    } else {
      setOrderAnalysis(null);
    }

    setConfirmDialog({ open: false, productName: "", productId: "" });
    showSnackbar("ลบสินค้าออกจากตะกร้า", "success");

    // ถ้าตะกร้าว่าง ให้กลับไปหน้าหลัก
    if (updatedItems.length === 0) {
      setTimeout(() => {
        handleLiffNavigation(router, "/");
      }, 1500);
    }
  };

  useEffect(() => {
    const items = readCartFromStorage();
    setCartItems(items);

    // วิเคราะห์คำสั่งซื้อ
    const initOrderAnalysis = async () => {
      if (items.length > 0) {
        const analysis = await analyzeOrderViaAPI(items, getDiscountInfo());
        setOrderAnalysis(analysis);
        console.log("Order Analysis:", analysis);
      }
    };
    
    initOrderAnalysis();

    // ดึงข้อมูล user profile จากฐานข้อมูล
    const fetchUserProfile = async () => {
      if (authUser) {
        try {
          const response = await fetch("/api/user/profile", {
            credentials: 'include' // Include cookies for auth
          });
          if (response.ok) {
            const userProfile = await response.json();
            console.log("User profile:", userProfile);
            
            setCustomerInfo((prev) => ({
              ...prev,
              name: userProfile.displayName || authUser?.displayName || "",
              email: userProfile.email || (authUser as any)?.email || "",
              phone: userProfile.phoneNumber || "",
            }));
            setUserProfileLoaded(true);
          } else {
            // ถ้า API ไม่สำเร็จ ใช้ข้อมูลจาก authUser
            setCustomerInfo((prev) => ({
              ...prev,
              name: authUser?.displayName || "",
              email: (authUser as any)?.email || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // ถ้าเกิดข้อผิดพลาด ใช้ข้อมูลจาก authUser
          setCustomerInfo((prev) => ({
            ...prev,
            name: authUser?.displayName || "",
            email: (authUser as any)?.email || "",
          }));
        }
      }
    };

    fetchUserProfile();

    // Fetch shipping options and discount codes
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch shipping options
        const shippingResponse = await fetch("/api/shipping-options");
        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json();
          const transformedShipping = shippingData.map(
            (option: ShippingOption) => ({
              id: option.id,
              name: option.name,
              description: option.description || "",
              price: Number(option.price),
              estimatedDays: option.estimatedDays,
              method: option.method,
              forPetsOnly: option.forPetsOnly,
            })
          );
          setShippingOptions(transformedShipping);
          
          // กรองตัวเลือกการจัดส่งตาม order analysis
          if (orderAnalysis) {
            const filtered = filterShippingOptions(transformedShipping, orderAnalysis);
            setFilteredShippingOptions(filtered);
            if (filtered.length > 0) {
              setSelectedShipping(filtered[0].id);
            }
          } else {
            setFilteredShippingOptions(transformedShipping);
            if (transformedShipping.length > 0) {
              setSelectedShipping(transformedShipping[0].id);
            }
          }
        }

        // Fetch payment methods
        const paymentResponse = await fetch("/api/payment-methods");
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          const transformedPayments = paymentData.map(
            (method: PaymentMethod) => ({
              id: method.id,
              name: method.name,
              type: method.type,
              description: method.description || "",
              icon: method.icon || "",
              isActive: method.isActive,
            })
          );
          const activePayments = transformedPayments.filter(
            (method: PaymentMethod) => method.isActive
          );
          setPaymentMethods(activePayments);
          if (activePayments.length > 0) {
            setSelectedPayment(activePayments[0].id);
          }
        }

        // Fetch discount codes
        const discountResponse = await fetch("/api/discount-codes");
        if (discountResponse.ok) {
          const discountData = await discountResponse.json();
          const now = Date.now();
          const transformedDiscounts = discountData
            .filter((code: any) => {
              // Hide expired codes: validUntil exists and is before now
              if (code.validUntil) {
                const until = new Date(code.validUntil).getTime();
                if (isFinite(until) && until < now) return false;
              }
              // Hide not-yet-active codes: validFrom exists and is after now
              if (code.validFrom) {
                const from = new Date(code.validFrom).getTime();
                if (isFinite(from) && from > now) return false;
              }
              // Only active codes
              if (code.isActive === false) return false;
              // Usage limit reached
              if (code.usageLimit && code.usageCount >= code.usageLimit) return false;
              return true;
            })
            .map((code: any) => {
              const rawType = code.type;
              const normalizedType = typeof rawType === 'string' && rawType.toUpperCase() === 'PERCENTAGE'
                ? 'percentage'
                : typeof rawType === 'string' && rawType.toUpperCase() === 'FIXED_AMOUNT'
                ? 'fixed'
                : (String(rawType || '').toLowerCase() === 'percentage' ? 'percentage' : 'fixed');
              return {
                id: code.id,
                code: code.code,
                type: normalizedType as 'percentage' | 'fixed',
                value: Number(code.value),
                minAmount: code.minAmount ? Number(code.minAmount) : undefined,
                description: code.description,
              } as DiscountCode;
            });
          setAvailableDiscountCodes(transformedDiscounts);
        }
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [authUser]);

  // อัปเดต shipping options เมื่อ order analysis เปลี่ยน
  useEffect(() => {
    if (orderAnalysis && shippingOptions.length > 0) {
      const filtered = filterShippingOptions(shippingOptions, orderAnalysis);
      setFilteredShippingOptions(filtered);
      
      // ตรวจสอบว่า selectedShipping ยังอยู่ใน filtered options หรือไม่
      const currentSelectionValid = filtered.find(opt => opt.id === selectedShipping);
      
      if (filtered.length > 0 && !currentSelectionValid) {
        console.log("Auto-selecting first shipping option:", filtered[0].id, filtered[0].name);
        setSelectedShipping(filtered[0].id);
      } else if (filtered.length > 0 && !selectedShipping) {
        // ถ้ายังไม่เลือกอะไรเลย ให้เลือกตัวแรก
        console.log("Setting initial shipping option:", filtered[0].id, filtered[0].name);
        setSelectedShipping(filtered[0].id);
      }
    }
  }, [orderAnalysis, shippingOptions]);

  // อัปเดต order analysis เมื่อส่วนลดเปลี่ยน หรือเมื่อเปลี่ยน payment method
  useEffect(() => {
    const updateOrderAnalysis = async () => {
      if (cartItems.length > 0) {
        const discountInfo = getDiscountInfo();
        console.log("🔄 Updating order analysis with discount:", discountInfo);
        
        const baseAnalysis = await analyzeOrderViaAPI(cartItems, discountInfo);
        console.log("📊 Base analysis result:", baseAnalysis);
        
        // บังคับให้บัตรเครดิตชำระเต็มจำนวน
        const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
        const isCreditCard = selectedPaymentMethod?.type === "credit_card";
        
        const finalAnalysis = isCreditCard 
          ? {
              ...baseAnalysis,
              paymentType: "FULL_PAYMENT" as const,
              requiresDeposit: false,
              depositAmount: 0,
              remainingAmount: baseAnalysis.totalAmount,
            }
          : baseAnalysis;
        
        console.log("✅ Setting final analysis:", finalAnalysis);
        setOrderAnalysis(finalAnalysis);
      }
    };
    
    updateOrderAnalysis();
  }, [appliedDiscount, cartItems, selectedPayment, paymentMethods]);

  

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      handleLiffNavigation(router, "/auth/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  const calculateUnitPrice = (product: CartItem["product"]) => {
    const hasSalePrice = product.salePrice != null;
    const hasDiscountPercent =
      !hasSalePrice &&
      product.discountPercent != null &&
      product.discountPercent > 0;
    if (hasSalePrice) return product.salePrice as number;
    if (hasDiscountPercent)
      return Math.max(
        0,
        product.price -
          product.price * ((product.discountPercent as number) / 100)
      );
    return product.price;
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + calculateUnitPrice(item.product) * item.quantity,
    0
  );

  // Re-validate applied discount to hide it if expired/inactive
  useEffect(() => {
    const revalidate = async () => {
      if (!appliedDiscount) return;
      try {
        const res = await fetch('/api/discount-codes/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: appliedDiscount.code, subtotal })
        });
        const data = await res.json();
        if (!res.ok || !data?.valid) {
          setAppliedDiscount(null);
          setDiscountCode('');
          showSnackbar(data?.error || 'รหัสส่วนลดหมดอายุแล้ว', 'warning');
        }
      } catch {
        // ignore network errors for revalidation
      }
    };
    revalidate();
    // Re-run when subtotal or code changes
  }, [appliedDiscount?.code, subtotal]);

  // ตรวจสอบส่วนลดเมื่อ subtotal เปลี่ยนแปลง
  useEffect(() => {
    console.log("🔍 Discount Validation Check:", {
      hasAppliedDiscount: !!appliedDiscount,
      discountCode: appliedDiscount?.code,
      minAmount: appliedDiscount?.minAmount,
      subtotal: subtotal,
      shouldRemove: appliedDiscount && appliedDiscount.minAmount && subtotal < appliedDiscount.minAmount
    });
    
    if (appliedDiscount && appliedDiscount.minAmount && subtotal < appliedDiscount.minAmount) {
      console.log(`🚫 Auto-removing discount ${appliedDiscount.code} - Subtotal ${subtotal} < MinAmount ${appliedDiscount.minAmount}`);
      setAppliedDiscount(null);
      setDiscountCode("");
      showSnackbar(`ยกเลิกรหัสส่วนลด ${appliedDiscount.code} เนื่องจากยอดซื้อไม่ถึงขั้นต่ำ`, "warning");
    }
  }, [subtotal, appliedDiscount, showSnackbar]);

  const selectedShippingOption = filteredShippingOptions.find(
    (option) => option.id === selectedShipping
  );
  
  // คำนวณค่าจัดส่งหลังหักส่วนลด FREESHIP
  const baseShippingCost = selectedShippingOption?.price || 0;
  const shippingCost = appliedDiscount?.code === "FREESHIP" ? 0 : baseShippingCost;

  // ส่วนลดตาม orderAnalysis (แม่นยำที่สุดเมื่อพร้อม)
  const discountAmountFromAnalysis = orderAnalysis && appliedDiscount
    ? orderAnalysis.totalAmountBeforeDiscount - orderAnalysis.totalAmount
    : 0;

  // ส่วนลดแบบคำนวณทันทีจากสถานะปัจจุบัน (fallback)
  const instantDiscountAmount = appliedDiscount
    ? appliedDiscount.code === "FREESHIP"
      ? baseShippingCost
      : appliedDiscount.type === "percentage"
        ? (subtotal * appliedDiscount.value) / 100
        : appliedDiscount.value
    : 0;

  // ใช้ส่วนลดจาก analysis หากพร้อม ไม่งั้นใช้แบบทันที
  const discountAmount = appliedDiscount
    ? discountAmountFromAnalysis > 0
      ? discountAmountFromAnalysis + (appliedDiscount.code === "FREESHIP" ? baseShippingCost : 0)
      : instantDiscountAmount
    : 0;

  // ยอดรวมสุดท้าย = ยอดสินค้าหลังหักส่วนลด + ค่าจัดส่งหลังหักส่วนลด
  const total = orderAnalysis
    ? orderAnalysis.totalAmount + shippingCost
    : subtotal + shippingCost - (appliedDiscount ? instantDiscountAmount : 0);

  // Debug logging สำหรับการคำนวณส่วนลด
  React.useEffect(() => {
    if (appliedDiscount && orderAnalysis) {
      console.log("🔍 Discount Debug:");
      console.log("  Applied Discount:", appliedDiscount);
      console.log("  Order Analysis Before Discount:", orderAnalysis.totalAmountBeforeDiscount);
      console.log("  Order Analysis After Discount:", orderAnalysis.totalAmount);
      console.log("  Base Shipping Cost:", baseShippingCost);
      console.log("  Final Shipping Cost:", shippingCost);
      console.log("  Calculated Discount Amount:", discountAmount);
      console.log("  Subtotal:", subtotal);
      console.log("  Final Total:", total);
      console.log("---");
    }
  }, [appliedDiscount, orderAnalysis, discountAmount, subtotal, shippingCost, total, baseShippingCost]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    try {
      const response = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: discountCode,
          subtotal: subtotal,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        const rawType = data.discountCode?.type;
        const normalizedType = typeof rawType === 'string' && rawType.toUpperCase() === 'PERCENTAGE'
          ? 'percentage'
          : typeof rawType === 'string' && rawType.toUpperCase() === 'FIXED_AMOUNT'
          ? 'fixed'
          : (String(rawType || '').toLowerCase() === 'percentage' ? 'percentage' : 'fixed');
        const normalized = { ...data.discountCode, type: normalizedType };
        console.log("✅ Applied discount successfully:", normalized);
        setAppliedDiscount(normalized);
        showSnackbar("ใช้รหัสส่วนลดสำเร็จ!", "success");
      } else {
        console.log("❌ Discount validation failed:", data.error);
        showSnackbar(data.error || "รหัสส่วนลดไม่ถูกต้อง", "error");
      }
    } catch {
      showSnackbar("เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด", "error");
    }
  };

  const handleRemoveDiscount = () => {
    console.log("🗑️ Removing discount");
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handlePlaceOrder = async () => {
    // ป้องกันการกดซ้ำ
    if (isProcessingOrder) {
      return;
    }

    if (
      !customerInfo.name ||
      !customerInfo.phone ||
      !customerInfo.address
    ) {
      showSnackbar("กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
      
      return;
    }

    if (!selectedShipping) {
      showSnackbar("กรุณาเลือกวิธีการจัดส่ง", "warning");
      
      return;
    }

    if (!selectedShippingOption) {
      console.error("Selected shipping option not found:", selectedShipping);
      console.error("Available options:", filteredShippingOptions);
      showSnackbar("ไม่พบวิธีการจัดส่งที่เลือก กรุณาเลือกใหม่", "error");
      
      return;
    }

    if (!orderAnalysis) {
      showSnackbar("เกิดข้อผิดพลาดในการคำนวณคำสั่งซื้อ", "error");
      
      return;
    }

    setLoading(true);
    setIsProcessingOrder(true);

    try {
      // สร้างเลขที่คำสั่งซื้อ
      const orderNumber = `OR${Date.now().toString().slice(-8)}`;
      
      // เตรียมข้อมูลสำหรับบันทึกคำสั่งซื้อ
      const shippingAddress = `${customerInfo.address}, ${customerInfo.city} ${customerInfo.postalCode}`.trim();
      const finalPaymentAmount = calculatePaymentAmount(
        orderAnalysis, 
        selectedShippingOption?.price || 0, 
        appliedDiscount?.code === "FREESHIP" ? selectedShippingOption?.price || 0 : 0
      );

      const selectedPaymentMethodObj = paymentMethods.find(method => method.id === selectedPayment);
      const orderCreateData = {
        orderNumber,
        totalAmount: orderAnalysis.totalAmount, // ✅ ใช้ totalAmount ใหม่ (ราคาหลังหักส่วนลด)
        discountAmount,
        discountCode: appliedDiscount?.code,
        paymentType: orderAnalysis.paymentType,
        paymentMethodType: selectedPaymentMethodObj?.type,
        paymentMethodId: selectedPaymentMethodObj?.id,
        depositAmount: orderAnalysis.depositAmount,
        remainingAmount: orderAnalysis.remainingAmount,
        shippingOptionId: selectedShipping,
        shippingMethod: selectedShippingOption?.name || "ไม่ระบุ",
        shippingFee: selectedShippingOption?.price || 0,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        shippingAddress,
        hasPets: orderAnalysis.hasPets,
        requiresDeposit: orderAnalysis.requiresDeposit,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: calculateUnitPrice(item.product)
        }))
      };

      // ตรวจสอบว่าเป็นบัตรเครดิตหรือไม่
      const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
      const isCreditCard = selectedPaymentMethod?.type === "credit_card";

      if (isCreditCard) {
        // สำหรับบัตรเครดิต - ใช้ Stripe Checkout
        console.log("=== STRIPE CHECKOUT ===");
        console.log("Creating Stripe checkout session for order:", orderCreateData.orderNumber);
        console.log("Payment amount (full payment):", orderAnalysis.totalAmount);
        
        const stripeResponse = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify({
            orderData: orderCreateData,
            customerInfo,
            shippingAddress,
            totalAmount: orderAnalysis.totalAmount,
            orderNumber: orderCreateData.orderNumber,
          }),
        });

        if (!stripeResponse.ok) {
          let errorPayload: any = {};
          try {
            const text = await stripeResponse.text();
            try {
              errorPayload = text ? JSON.parse(text) : {};
            } catch {
              errorPayload = { raw: text };
            }
          } catch {}
          console.error("Stripe API Error:", errorPayload, "status:", stripeResponse.status);
          const message = errorPayload?.error || errorPayload?.details || `Failed to create Stripe checkout session (HTTP ${stripeResponse.status})`;
          throw new Error(message);
        }

        const stripeData = await stripeResponse.json();
        console.log("Stripe checkout session created:", stripeData);

        // Redirect ไปหน้า Stripe Checkout
        if (stripeData.checkoutUrl) {
          window.location.href = stripeData.checkoutUrl;
          return;
        } else {
          throw new Error("No checkout URL received from Stripe");
        }
      }

      // สำหรับ payment methods อื่นๆ - ใช้วิธีเดิม
      console.log("=== REGULAR ORDER ===");
      console.log("Sending order data:", JSON.stringify(orderCreateData, null, 2));
      console.log("Selected shipping:", selectedShipping);
      console.log("Selected shipping option:", selectedShippingOption);
      console.log("Available shipping options:", shippingOptions);
      console.log("Filtered shipping options:", filteredShippingOptions);
      console.log("Cart items:", cartItems.map(item => ({ 
        id: item.product.id, 
        name: item.product.name, 
        quantity: item.quantity 
      })));
      console.log("Order analysis:", orderAnalysis);
      console.log("========================");
      
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderCreateData),
      });
      
      console.log("Order API response status:", orderResponse.status);

      if (!orderResponse.ok) {
        let errorMessage = "Failed to create order";
        try {
          const errorData = await orderResponse.json();
          console.error("API Error Response:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Server error (${orderResponse.status})`;
        }
        
        // แสดง error message ที่เฉพาะเจาะจง
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes("Products not found")) {
          userFriendlyMessage = "สินค้าบางชิ้นไม่พบในระบบ กรุณาลองใหม่";
        } else if (errorMessage.includes("Shipping option not found")) {
          userFriendlyMessage = "ไม่พบวิธีการจัดส่งที่เลือก กรุณาเลือกใหม่";
        } else if (errorMessage.includes("Insufficient stock")) {
          userFriendlyMessage = "สต็อกสินค้าไม่เพียงพอ";
        }
        
        throw new Error(userFriendlyMessage);
      }

      let orderResult;
      try {
        orderResult = await orderResponse.json();
        console.log("Order created successfully:", orderResult.order);
      } catch (parseError) {
        console.error("Failed to parse order response:", parseError);
        throw new Error("Failed to process order response");
      }
      
      // เตรียมข้อมูลสำหรับใบเสร็จ
      const receiptData = {
        orderNumber,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        items: cartItems.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: calculateUnitPrice(item.product),
          total: calculateUnitPrice(item.product) * item.quantity
        })),
        subtotal,
        shippingFee: selectedShippingOption?.price || 0,
        discountAmount,
        total: finalPaymentAmount,
        paymentType: orderAnalysis.paymentType,
        depositAmount: orderAnalysis.depositAmount,
        remainingAmount: orderAnalysis.remainingAmount,
        shippingMethod: selectedShippingOption?.name || "ไม่ระบุ",
        shippingAddress
      };

      // Debug auth information
      console.log("🔐 [CHECKOUT] Auth state before LINE API:");
      console.log("  - Is authenticated:", isAuthenticated);
      console.log("  - Auth user:", authUser);
      console.log("  - Has LINE user ID:", !!authUser?.lineUserId);
      console.log("  - Customer email:", customerInfo.email);
      console.log("  - Customer phone:", customerInfo.phone);

      // ส่งใบเสร็จไปที่ LINE
      console.log("🚀 [CHECKOUT] ส่งใบเสร็จไปยัง LINE API...");
      console.log("📊 [CHECKOUT] Receipt data:", receiptData);
      console.log("📱 [CHECKOUT] User Agent:", navigator.userAgent);
      console.log("🌐 [CHECKOUT] Is Mobile:", /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
      
      const lineResponse = await fetch("/api/line/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });
      
      console.log("📡 [CHECKOUT] LINE API response status:", lineResponse.status);

      let lineSuccess = false;
      let lineSkipped = false;
      
      try {
        if (lineResponse.ok) {
          const lineResult = await lineResponse.json();
          console.log("✅ [CHECKOUT] LINE Response:", lineResult);
          console.log("📝 [CHECKOUT] LINE Response message:", lineResult.message);
          if (lineResult.success) {
            lineSuccess = true;
            console.log("✅ [CHECKOUT] Receipt sent to LINE successfully");
          } else if (lineResult.skipLine) {
            lineSkipped = true;
            console.warn("⚠️ [CHECKOUT] LINE messaging skipped:", lineResult.message);
          }
        } else {
          try {
            const errorText = await lineResponse.text();
            console.error("❌ [CHECKOUT] Failed to send receipt to LINE:", errorText);
          } catch (textError) {
            console.error("❌ [CHECKOUT] Failed to send receipt to LINE (status:", lineResponse.status, ")");
          }
        }
      } catch (lineError) {
        console.error("❌ [CHECKOUT] LINE API error:", lineError);
        // LINE error ไม่ควรหยุดการสั่งซื้อ เนื่องจาก order ถูกบันทึกแล้ว
      }

      // Simulate order processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Clear cart
      clearCartStorage();

      showSnackbar(
        lineSuccess 
          ? "สั่งซื้อสำเร็จ! ใบเสร็จส่งไปยัง LINE แล้ว 🎉"
          : lineSkipped
          ? "สั่งซื้อสำเร็จ! (LINE messaging ยังไม่ได้ตั้งค่า)"
          : "สั่งซื้อสำเร็จ! กำลังเปลี่ยนหน้า...",
        "success"
      );
      
      
      // ทำให้ปุ่มชำระเงิน disabled ทันทีหลังจากสำเร็จ
      setOrderSuccessful(true);

      // Redirect to success page with payment information
      setTimeout(() => {
        const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
        const paymentMethodName = selectedPaymentMethod?.name || "";
        const queryParams = new URLSearchParams({
          orderNumber: orderNumber,
          paymentMethod: paymentMethodName,
          paymentType: orderAnalysis?.paymentType || "FULL_PAYMENT",
        });
        handleLiffNavigation(router, `/order-success?${queryParams.toString()}`);
      }, 2000);
    } catch (error) {
      console.error("Order placement error:", error);
      
      // แสดง error message ที่เฉพาะเจาะจงมากขึ้น
      let errorMessage = "เกิดข้อผิดพลาดในการสั่งซื้อ";
      
      if (error instanceof Error) {
        if (error.message.includes("Insufficient stock")) {
          errorMessage = "สต็อกสินค้าไม่เพียงพอ กรุณาตรวจสอบจำนวนสินค้าในตะกร้า";
        } else if (error.message.includes("not found")) {
          errorMessage = "ไม่พบข้อมูลสินค้าหรือวิธีการจัดส่ง กรุณาลองใหม่อีกครั้ง";
        } else if (error.message.includes("Server error")) {
          errorMessage = "เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้ง";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
        } else if (error.message) {
          errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
        }
      }
      
      showSnackbar(errorMessage, "error");
      
      
      // รีเซ็ต isProcessingOrder เมื่อเกิด error เพื่อให้สามารถลองใหม่ได้
      setIsProcessingOrder(false);
    } finally {
      setLoading(false);
      // จะ reset isProcessingOrder ใน catch block เฉพาะเมื่อเกิด error
      // สำหรับกรณีสำเร็จ จะคง disabled จนกว่าจะไปหน้า order-success
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Typography>กำลังโหลด...</Typography>
      </Box>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: colors.background.default,
          p: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1.5, sm: 2, md: 3 } }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: "bold",
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
            }}
          >
            ชำระเงิน
          </Typography>
        </Box>
        <Card>
          <CardContent sx={{ textAlign: "center", py: { xs: 4, sm: 6, md: 8 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              ตะกร้าสินค้าว่างเปล่า
            </Typography>
            <Button variant="contained" onClick={() => handleLiffNavigation(router, "/")}>
              กลับไปช้อปปิ้ง
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa', position: 'relative' }}>
      <GlobalStyles
        styles={{
          body: { overflowX: 'hidden' },
          '*': { boxSizing: 'border-box' }
        }}
      />
      <ResponsiveHeader />
      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <CircularProgress
            size={40}
            sx={{
              color: "#000",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              textAlign: "center",
            }}
          >
            กำลังดำเนินการ...
          </Typography>
        </Box>
      )}
      {/* Header spacer is internally provided by ResponsiveHeader */}

      {/* Order Summary */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 3,
          mb: 2,
          borderRadius: { xs: 0, sm: 1 },
          border: { xs: 'none', sm: '1px solid #e0e0e0' },
          mx: { xs: 0, sm: 2 },
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h6"
            sx={{ 
              fontWeight: 500, 
              color: "#333",
              fontSize: '1.125rem',
              mb: 2,
              px: 2
            }}
          >
            รายการสินค้า
          </Typography>
          
          <Box sx={{ px: 2 }}>
            {cartItems.map((item, index) => (
              <Box
                key={item.product.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 2,
                  borderBottom: index < cartItems.length - 1 ? "1px solid #f0f0f0" : "none",
                }}
              >
                {/* Product Image */}
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {getMainImage(item.product) && getMainImage(item.product) !== "/images/icon-corgi.png" ? (
                    <Box
                      component="img"
                      src={getMainImage(item.product)}
                      alt={item.product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/icon-corgi.png";
                      }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box sx={{ fontSize: "1.5rem", color: "#888" }}>
                      {getCategoryIcon(item.product.category)}
                    </Box>
                  )}
                </Box>
                
                {/* Product Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{ 
                      fontWeight: 500, 
                      mb: 0.5,
                      fontSize: '0.95rem',
                      lineHeight: 1.3,
                      color: "#333"
                    }}
                  >
                    {item.product.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "#666",
                      fontSize: '0.85rem',
                      mb: 1
                    }}
                  >
                    ฿{calculateUnitPrice(item.product).toLocaleString()} × {item.quantity}
                  </Typography>
                  
                  {/* Quantity Controls */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      sx={{
                        width: 28,
                        height: 28,
                        border: "1px solid #ddd",
                        "&:hover": { borderColor: "#999" },
                      }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 24,
                        textAlign: "center",
                        fontWeight: 500,
                        fontSize: '0.9rem'
                      }}
                    >
                      {item.quantity}
                    </Typography>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product.stock || 0)}
                      sx={{
                        width: 28,
                        height: 28,
                        border: "1px solid #ddd",
                        "&:hover": { borderColor: "#999" },
                      }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item.product.id)}
                      sx={{
                        ml: 1,
                        width: 28,
                        height: 28,
                        color: "#999",
                        "&:hover": { color: "#f44336" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Price */}
                <Box sx={{ textAlign: "right", minWidth: 80 }}>
                  <Typography
                    variant="body1"
                    sx={{ 
                      fontWeight: 600, 
                      color: "#333",
                      fontSize: '1rem'
                    }}
                  >
                    ฿{(calculateUnitPrice(item.product) * item.quantity).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Shipping Options */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 3,
          mb: 2,
          borderRadius: { xs: 0, sm: 1 },
          border: { xs: 'none', sm: '1px solid #e0e0e0' },
          mx: { xs: 0, sm: 2 },
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h6"
            sx={{ 
              fontWeight: 500, 
              color: "#333",
              fontSize: '1.125rem',
              mb: 2,
              px: 2
            }}
          >
            การจัดส่ง
          </Typography>
          
          {orderAnalysis && (
            <Box
              sx={{
                mx: 2,
                mb: 2,
                p: 2,
                borderRadius: 1,
                backgroundColor: orderAnalysis.hasPets ? "#fff8e1" : "#f3f4f6",
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "#666",
                  fontSize: '0.875rem',
                  textAlign: "center"
                }}
              >
                {orderAnalysis.hasPets 
                  ? "🚗 มีสัตว์เลี้ยงในรายการ - ทางร้านจัดส่งเอง"
                  : "🚚 สินค้าทั่วไป - จัดส่งด่วน 1-2 วัน"
                }
              </Typography>
            </Box>
          )}
          
          {loadingData ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <RadioGroup
              value={selectedShipping}
              onChange={(e) => setSelectedShipping(e.target.value)}
              sx={{ px: 2 }}
            >
              {filteredShippingOptions.map((option) => (
                <Box
                  key={option.id}
                  sx={{
                    border: selectedShipping === option.id ? "2px solid #000" : "1px solid #e0e0e0",
                    borderRadius: 1,
                    p: 2,
                    mb: 1,
                    backgroundColor: selectedShipping === option.id ? "#f9f9f9" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: selectedShipping === option.id ? "#000" : "#999",
                    }
                  }}
                  onClick={() => setSelectedShipping(option.id)}
                >
                  <FormControlLabel
                    value={option.id}
                    control={<Radio sx={{ display: "none" }} />}
                    label={
                      <Box sx={{ width: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: "#333" }}>
                            {option.name}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#333" }}>
                            {option.price > 0 ? `฿${option.price}` : "ฟรี"}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: "#666", fontSize: "0.875rem" }}>
                          {option.description} • {option.estimatedDays}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: "100%" }}
                  />
                </Box>
              ))}
            </RadioGroup>
          )}
        </Container>
      </Box>

      {/* Discount Code - Collapsible */}
      <Box
        sx={{
          backgroundColor: "white",
          mb: 2,
          borderRadius: { xs: 0, sm: 1 },
          border: { xs: 'none', sm: '1px solid #e0e0e0' },
          mx: { xs: 0, sm: 2 },
          overflow: "hidden",
        }}
      >
        <Container maxWidth="md">
          {/* Header ที่คลิกได้ */}
          <Box
            onClick={() => setShowDiscountSection(!showDiscountSection)}
            sx={{
              px: 2,
              py: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#f9f9f9",
              },
            }}
          >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LocalOffer sx={{ color: "#666", fontSize: 20 }} />
            <Typography
              variant="h6"
              sx={{ 
                fontWeight: 500, 
                color: "#333",
                fontSize: '1.125rem'
              }}
            >
              รหัสส่วนลด
            </Typography>
            {appliedDiscount && (
              <Chip
                label={`-฿${discountAmount.toLocaleString()}`}
                size="small"
                sx={{
                  backgroundColor: "#4caf50",
                  color: "white",
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
          {showDiscountSection ? <ExpandLess sx={{ color: "#666" }} /> : <ExpandMore sx={{ color: "#666" }} />}
        </Box>

        {/* เนื้อหาที่พับได้ */}
        {showDiscountSection && (
          <Box sx={{ px: 2, pb: 3, borderTop: "1px solid #f0f0f0" }}>
            {appliedDiscount ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  mt: 2,
                  borderRadius: 1,
                  backgroundColor: "#f0f8ff",
                  border: "1px solid #e3f2fd",
                }}
              >
                <CheckCircle sx={{ color: "#4caf50", fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, color: "#333" }}>
                    {appliedDiscount.code}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", fontSize: '0.875rem' }}>
                    {appliedDiscount.description}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveDiscount();
                  }} 
                  size="small"
                  sx={{ color: "#666", "&:hover": { color: "#333" } }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    placeholder="กรอกรหัสส่วนลด"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#f9f9f9",
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#999',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#333',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.9rem',
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleApplyDiscount}
                    disabled={!discountCode.trim()}
                    sx={{
                      borderColor: '#333',
                      color: '#333',
                      px: 3,
                      '&:hover': {
                        borderColor: '#000',
                        backgroundColor: '#f5f5f5',
                      },
                      '&.Mui-disabled': {
                        borderColor: '#e0e0e0',
                        color: '#999',
                      }
                    }}
                  >
                    ใช้
                  </Button>
                </Box>
                {availableDiscountCodes.length > 0 && (
                  <>
                    <Typography variant="body2" sx={{ color: "#666", mb: 1, fontSize: '0.875rem' }}>
                      รหัสส่วนลดที่ใช้ได้:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                      {availableDiscountCodes
                        .filter((code) => {
                          // กรองเฉพาะรหัสที่ตรงตามยอดขั้นต่ำ
                          return !code.minAmount || subtotal >= code.minAmount;
                        })
                        .map((code) => (
                        <Box
                          key={code.code}
                          onClick={() => setDiscountCode(code.code)}
                          sx={{
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            padding: "6px 12px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            "&:hover": {
                              backgroundColor: "#f0f0f0",
                              borderColor: "#ccc",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#333",
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: "#333",
                              fontSize: "0.8rem",
                            }}
                          >
                            {code.code}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                            }}
                          >
                            {code.type === "percentage" 
                              ? `${code.value}%` 
                              : `฿${code.value}`
                            }
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    {/* แสดงรหัสที่ไม่ตรงเงื่อนไข */}
                    {(() => {
                      const ineligibleCodes = availableDiscountCodes.filter(code => code.minAmount && subtotal < code.minAmount);
                      return ineligibleCodes.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ color: "#666", mb: 1, fontSize: '0.875rem' }}>
                            รหัสส่วนลดที่ต้องซื้อเพิ่ม:
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {ineligibleCodes.map((code) => (
                              <Box
                                key={code.code}
                                sx={{
                                  backgroundColor: "#f5f5f5",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: 1,
                                  padding: "6px 12px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  opacity: 0.6,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    backgroundColor: "#bbb",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: "#999",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {code.code}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#999",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  ซื้อเพิ่ม ฿{((code.minAmount || 0) - subtotal).toLocaleString()}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    })()}
                    {availableDiscountCodes.filter(code => !code.minAmount || subtotal >= code.minAmount).length === 0 && (
                      <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic", textAlign: "center", mt: 1, fontSize: '0.875rem' }}>
                        ไม่มีรหัสส่วนลดที่ใช้ได้กับยอดซื้อปัจจุบัน
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        )}
        </Container>
      </Box>

      {/* Payment Methods */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 3,
          mb: 2,
          borderRadius: { xs: 0, sm: 1 },
          border: { xs: 'none', sm: '1px solid #e0e0e0' },
          mx: { xs: 0, sm: 2 },
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h6"
            sx={{ 
              fontWeight: 500, 
              color: "#333",
              fontSize: '1.125rem',
              mb: 2,
              px: 2
            }}
          >
            วิธีชำระเงิน
          </Typography>
          
        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <RadioGroup
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            sx={{ px: 2 }}
          >
            {paymentMethods.map((method) => {
              const getPaymentIcon = () => {
                switch (method.type) {
                  case "credit_card":
                    return <CreditCard />;
                  case "bank_transfer":
                    return <AccountBalance />;
                  case "e_wallet":
                    return <Wallet />;
                  case "cash_on_delivery":
                    return <LocalShipping />;
                  default:
                    return <CreditCard />;
                }
              };

              return (
                <Box
                  key={method.id}
                  sx={{
                    border: selectedPayment === method.id ? "2px solid #000" : "1px solid #e0e0e0",
                    borderRadius: 1,
                    p: 2,
                    mb: 1,
                    backgroundColor: selectedPayment === method.id ? "#f9f9f9" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: selectedPayment === method.id ? "#000" : "#999",
                    }
                  }}
                  onClick={() => setSelectedPayment(method.id)}
                >
                  <FormControlLabel
                    value={method.id}
                    control={<Radio sx={{ display: "none" }} />}
                    label={
                      <Box sx={{ width: "100%", cursor: "pointer" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: method.description ? 0.5 : 0,
                          }}
                        >
                          <Box
                            sx={{
                              color: selectedPayment === method.id ? "#333" : "#666",
                              fontSize: 20
                            }}
                          >
                            {getPaymentIcon()}
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500, flex: 1, color: "#333" }}
                          >
                            {method.name}
                          </Typography>
                        </Box>
                        {method.description && (
                          <Typography
                            variant="body2"
                            sx={{ color: "#666", fontSize: "0.875rem", ml: 4.5 }}
                          >
                            {method.description}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ m: 0, width: "100%" }}
                  />
                </Box>
              );
            })}
          </RadioGroup>
        )}
        
        {/* แสดงข้อความแจ้งเตือนเมื่อเลือกบัตรเครดิต */}
        {(() => {
          const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
          return selectedPaymentMethod?.type === "credit_card";
        })() && (
          <Box sx={{ mt: 2, px: 2 }}>
            <Box
              sx={{
                backgroundColor: "#fff8e1",
                border: "1px solid #ffcc02",
                borderRadius: 1,
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500, 
                    color: "#333",
                    mb: 0.5,
                    fontSize: '0.9rem'
                  }}
                >
                  การชำระด้วยบัตรเครดิต
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: "#666",
                    fontSize: "0.8rem"
                  }}
                >
                  • ชำระเต็มจำนวนเท่านั้น (ไม่สามารถชำระมัดจำได้)
                  <br />
                  • รองรับบัตรเครดิต/เดบิต ทุกธนาคาร
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        </Container>
      </Box>

      {/* Customer Information */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 3,
          mb: 2,
          borderRadius: { xs: 0, sm: 1 },
          border: { xs: 'none', sm: '1px solid #e0e0e0' },
          mx: { xs: 0, sm: 2 },
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ px: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography
              variant="h6"
              sx={{ 
                fontWeight: 500, 
                color: "#333",
                fontSize: '1.125rem'
              }}
            >
              ข้อมูลการจัดส่ง
            </Typography>
            {userProfileLoaded && (customerInfo.email || customerInfo.phone) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccountCircle sx={{ fontSize: 16, color: "#666" }} />
                <Typography variant="caption" sx={{ color: "#666", fontWeight: 500, fontSize: '0.75rem' }}>
                  จากโปรไฟล์
                </Typography>
              </Box>
            )}
          </Box>

        </Box>
        <Box sx={{ px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="ชื่อ-นามสกุล"
            value={customerInfo.name}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#f9f9f9",
                "& fieldset": {
                  borderColor: "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#999",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#333",
                },
              },
            }}
          />
          <TextField
            fullWidth
            label="อีเมล"
            type="email"
            value={customerInfo.email}
            onChange={(e) =>
              setCustomerInfo((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            placeholder={!customerInfo.email ? "อีเมลของคุณ" : ""}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: userProfileLoaded && customerInfo.email ? 
                  "#f0f8ff" : "#f9f9f9",
                "& fieldset": {
                  borderColor: userProfileLoaded && customerInfo.email ? 
                    "#e3f2fd" : "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#999",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#333",
                },
              },
            }}
          />
          <TextField
            fullWidth
            label="เบอร์โทรศัพท์"
            type="tel"
            inputMode="numeric"
            value={customerInfo.phone}
            onChange={(e) => {
              // อนุญาตเฉพาะตัวเลข และจำกัดความยาวไม่เกิน 15 หลัก
              const numericValue = e.target.value.replace(/\D/g, '').slice(0, 15);
              setCustomerInfo((prev) => ({
                ...prev,
                phone: numericValue,
              }));
            }}
            onKeyDown={(e) => {
              // อนุญาตให้กด: ตัวเลข, Backspace, Delete, Tab, Arrow keys, Home, End
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
              const isNumber = /[0-9]/.test(e.key);
              const isAllowedKey = allowedKeys.includes(e.key);
              
              if (!isNumber && !isAllowedKey) {
                e.preventDefault();
              }
            }}
            placeholder={!customerInfo.phone ? "0812345678" : ""}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: userProfileLoaded && customerInfo.phone ? 
                  "#f0f8ff" : "#f9f9f9",
                "& fieldset": {
                  borderColor: userProfileLoaded && customerInfo.phone ? 
                    "#e3f2fd" : "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#999",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#333",
                },
              },
            }}
          />
          <TextField
            fullWidth
            label="ที่อยู่"
            multiline
            rows={3}
            value={customerInfo.address}
            onChange={(e) =>
              setCustomerInfo((prev) => ({
                ...prev,
                address: e.target.value,
              }))
            }
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#f9f9f9",
                "& fieldset": {
                  borderColor: "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#999",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#333",
                },
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              label="จังหวัด"
              value={customerInfo.city}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, city: e.target.value }))
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f9f9f9",
                  "& fieldset": {
                    borderColor: "#e0e0e0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#999",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#333",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="รหัสไปรษณีย์"
              value={customerInfo.postalCode}
              onChange={(e) =>
                setCustomerInfo((prev) => ({
                  ...prev,
                  postalCode: e.target.value,
                }))
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f9f9f9",
                  "& fieldset": {
                    borderColor: "#e0e0e0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#999",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#333",
                  },
                },
              }}
            />
          </Box>
        </Box>
        </Container>
      </Box>

      {/* Payment Summary */}
      {orderAnalysis && (
        <Box
          sx={{
            backgroundColor: "white",
            py: 4,
            mb: 1,
            borderBottom: { xs: "4px solid " + colors.background.default, sm: "6px solid " + colors.background.default, md: "8px solid " + colors.background.default },
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: { xs: "100%", sm: "100%", md: "1200px" }, mx: "auto" }}>
            <Box sx={{ px: { xs: 0.5, sm: 1, md: 3 }, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
            >
              สรุปการชำระเงิน
            </Typography>
          </Box>
          
          <Box sx={{ px: { xs: 0.5, sm: 1, md: 3 } }}>
            {/* รายการคำนวณ */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body1" color="text.secondary">
                  ยอดรวมสินค้า
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  ฿{subtotal.toLocaleString()}
                </Typography>
              </Box>
              
              {selectedShippingOption && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" color="text.secondary">
                    ค่าจัดส่ง ({selectedShippingOption.name})
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {shippingCost > 0 ? `฿${shippingCost.toLocaleString()}` : "ฟรี"}
                  </Typography>
                </Box>
              )}
              
              {appliedDiscount && discountAmount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" color="text.secondary">
                    ส่วนลด ({appliedDiscount.code})
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#4caf50" }}>
                    -฿{discountAmount.toLocaleString()}
                  </Typography>
                </Box>
              )}
              
              <Divider />
              
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ยอดรวมทั้งหมด
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.primary.main }}>
                  ฿{(() => {
                    // ใช้ orderAnalysis.totalAmount (ที่หักส่วนลดแล้ว) + ค่าจัดส่ง สำหรับทุกประเภทการชำระเงิน
                    if (orderAnalysis) {
                      const finalTotal = orderAnalysis.totalAmount + shippingCost;
                      return finalTotal.toLocaleString();
                    }
                    // fallback ในกรณีที่ยังไม่มี orderAnalysis
                    return total.toLocaleString();
                  })()}
                </Typography>
              </Box>
              
              {/* แสดงข้อมูลการชำระเงินแบบชัดเจน */}
              {orderAnalysis.requiresDeposit && (() => {
                const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
                return selectedPaymentMethod?.type !== "credit_card";
              })() ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: `${colors.primary.main}08`,
                    border: `2px solid ${colors.primary.main}30`,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: colors.primary.main,
                      mb: { xs: 1, sm: 1.5, md: 2 },
                      textAlign: "center"
                    }}
                  >
                    💳 การชำระเงินแบบมัดจำ
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        ยอดมัดจำ ({orderAnalysis.depositRate}%)
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: colors.primary.main,
                          fontSize: "1.25rem"
                        }}
                      >
                        ฿{(() => {
                          const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
                          if (selectedPaymentMethod?.type === "credit_card") {
                            // บัตรเครดิต: ชำระเต็มจำนวน (ยอดหลังหักส่วนลด + ค่าจัดส่ง)
                            const totalWithShipping = orderAnalysis.totalAmount + shippingCost;
                            return totalWithShipping.toLocaleString();
                          } else {
                            // การชำระปกติ: ใช้ยอดมัดจำ + ค่าจัดส่ง หรือ ยอดเต็ม + ค่าจัดส่ง
                            const paymentAmount = orderAnalysis.requiresDeposit 
                              ? (orderAnalysis.depositAmount || 0) + shippingCost
                              : orderAnalysis.totalAmount + shippingCost;
                            return paymentAmount.toLocaleString();
                          }
                        })()}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ borderStyle: "dashed" }} />
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        ยอดคงเหลือ
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: "#ff9800",
                          fontSize: "1.1rem"
                        }}
                      >
                        ฿{orderAnalysis.remainingAmount?.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fff3e0",
                        border: "1px solid #ffcc02",
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: "#f57c00", 
                          fontWeight: 500,
                          textAlign: "center"
                        }}
                      >
                        💡 ยอดคงเหลือชำระเมื่อรับสัตว์เลี้ยง
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (() => {
                const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
                return selectedPaymentMethod?.type === "credit_card";
              })() ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: `${colors.primary.main}15`,
                    border: `2px solid ${colors.primary.main}30`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 1 }}>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: colors.primary.main,
                        textAlign: "center"
                      }}
                    >
                      การชำระด้วยบัตรเครดิต
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: colors.text.secondary,
                      textAlign: "center",
                      fontSize: "0.875rem"
                    }}
                  >
                    ชำระเต็มจำนวน ฿{(() => {
                      const totalWithShipping = orderAnalysis.totalAmount + shippingCost;
                      return totalWithShipping.toLocaleString();
                    })()} ผ่านระบบ Stripe
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2,
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: "#f0f9ff",
                    border: "2px solid #3b82f630",
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      textAlign: "center",
                      color: "#1e40af",
                      fontWeight: 500
                    }}
                  >
                    ชำระเต็มจำนวน
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          </Container>
        </Box>
      )}

      {/* Spacer สำหรับ fixed bottom */}
      <Box sx={{ height: 30 , marginTop:'50px' }} />

      {/* Order Total - Fixed Bottom */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          py: 2,
          px: 3,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          zIndex: 1000,
          
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: { xs: "100%", sm: "100%", md: "1200px" }, mx: "auto", px: { xs: 0.5, sm: 1, md: 3 } }}>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handlePlaceOrder}
          disabled={loading || isProcessingOrder || orderSuccessful}
          sx={{
            py: 2,
            fontSize: "1.1rem",
            fontWeight: 600,
            borderRadius: 3,
            backgroundColor: colors.primary.main,
            boxShadow: `0 4px 20px ${colors.primary.main}40`,
            "&:hover": {
              backgroundColor: colors.primary.dark,
              boxShadow: `0 6px 25px ${colors.primary.main}50`,
            },
            "&:disabled": {
              backgroundColor: colors.text.disabled,
              boxShadow: "none",
            },
          }}
        >
          {orderSuccessful ? "สั่งซื้อสำเร็จ - กำลังเปลี่ยนหน้า..." :
            loading || isProcessingOrder ? 
            (isProcessingOrder ? "กำลังประมวลผล..." : "กำลังดำเนินการ...") : 
            orderAnalysis ? (
              (() => {
                const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedPayment);
                
                if (selectedPaymentMethod?.type === "credit_card") {
                  // บัตรเครดิต: ชำระเต็มจำนวน (ใช้ยอดหลังหักส่วนลด + ค่าจัดส่ง)
                  const totalWithShipping = orderAnalysis.totalAmount + shippingCost;
                  return `ชำระเต็มจำนวน (฿${totalWithShipping.toLocaleString()})`;
                } else if (orderAnalysis.requiresDeposit) {
                  // การชำระมัดจำ: ใช้ยอดมัดจำ + ค่าจัดส่ง
                  const depositWithShipping = (orderAnalysis.depositAmount || 0) + shippingCost;
                  return `ชำระมัดจำ (฿${depositWithShipping.toLocaleString()})`;
                } else {
                  // ชำระเต็มจำนวน: ใช้ยอดหลังหักส่วนลด + ค่าจัดส่ง
                  const totalWithShipping = orderAnalysis.totalAmount + shippingCost;
                  return `ชำระเต็มจำนวน (฿${totalWithShipping.toLocaleString()})`;
                }
              })()
            ) : "ชำระเงิน"}
        </Button>
        </Container>
      </Box>

      {/* Snackbar */}
      <SnackbarComponent />

      {/* Dialog ยืนยันการลบสินค้า */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, productName: "", productId: "" })}
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          ยืนยันการลบสินค้า
        </DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบ "{confirmDialog.productName}" ออกจากตะกร้าสินค้าหรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDialog({ open: false, productName: "", productId: "" })}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={confirmRemoveItem}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            ลบสินค้า
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
