"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Alert,
  Snackbar,
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
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { CartItem } from "@/types";
import { readCartFromStorage, clearCartStorage, updateQuantityInStorage, removeFromCartStorage } from "@/lib/cart";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { 
  analyzeOrder, 
  filterShippingOptions,
  calculatePaymentAmount,
  getPaymentDescription,
  getShippingDescription,
  OrderAnalysis,
  DiscountInfo
} from "@/lib/order-logic";

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

  const router = useRouter();
  const { data: session, status } = useSession();
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [snackbarKey, setSnackbarKey] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    productName: string;
    productId: string;
  }>({ open: false, productName: "", productId: "" });
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);

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
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const item = cartItems.find(item => item.product.id === productId);
    if (!item) return;

    const maxStock = item.product.stock || 0;
    
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQuantity > maxStock) {
      setSnackbar({
        open: true,
        message: `สินค้าในสต็อกเหลือเพียง ${maxStock} ชิ้น`,
        severity: "warning",
      });
      return;
    }

    updateQuantityInStorage(productId, newQuantity);
    const updatedItems = readCartFromStorage();
    setCartItems(updatedItems);
    
    // อัปเดต order analysis
    if (updatedItems.length > 0) {
      const analysis = analyzeOrder(updatedItems, getDiscountInfo());
      setOrderAnalysis(analysis);
    }

    setSnackbar({
      open: true,
      message: "อัปเดตจำนวนสินค้าแล้ว",
      severity: "success",
    });
    setSnackbarKey(prev => prev + 1);
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

  const confirmRemoveItem = () => {
    const productId = confirmDialog.productId;
    removeFromCartStorage(productId);
    const updatedItems = readCartFromStorage();
    setCartItems(updatedItems);

    // อัปเดต order analysis
    if (updatedItems.length > 0) {
      const analysis = analyzeOrder(updatedItems, getDiscountInfo());
      setOrderAnalysis(analysis);
    } else {
      setOrderAnalysis(null);
    }

    setConfirmDialog({ open: false, productName: "", productId: "" });
    setSnackbar({
      open: true,
      message: "ลบสินค้าออกจากตะกร้าแล้ว",
      severity: "success",
    });
    setSnackbarKey(prev => prev + 1);

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
    if (items.length > 0) {
      const analysis = analyzeOrder(items, getDiscountInfo());
      setOrderAnalysis(analysis);
      console.log("Order Analysis:", analysis);
    }

    // ดึงข้อมูล user profile จากฐานข้อมูล
    const fetchUserProfile = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const userProfile = await response.json();
            console.log("User profile:", userProfile);
            
            setCustomerInfo((prev) => ({
              ...prev,
              name: userProfile.displayName || session.user?.name || "",
              email: userProfile.email || session.user?.email || "",
              phone: userProfile.phoneNumber || "",
            }));
            setUserProfileLoaded(true);
          } else {
            // ถ้า API ไม่สำเร็จ ใช้ข้อมูลจาก session
            setCustomerInfo((prev) => ({
              ...prev,
              name: session.user?.name || "",
              email: session.user?.email || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // ถ้าเกิดข้อผิดพลาด ใช้ข้อมูลจาก session
          setCustomerInfo((prev) => ({
            ...prev,
            name: session.user?.name || "",
            email: session.user?.email || "",
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
          const transformedDiscounts = discountData.map(
            (code: DiscountCode) => ({
              id: code.id,
              code: code.code,
              type: code.type,
              value: Number(code.value),
              minAmount: code.minAmount ? Number(code.minAmount) : undefined,
              description: code.description,
            })
          );
          setAvailableDiscountCodes(transformedDiscounts);
        }
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [session]);

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

  // อัปเดต order analysis เมื่อส่วนลดเปลี่ยน
  useEffect(() => {
    if (cartItems.length > 0) {
      const analysis = analyzeOrder(cartItems, getDiscountInfo());
      setOrderAnalysis(analysis);
    }
  }, [appliedDiscount, cartItems]);

  useEffect(() => {
    if (status !== "loading" && !session) {
      handleLiffNavigation(router, "/auth/signin");
    }
  }, [session, status, router]);

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

  const selectedShippingOption = filteredShippingOptions.find(
    (option) => option.id === selectedShipping
  );
  const shippingCost =
    appliedDiscount?.code === "FREESHIP"
      ? 0
      : selectedShippingOption?.price || 0;

  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "percentage"
      ? (subtotal * appliedDiscount.value) / 100
      : appliedDiscount.code === "FREESHIP"
      ? selectedShippingOption?.price || 0
      : appliedDiscount.value
    : 0;

  const total = subtotal + shippingCost - discountAmount;

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
        setAppliedDiscount(data.discountCode);
        setSnackbar({
          open: true,
          message: "ใช้รหัสส่วนลดสำเร็จ!",
          severity: "success",
        });
        setSnackbarKey((k) => k + 1);
      } else {
        setSnackbar({
          open: true,
          message: data.error || "รหัสส่วนลดไม่ถูกต้อง",
          severity: "error",
        });
        setSnackbarKey((k) => k + 1);
      }
    } catch {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
    }
  };

  const handleRemoveDiscount = () => {
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
      setSnackbar({
        open: true,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
      return;
    }

    if (!selectedShipping) {
      setSnackbar({
        open: true,
        message: "กรุณาเลือกวิธีการจัดส่ง",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
      return;
    }

    if (!selectedShippingOption) {
      console.error("Selected shipping option not found:", selectedShipping);
      console.error("Available options:", filteredShippingOptions);
      setSnackbar({
        open: true,
        message: "ไม่พบวิธีการจัดส่งที่เลือก กรุณาเลือกใหม่",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
      return;
    }

    if (!orderAnalysis) {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการคำนวณคำสั่งซื้อ",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
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

      const orderCreateData = {
        orderNumber,
        totalAmount: finalPaymentAmount,
        discountAmount,
        discountCode: appliedDiscount?.code,
        paymentType: orderAnalysis.paymentType,
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

      // บันทึกคำสั่งซื้อลงฐานข้อมูล
      console.log("=== ORDER DEBUG INFO ===");
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

      // ส่งใบเสร็จไปที่ LINE
      const lineResponse = await fetch("/api/line/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });

      let lineSuccess = false;
      let lineSkipped = false;
      
      try {
        if (lineResponse.ok) {
          const lineResult = await lineResponse.json();
          if (lineResult.success) {
            lineSuccess = true;
            console.log("Receipt sent to LINE successfully");
          } else if (lineResult.skipLine) {
            lineSkipped = true;
            console.warn("LINE messaging is not configured");
          }
        } else {
          try {
            const errorText = await lineResponse.text();
            console.error("Failed to send receipt to LINE:", errorText);
          } catch (textError) {
            console.error("Failed to send receipt to LINE (status:", lineResponse.status, ")");
          }
        }
      } catch (lineError) {
        console.error("LINE API error:", lineError);
        // LINE error ไม่ควรหยุดการสั่งซื้อ เนื่องจาก order ถูกบันทึกแล้ว
      }

      // Simulate order processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Clear cart
      clearCartStorage();

      setSnackbar({
        open: true,
        message: lineSuccess 
          ? "สั่งซื้อสำเร็จ! ใบเสร็จส่งไปยัง LINE แล้ว 🎉"
          : lineSkipped
          ? "สั่งซื้อสำเร็จ! (LINE messaging ยังไม่ได้ตั้งค่า)"
          : "สั่งซื้อสำเร็จ! กำลังเปลี่ยนหน้า...",
        severity: "success",
      });
      setSnackbarKey((k) => k + 1);
      
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
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
      
      // รีเซ็ต isProcessingOrder เมื่อเกิด error เพื่อให้สามารถลองใหม่ได้
      setIsProcessingOrder(false);
    } finally {
      setLoading(false);
      // จะ reset isProcessingOrder ใน catch block เฉพาะเมื่อเกิด error
      // สำหรับกรณีสำเร็จ จะคง disabled จนกว่าจะไปหน้า order-success
    }
  };

  if (status === "loading") {
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
          p: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            ชำระเงิน
          </Typography>
        </Box>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
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
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.background.default,
        position: "relative",
      }}
    >
      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <CircularProgress
            size={60}
            sx={{
              color: colors.primary.main,
              "& .MuiCircularProgress-circle": {
                strokeLinecap: "round",
              },
            }}
          />
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
                mb: 1,
              }}
            >
              กำลังประมวลผลคำสั่งซื้อ
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.text.secondary,
                maxWidth: 300,
                lineHeight: 1.6,
              }}
            >
              กรุณารอสักครู่ เรากำลังบันทึกคำสั่งซื้อของคุณ
              <br />
              และเตรียมส่งใบเสร็จไปยัง LINE
            </Typography>
          </Box>
          <Box
            sx={{
              width: 200,
              height: 4,
              backgroundColor: "rgba(0,0,0,0.1)",
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                backgroundColor: colors.primary.main,
                borderRadius: 2,
                animation: "loadingProgress 2s ease-in-out infinite",
                "@keyframes loadingProgress": {
                  "0%": {
                    width: "0%",
                    transform: "translateX(0)",
                  },
                  "50%": {
                    width: "70%",
                    transform: "translateX(0)",
                  },
                  "100%": {
                    width: "100%",
                    transform: "translateX(0)",
                  },
                },
              }}
            />
          </Box>
        </Box>
      )}
      {/* Clean Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 100,
          py: 3,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Box
          sx={{
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={() => router.back()}
              sx={{
                mr: 2,
                backgroundColor: "rgba(0,0,0,0.04)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                borderRadius: 2,
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
            >
              ชำระเงิน
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: colors.text.secondary, fontWeight: 500 }}
          >
            {cartItems.length} รายการ
          </Typography>
        </Box>
      </Box>

      {/* Order Summary */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 4,
          mb: 1,
          borderBottom: "8px solid " + colors.background.default,
        }}
      >
        <Box sx={{ px: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 600, color: colors.text.primary }}
          >
            รายการสินค้า
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {cartItems.map((item, index) => (
            <Box
              key={item.product.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                py: 2,
                px: 1,
                borderTop: index > 0 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}
            >
              <Avatar
                src={getMainImage(item.product)}
                alt={item.product.name}
                sx={{ width: 64, height: 64, borderRadius: 3 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/icon-corgi.png";
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {item.product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  ฿{calculateUnitPrice(item.product).toLocaleString()} ต่อชิ้น
                </Typography>
                
                {/* ควบคุมจำนวนสินค้า */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    sx={{
                      backgroundColor: colors.background.paper,
                      "&:hover": { backgroundColor: colors.primary.light },
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      minWidth: 40,
                      textAlign: "center",
                      fontWeight: 600,
                      px: 1,
                    }}
                  >
                    {item.quantity}
                  </Typography>
                  
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= (item.product.stock || 0)}
                    sx={{
                      backgroundColor: colors.background.paper,
                      "&:hover": { backgroundColor: colors.primary.light },
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem(item.product.id)}
                    sx={{
                      ml: 1,
                      color: "#f44336",
                      "&:hover": { backgroundColor: "#f4433610" },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
                
                {/* แสดงสต็อกคงเหลือ */}
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  สต็อกคงเหลือ: {item.product.stock || 0} ชิ้น
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: colors.primary.main }}
                >
                  ฿{(calculateUnitPrice(item.product) * item.quantity).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  รวม {item.quantity} ชิ้น
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Shipping Options */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 4,
          mb: 1,
          borderBottom: "8px solid " + colors.background.default,
        }}
      >
        <Box sx={{ px: 3, mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: colors.text.primary }}
          >
            การจัดส่ง
          </Typography>
        </Box>
        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <RadioGroup
            value={selectedShipping}
            onChange={(e) => setSelectedShipping(e.target.value)}
            sx={{ gap: 1 }}
          >
            {filteredShippingOptions.map((option) => (
              <Box
                key={option.id}
                sx={{
                  ml:2,
                  mr:2,
                  border:
                    selectedShipping === option.id
                      ? `2px solid ${colors.primary.main}`
                      : "2px solid transparent",
                  borderRadius: 3,
                  p: 2,
                  backgroundColor:
                    selectedShipping === option.id
                      ? `${colors.primary.main}08`
                      : colors.background.default,
                  transition: "all 0.2s ease",
                }}
              >
                <FormControlLabel
                  value={option.id}
                  control={<Radio sx={{ display: "none" }} />}
                  label={
                    <Box sx={{ width: "100%", cursor: "pointer" }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 500 }}
                        >
                          {option.name}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: colors.primary.main }}
                        >
                          ฿{option.price}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
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
      </Box>

      {/* Discount Code - Collapsible */}
      <Box
        sx={{
          backgroundColor: "white",
          mb: 1,
          borderBottom: "8px solid " + colors.background.default,
          overflow: "hidden",
        }}
      >
        {/* Header ที่คลิกได้ */}
        <Box
          onClick={() => setShowDiscountSection(!showDiscountSection)}
          sx={{
            px: 3,
            py: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.02)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LocalOffer sx={{ color: colors.primary.main }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
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
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          {showDiscountSection ? <ExpandLess /> : <ExpandMore />}
        </Box>

        {/* เนื้อหาที่พับได้ */}
        {showDiscountSection && (
          <Box sx={{ px: 3, pb: 3 }}>
            {appliedDiscount ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "#4caf5010",
                  border: "1px solid #4caf5030",
                }}
              >
                <CheckCircle sx={{ color: "#4caf50" }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {appliedDiscount.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appliedDiscount.description}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveDiscount();
                  }} 
                  size="small"
                  sx={{ color: "#f44336" }}
                >
                  <Close />
                </IconButton>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    placeholder="กรอกรหัสส่วนลด"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: colors.background.default,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleApplyDiscount}
                    disabled={!discountCode.trim()}
                    sx={{
                      borderRadius: 3,
                      px: 3,
                      backgroundColor: colors.primary.main,
                      "&:hover": { backgroundColor: colors.primary.dark },
                    }}
                  >
                    ใช้
                  </Button>
                </Box>
                {availableDiscountCodes.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      รหัสส่วนลดที่ใช้ได้:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {availableDiscountCodes.map((code) => (
                        <Chip
                          key={code.code}
                          label={code.code}
                          variant="outlined"
                          size="small"
                          onClick={() => setDiscountCode(code.code)}
                          sx={{
                            borderRadius: 2,
                            "&:hover": {
                              backgroundColor: `${colors.primary.main}08`,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Payment Methods */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 4,
          mb: 1,
          borderBottom: "8px solid " + colors.background.default,
        }}
      >
        <Box sx={{ px: 3, mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: colors.text.primary }}
          >
            วิธีชำระเงิน
          </Typography>
        </Box>
        {loadingData ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <RadioGroup
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            sx={{ gap: 1 }}
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
                    border:
                      selectedPayment === method.id
                        ? `2px solid ${colors.primary.main}`
                        : "2px solid transparent",
                    borderRadius: 3,
                    p: 2,
                    mx: 3,
                    backgroundColor:
                      selectedPayment === method.id
                        ? `${colors.primary.main}08`
                        : colors.background.default,
                    transition: "all 0.2s ease",
                  }}
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
                              color:
                                selectedPayment === method.id
                                  ? colors.primary.main
                                  : colors.text.secondary,
                            }}
                          >
                            {getPaymentIcon()}
                          </Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500, flex: 1 }}
                          >
                            {method.name}
                          </Typography>
                        </Box>
                        {method.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 5 }}
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
      </Box>

      {/* Customer Information */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 4,
          mb: 1,
          borderBottom: "8px solid " + colors.background.default,
        }}
      >
        <Box sx={{ px: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
            >
              ข้อมูลการจัดส่ง
            </Typography>
            {userProfileLoaded && (customerInfo.email || customerInfo.phone) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccountCircle sx={{ fontSize: 16, color: colors.primary.main }} />
                <Typography variant="caption" sx={{ color: colors.primary.main, fontWeight: 500 }}>
                  จากโปรไฟล์
                </Typography>
              </Box>
            )}
          </Box>
          {userProfileLoaded && (customerInfo.email || customerInfo.phone) && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
              ข้อมูลบางส่วนถูกเติมจากโปรไฟล์ของคุณ คุณสามารถแก้ไขได้
            </Typography>
          )}
        </Box>
        <Box sx={{ px: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
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
                borderRadius: 3,
                backgroundColor: colors.background.default,
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
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
                  borderRadius: 3,
                  backgroundColor: userProfileLoaded && customerInfo.email ? 
                    `${colors.primary.main}08` : colors.background.default,
                  borderColor: userProfileLoaded && customerInfo.email ? 
                    `${colors.primary.main}30` : undefined,
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
                  borderRadius: 3,
                  backgroundColor: userProfileLoaded && customerInfo.phone ? 
                    `${colors.primary.main}08` : colors.background.default,
                  borderColor: userProfileLoaded && customerInfo.phone ? 
                    `${colors.primary.main}30` : undefined,
                },
              }}
            />
          </Box>
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
                borderRadius: 3,
                backgroundColor: colors.background.default,
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="จังหวัด"
              value={customerInfo.city}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, city: e.target.value }))
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: colors.background.default,
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
                  borderRadius: 3,
                  backgroundColor: colors.background.default,
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Payment Summary */}
      {orderAnalysis && (
        <Box
          sx={{
            backgroundColor: "white",
            py: 4,
            mb: 1,
            borderBottom: "8px solid " + colors.background.default,
          }}
        >
          <Box sx={{ px: 3, mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
            >
              สรุปการชำระเงิน
            </Typography>
          </Box>
          
          <Box sx={{ px: 3 }}>
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
                  ฿{total.toLocaleString()}
                </Typography>
              </Box>
              
              {/* แสดงข้อมูลการชำระเงินแบบชัดเจน */}
              {orderAnalysis.requiresDeposit ? (
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
                      mb: 2,
                      textAlign: "center"
                    }}
                  >
                    💳 การชำระเงินแบบมัดจำ
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        ยอดมัดจำ (10%)
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: colors.primary.main,
                          fontSize: "1.25rem"
                        }}
                      >
                        ฿{calculatePaymentAmount(
                          orderAnalysis, 
                          selectedShippingOption?.price || 0, 
                          appliedDiscount?.code === "FREESHIP" ? selectedShippingOption?.price || 0 : 0
                        ).toLocaleString()}
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
                        💡 ยอดคงเหลือชำระเมื่อมารับสัตว์เลี้ยง
                      </Typography>
                    </Box>
                  </Box>
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
                    ✅ ชำระเต็มจำนวนเลย
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
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
              orderAnalysis.requiresDeposit 
                ? `ชำระมัดจำ (฿${calculatePaymentAmount(orderAnalysis, selectedShippingOption?.price || 0, appliedDiscount?.code === "FREESHIP" ? selectedShippingOption?.price || 0 : 0).toLocaleString()})`
                : `ชำระเงิน (฿${calculatePaymentAmount(orderAnalysis, selectedShippingOption?.price || 0, appliedDiscount?.code === "FREESHIP" ? selectedShippingOption?.price || 0 : 0).toLocaleString()})`
            ) : "ชำระเงิน"}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        key={snackbarKey}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={SlideUpTransition}
        sx={{ pointerEvents: "none" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="standard"
          icon={false}
          sx={{
            pointerEvents: "all",
            width: "auto",
            maxWidth: "min(480px, calc(100vw - 32px))",
            px: 2,
            py: 1.25,
            borderRadius: 3,
            boxShadow:
              snackbar.severity === "success"
                ? "0 20px 40px rgba(46,125,50,0.18)"
                : snackbar.severity === "warning"
                ? "0 20px 40px rgba(240,180,0,0.18)"
                : snackbar.severity === "error"
                ? "0 20px 40px rgba(211,47,47,0.18)"
                : "0 20px 40px rgba(25,118,210,0.18)",
            backdropFilter: "saturate(180%) blur(12px)",
            WebkitBackdropFilter: "saturate(180%) blur(12px)",
            backgroundColor:
              snackbar.severity === "success"
                ? "rgba(46, 125, 50, 0.12)"
                : snackbar.severity === "warning"
                ? "rgba(240, 180, 0, 0.12)"
                : snackbar.severity === "error"
                ? "rgba(211, 47, 47, 0.12)"
                : "rgba(25, 118, 210, 0.12)",
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
            backgroundBlendMode: "overlay",
            color:
              snackbar.severity === "success"
                ? "#1b5e20"
                : snackbar.severity === "warning"
                ? "#7a5c00"
                : snackbar.severity === "error"
                ? "#8e0000"
                : "#0d47a1",
            border:
              snackbar.severity === "success"
                ? "1px solid rgba(46, 125, 50, 0.28)"
                : snackbar.severity === "warning"
                ? "1px solid rgba(240, 180, 0, 0.28)"
                : snackbar.severity === "error"
                ? "1px solid rgba(211, 47, 47, 0.28)"
                : "1px solid rgba(25, 118, 210, 0.28)",
            borderLeft:
              snackbar.severity === "success"
                ? "4px solid rgba(46, 125, 50, 0.65)"
                : snackbar.severity === "warning"
                ? "4px solid rgba(240, 180, 0, 0.65)"
                : snackbar.severity === "error"
                ? "4px solid rgba(211, 47, 47, 0.65)"
                : "4px solid rgba(25, 118, 210, 0.65)",
            fontWeight: 600,
            letterSpacing: 0.2,
          }}
        >
          {snackbar.message}
          <Box
            sx={{
              mt: 0.75,
              height: 2,
              borderRadius: 2,
              backgroundColor:
                snackbar.severity === "success"
                  ? "rgba(46,125,50,0.2)"
                  : snackbar.severity === "warning"
                  ? "rgba(240,180,0,0.2)"
                  : snackbar.severity === "error"
                  ? "rgba(211,47,47,0.2)"
                  : "rgba(25,118,210,0.2)",
              overflow: "hidden",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "100%",
                backgroundColor:
                  snackbar.severity === "success"
                    ? "rgba(46,125,50,0.6)"
                    : snackbar.severity === "warning"
                    ? "rgba(240,180,0,0.6)"
                    : snackbar.severity === "error"
                    ? "rgba(211,47,47,0.6)"
                    : "rgba(25,118,210,0.6)",
                transformOrigin: "left",
                animation: `${snackGrowAnimation} 3s linear forwards`,
              },
            }}
          />
        </Alert>
      </Snackbar>

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
