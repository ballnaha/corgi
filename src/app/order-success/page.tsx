"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  Alert,
  Chip,
} from "@mui/material";
import {
  CheckCircle,
  Home,
  Receipt,
  Payment,
  HourglassEmpty,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // รับข้อมูลจาก URL parameters
  const paymentMethod = searchParams.get("paymentMethod") || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const paymentType = searchParams.get("paymentType") || "";

  // ตรวจสอบว่าเป็นการชำระด้วย credit card หรือไม่
  const isCreditCardPayment =
    paymentMethod.toLowerCase().includes("credit") ||
    paymentMethod.toLowerCase().includes("card");

  // ตรวจสอบว่าเป็นการชำระมัดจำหรือไม่
  const isDepositPayment = paymentType === "DEPOSIT_PAYMENT";

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Card sx={{ width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            {/* Icon และสถานะ */}
            {isCreditCardPayment ? (
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: colors.success,
                  mb: 2,
                }}
              />
            ) : (
              <HourglassEmpty
                sx={{
                  fontSize: 80,
                  color: "#ff9800",
                  mb: 2,
                }}
              />
            )}

            {/* หัวข้อ */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: colors.text.primary,
                mb: 2,
              }}
            >
              {isCreditCardPayment ? "สั่งซื้อสำเร็จ!" : "รอการชำระเงิน"}
            </Typography>

            {/* แสดงเลขที่คำสั่งซื้อ */}
            {orderNumber && (
              <Chip
                label={`คำสั่งซื้อ #${orderNumber}`}
                sx={{
                  mb: 3,
                  backgroundColor: colors.primary.light,
                  color: "white",
                  fontWeight: "500",
                }}
              />
            )}

            {/* ข้อความตามสถานะการชำระเงิน */}
            {isCreditCardPayment ? (
              <Typography
                variant="body1"
                sx={{
                  color: colors.text.secondary,
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                ขอบคุณสำหรับการสั่งซื้อ
                เราจะดำเนินการจัดส่งสินค้าให้คุณโดยเร็วที่สุด
                <br />
                คุณจะได้รับอีเมลยืนยันการสั่งซื้อในอีกสักครู่
              </Typography>
            ) : (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    color: colors.text.secondary,
                    mb: 3,
                    lineHeight: 1.6,
                  }}
                >
                  คำสั่งซื้อของคุณได้รับการบันทึกเรียบร้อยแล้ว
                  <br />
                  กรุณาดำเนินการชำระเงินเพื่อยืนยันคำสั่งซื้อ
                </Typography>

                {/* Alert สำหรับการรอชำระเงิน */}
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    textAlign: "left",
                    "& .MuiAlert-message": {
                      width: "100%",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    📋 ขั้นตอนต่อไป:
                  </Typography>
                  <Typography variant="body2" component="div">
                    1. กดปุ่ม "แจ้งชำระเงิน" ด้านล่าง
                    <br />
                    2. อัปโหลดหลักฐานการโอนเงิน
                    <br />
                    3. รอการตรวจสอบจากทีมงาน (1-2 ชั่วโมง)
                    <br />
                    4. เราจะจัดส่งสินค้าหลังยืนยันการชำระเงิน
                  </Typography>
                </Alert>

                {/* ข้อมูลวิธีการชำระเงิน */}
                <Box
                  sx={{
                    backgroundColor: colors.background.paper,
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                    border: `1px solid rgba(0,0,0,0.12)`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    💳 วิธีการชำระเงิน: {paymentMethod}
                  </Typography>
                  {isDepositPayment && (
                    <Typography variant="body2" sx={{ color: "#ff9800" }}>
                      ⚠️ การชำระมัดจำ 10% - ส่วนที่เหลือชำระเมื่อรับสินค้า
                    </Typography>
                  )}
                </Box>
              </>
            )}

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 4,
              }}
            >
              {/* ปุ่มแจ้งชำระเงิน (แสดงเฉพาะเมื่อไม่ใช่ credit card) */}
              {!isCreditCardPayment && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Payment />}
                  onClick={() =>
                    handleLiffNavigation(router,
                      `/payment-notification?orderNumber=${orderNumber}`
                    )
                  }
                  sx={{
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    backgroundColor: "#ff9800",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#f57c00",
                    },
                  }}
                >
                  แจ้งชำระเงิน
                </Button>
              )}

              <Button
                variant={isCreditCardPayment ? "contained" : "outlined"}
                size="large"
                startIcon={<Home />}
                onClick={() => handleLiffNavigation(router, "/")}
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  ...(isCreditCardPayment && {
                    backgroundColor: colors.primary.main,
                    "&:hover": {
                      backgroundColor: colors.primary.dark,
                    },
                  }),
                }}
              >
                กลับสู่หน้าแรก
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<Receipt />}
                onClick={() => handleLiffNavigation(router, "/profile")}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                ดูประวัติการสั่งซื้อ
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
