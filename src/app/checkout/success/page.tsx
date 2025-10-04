"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, CircularProgress, Alert, Button } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { colors } from "@/theme/colors";
import Link from "next/link";
import { clearCartStorage } from "@/lib/cart";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderNumber = searchParams.get("order_number");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [hasVerified, setHasVerified] = useState(false);


  useEffect(() => {
    if (!sessionId || !orderNumber) {
      setError("ข้อมูลการชำระเงินไม่ครบถ้วน");
      setLoading(false);
      return;
    }

    // ตรวจสอบ localStorage cache ก่อน
    const cacheKey = `payment_verified_${sessionId}_${orderNumber}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData && !hasVerified) {
      try {
        const parsedData = JSON.parse(cachedData);
        console.log("🔄 Using cached payment verification data");
        setOrderData(parsedData);
        setHasVerified(true);
        setLoading(false);
        
        // ล้างตะกร้าสินค้า (ถ้ายังไม่ได้ล้าง)
        clearCartStorage();
        return;
      } catch (error) {
        console.warn("Failed to parse cached data, will verify again:", error);
        localStorage.removeItem(cacheKey);
      }
    }

    // ถ้าเคยตรวจสอบแล้วไม่ต้องเรียก API อีก
    if (hasVerified) {
      setLoading(false);
      return;
    }

    // ตรวจสอบสถานะการชำระเงินจาก Stripe
    const verifyPayment = async () => {
      try {
        console.log("🔍 Verifying payment with Stripe API...");
        const response = await fetch("/api/stripe/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            orderNumber,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setOrderData(data.order);
          setHasVerified(true);
          
          // เก็บข้อมูลใน localStorage เพื่อป้องกันการเรียก API ซ้ำ
          localStorage.setItem(cacheKey, JSON.stringify(data.order));
          console.log("💾 Payment verification data cached");
          
          // ล้างตะกร้าสินค้าเมื่อชำระเงินสำเร็จ
          clearCartStorage();
          console.log("🛒 Cart cleared after successful payment");
        } else {
          setError(data.error || "เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setError("เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, orderNumber, hasVerified]);

  // Cleanup effect - ลบ cache เมื่อออกจากหน้า (optional)
  useEffect(() => {
    return () => {
      // สามารถเลือกลบ cache หรือเก็บไว้ก็ได้
      // const cacheKey = `payment_verified_${sessionId}_${orderNumber}`;
      // localStorage.removeItem(cacheKey);
    };
  }, [sessionId, orderNumber]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.primary.light}20 0%, ${colors.background.default} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} sx={{ color: colors.primary.main, mb: 3 }} />
          <Typography variant="h6" sx={{ color: colors.text.secondary }}>
            กำลังตรวจสอบการชำระเงิน...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.primary.light}20 0%, ${colors.background.default} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ maxWidth: 500, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
          <Button
            component={Link}
            href="/checkout"
            variant="contained"
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
              borderRadius: 3,
              px: 4,
              py: 1.5,
            }}
          >
            กลับไปหน้าสั่งซื้อ
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          width: "100%",
          backgroundColor: "white",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e5e5",
        }}
      >
        {/* Success Icon */}
        <Box sx={{ mb: 3 }}>
          <CheckCircle 
            sx={{ 
              fontSize: 48,
              color: colors.success,
            }} 
          />
        </Box>

        {/* Success Message */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: colors.text.primary,
            mb: 2,
          }}
        >
          ชำระเงินสำเร็จ
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: colors.text.secondary,
            mb: 4,
            lineHeight: 1.5,
          }}
        >
          ขอบคุณสำหรับการสั่งซื้อ การชำระเงินของคุณสำเร็จเรียบร้อยแล้ว
          <br />
          ใบเสร็จจะถูกส่งไปยัง LINE ในไม่ช้า
        </Typography>

        {/* Order Details */}
        {orderData && (
          <Box
            sx={{
              backgroundColor: "#f8f9fa",
              borderRadius: 1,
              p: 3,
              mb: 4,
              textAlign: "left",
              border: "1px solid #e9ecef",
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                mb: 2,
                color: colors.text.primary,
              }}
            >
              รายละเอียดคำสั่งซื้อ
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  หมายเลขคำสั่งซื้อ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "monospace" }}>
                  {orderNumber}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  จำนวนเงิน
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary.main }}>
                  ฿{orderData.totalAmount?.toLocaleString()}
                </Typography>
              </Box>

              {/* แสดงส่วนลดและค่าจัดส่งถ้ามี */}
              {typeof orderData?.shippingFee === "number" && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    ค่าจัดส่ง
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {orderData.shippingFee > 0 ? `฿${orderData.shippingFee.toLocaleString()}` : "ฟรี"}
                  </Typography>
                </Box>
              )}

              {typeof orderData?.discountAmount === "number" && orderData.discountAmount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    ส่วนลด{orderData.discountCode ? ` (${orderData.discountCode})` : ""}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#4caf50" }}>
                    -฿{orderData.discountAmount.toLocaleString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  วิธีการชำระเงิน
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  บัตรเครดิต (Stripe)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  สถานะ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: colors.success }}>
                  ชำระเงินแล้ว
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        <Box 
          sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            gap: 2, 
            justifyContent: "center",
          }}
        >
          <Button
            component={Link}
            href="/profile"
            variant="contained"
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { 
                backgroundColor: colors.primary.dark,
              },
              borderRadius: 1,
              px: 3,
              py: 1.5,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            ดูคำสั่งซื้อของฉัน
          </Button>

          <Button
            component={Link}
            href="/shop"
            variant="outlined"
            sx={{
              borderColor: colors.primary.main,
              color: colors.primary.main,
              "&:hover": {
                borderColor: colors.primary.dark,
                backgroundColor: `${colors.primary.main}08`,
              },
              borderRadius: 1,
              px: 3,
              py: 1.5,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            ช้อปต่อ
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
