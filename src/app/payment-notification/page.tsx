"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  TextField,
  Alert,
  Chip,
  Paper,
  IconButton,
} from "@mui/material";
import {
  CloudUpload,
  CheckCircle,
  Home,
  Receipt,
  AccountBalance,
  ContentCopy,
  ArrowBack,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

export default function PaymentNotificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState<Dayjs | null>(dayjs());
  const [transferTime, setTransferTime] = useState<Dayjs | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // ข้อมูลบัญชีธนาคาร (ตัวอย่าง)
  const bankAccounts = [
    {
      bank: "ธนาคารไทยพาณิชย์",
      accountNumber: "987-6-54321-0",
      accountName: "นายธัญญา รัตนาวงศ์ไชยา",
    },
  ];

  // ฟังก์ชันดึงข้อมูลคำสั่งซื้อ
  const fetchOrderData = async () => {
    if (!orderNumber) {
      setOrderError("ไม่พบหมายเลขคำสั่งซื้อ");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setOrderError(null);
      
      // ค้นหาคำสั่งซื้อจาก orderNumber
      const response = await fetch(`/api/orders?orderNumber=${orderNumber}`);
      const result = await response.json();

      console.log("API Response:", { 
        status: response.status, 
        ok: response.ok, 
        result 
      });

      if (response.ok && result.success && result.order) {
        setOrderData(result.order);
      } else {
        console.error("Order fetch failed:", result);
        const errorMessage = result.error || "ไม่พบข้อมูลคำสั่งซื้อ";
        
        // แสดงข้อมูล debug หากมี
        if (result.debug) {
          console.log("Debug info:", result.debug);
        }
        
        setOrderError(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
      setOrderError("เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ");
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลคำสั่งซื้อเมื่อโหลดหน้า
  useEffect(() => {
    fetchOrderData();
  }, [orderNumber]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: แสดง toast notification
  };

  const handleSubmit = async () => {
    if (!orderNumber) {
      alert("ไม่พบหมายเลขคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    if (!selectedFile || !transferAmount || !transferDate || !transferTime) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("orderNumber", orderNumber);
      formData.append("transferAmount", transferAmount);
      formData.append("transferDate", transferDate!.format("YYYY-MM-DD"));
      formData.append("transferTime", transferTime!.format("HH:mm"));
      formData.append("note", note);
      formData.append("paymentSlip", selectedFile);

      // Debug logging
      console.log("Submitting payment notification:", {
        orderNumber,
        transferAmount,
        transferDate: transferDate!.format("YYYY-MM-DD"),
        transferTime: transferTime!.format("HH:mm"),
        note,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });

      const response = await fetch("/api/payment-notifications", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(
          result.error || "Failed to submit payment notification"
        );
      }
    } catch (error) {
      console.error("Error submitting payment notification:", error);
      alert(
        `เกิดข้อผิดพลาด: ${
          error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
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
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: colors.success,
                  mb: 2,
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: colors.text.primary,
                  mb: 2,
                }}
              >
                แจ้งชำระเงินสำเร็จ!
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: colors.text.secondary,
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                เราได้รับการแจ้งชำระเงินของคุณแล้ว
                <br />
                ทีมงานจะตรวจสอบและยืนยันภายใน 1-2 ชั่วโมง
                <br />
                คุณจะได้รับการแจ้งเตือนผ่าน LINE เมื่อยืนยันแล้ว
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Home />}
                  onClick={() => handleLiffNavigation(router, "/")}
                  sx={{
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    backgroundColor: colors.primary.main,
                    "&:hover": {
                      backgroundColor: colors.primary.dark,
                    },
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: colors.background.default,
          width: "100%",
          maxWidth: "100vw",
          overflowX: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: 100,
            py: { xs: 2, sm: 3 },
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            width: "100%",
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
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
                sx={{ 
                  fontWeight: 600, 
                  color: colors.text.primary,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" }
                }}
              >
                แจ้งชำระเงิน
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
              {orderNumber && (
                <Chip
                  label={`#${orderNumber}`}
                  sx={{
                    backgroundColor: colors.primary.light,
                    color: "white",
                    fontWeight: "500",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    height: { xs: "24px", sm: "32px" },
                  }}
                />
              )}
              <IconButton
                onClick={() => handleLiffNavigation(router, "/")}
                sx={{
                  backgroundColor: "rgba(0,0,0,0.04)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  borderRadius: 2,
                }}
              >
                <Home />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 0, width: "100%" }}>
          {/* ข้อมูลคำสั่งซื้อและจำนวนเงิน */}
          {isLoading && (
            <Box
              sx={{
                backgroundColor: "white",
                mb: 1,
                borderBottom: "8px solid " + colors.background.default,
                borderRadius: { xs: 0, sm: 2 },
                overflow: "hidden",
                p: 4,
                textAlign: "center",
              }}
            >
              <Typography>กำลังโหลดข้อมูลคำสั่งซื้อ...</Typography>
            </Box>
          )}

          {orderError && (
            <Box
              sx={{
                backgroundColor: "white",
                mb: 1,
                borderBottom: "8px solid " + colors.background.default,
                borderRadius: { xs: 0, sm: 2 },
                overflow: "hidden",
                p: 4,
              }}
            >
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {orderError}
              </Alert>
              
              {/* แสดงข้อมูลการค้นหา */}
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  🔍 ข้อมูลการค้นหา:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  หมายเลขคำสั่งซื้อที่ค้นหา: <strong>{orderNumber}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  💡 กรุณาตรวจสอบหมายเลขคำสั่งซื้อให้ถูกต้อง หรือติดต่อเจ้าหน้าที่หากปัญหายังคงมีอยู่
                </Typography>
              </Alert>
            </Box>
          )}

          {orderData && !isLoading && !orderError && (
            <Box
              sx={{
                backgroundColor: "white",
                mb: 1,
                borderBottom: "8px solid " + colors.background.default,
                borderRadius: { xs: 0, sm: 2 },
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    mb: { xs: 2, sm: 2.5 },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                  }}
                >
                  <Receipt sx={{ color: colors.primary.main, fontSize: "1.2rem" }} />
                  ข้อมูลการชำระเงิน
                </Typography>

                <Paper
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: { xs: 2, sm: 3 },
                    backgroundColor: colors.background.paper,
                    border: "1px solid rgba(0,0,0,0.08)",
                    mb: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        หมายเลขคำสั่งซื้อ:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        #{orderData.orderNumber}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        ประเภทการชำระ:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        {orderData.paymentType === "FULL_PAYMENT" ? "ชำระเต็มจำนวน" : "ชำระมัดจำ"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        ยอดรวมคำสั่งซื้อ:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        ฿{Number(orderData.totalAmount).toLocaleString()}
                      </Typography>
                    </Box>

                    {orderData.paymentType === "DEPOSIT" && orderData.depositAmount && (
                      <>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            จำนวนเงินมัดจำ:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            ฿{Number(orderData.depositAmount).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            ยอดคงเหลือ:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            ฿{Number(orderData.remainingAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {orderData.shippingFee && Number(orderData.shippingFee) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                          ค่าจัดส่ง:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                          ฿{Number(orderData.shippingFee).toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    {orderData.discountAmount && Number(orderData.discountAmount) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                          ส่วนลด:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#d32f2f", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                          -฿{Number(orderData.discountAmount).toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    <Box 
                      sx={{ 
                        borderTop: "1px solid rgba(0,0,0,0.1)",
                        pt: 2,
                        mt: 1,
                      }}
                    >
                      {orderData.paymentType === "DEPOSIT" && orderData.depositAmount ? (
                        <>
                          {/* กรณีชำระมัดจำ */}
                          <Box 
                            sx={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700, 
                                color: colors.primary.main,
                                fontSize: { xs: "1.1rem", sm: "1.25rem" }
                              }}
                            >
                              💰 ต้องชำระมัดจำ:
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700, 
                                color: colors.primary.main,
                                fontSize: { xs: "1.3rem", sm: "1.5rem" }
                              }}
                            >
                              ฿{Number(orderData.depositAmount).toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                              backgroundColor: colors.background.default,
                              p: 2,
                              borderRadius: 2,
                            }}
                          >
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 600, 
                                color: colors.text.secondary,
                                fontSize: { xs: "0.9rem", sm: "1rem" }
                              }}
                            >
                              🚚 คงเหลือต้องชำระเมื่อมารับสินค้า:
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 600, 
                                color: colors.text.primary,
                                fontSize: { xs: "1rem", sm: "1.1rem" }
                              }}
                            >
                              ฿{Number(orderData.remainingAmount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          {/* กรณีชำระเต็มจำนวน */}
                          <Box 
                            sx={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                            }}
                          >
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700, 
                                color: colors.primary.main,
                                fontSize: { xs: "1.1rem", sm: "1.25rem" }
                              }}
                            >
                              💰 จ่ายมัดจำ:
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700, 
                                color: colors.primary.main,
                                fontSize: { xs: "1.3rem", sm: "1.5rem" }
                              }}
                            >
                              ฿{Number(orderData.depositAmount).toLocaleString()}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>

                <Alert
                  severity={orderData.paymentType === "DEPOSIT" ? "warning" : "info"}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: orderData.paymentType === "DEPOSIT" ? "#fff3e0" : "#e3f2fd",
                    border: orderData.paymentType === "DEPOSIT" ? "1px solid #ff9800" : "1px solid #2196f3",
                    "& .MuiAlert-icon": {
                      color: orderData.paymentType === "DEPOSIT" ? "#f57c00" : "#1976d2",
                    },
                  }}
                >
                  {orderData.paymentType === "DEPOSIT" ? (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        💡 กรุณาโอนเงินมัดจำตามจำนวนที่แสดงด้านบน
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, color: "#f57c00", mb: 1 }}>
                        📝 แจ้งชำระเงินมัดจำภายใน 24 ชั่วโมง
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "#f57c00" }}>
                        🚚 ยอดคงเหลือจะชำระเมื่อมารับสินค้า ณ หน้าร้าน
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        💡 กรุณาโอนเงินตามจำนวนที่แสดงด้านบน
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, color: "#1976d2" }}>
                        📝 แจ้งชำระเงินภายใน 24 ชั่วโมง
                      </Typography>
                    </>
                  )}
                </Alert>
              </Box>
            </Box>
          )}

          {/* ข้อมูลบัญชีธนาคาร */}
          <Box
            sx={{
              backgroundColor: "white",
              mb: 1,
              borderBottom: "8px solid " + colors.background.default,
              borderRadius: { xs: 0, sm: 2 },
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: colors.text.primary,
                  mb: { xs: 2, sm: 3 },
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                <AccountBalance sx={{ color: colors.primary.main }} />
                ข้อมูลบัญชีธนาคาร
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {bankAccounts.map((account, index) => (
                  <                  Paper
                    key={index}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: { xs: 2, sm: 3 },
                      backgroundColor: colors.background.paper,
                      border: "1px solid rgba(0,0,0,0.08)",
                      "&:hover": {
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      },
                      transition: "all 0.2s ease",
                      width: "100%",
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
                      {account.bank}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        backgroundColor: colors.background.default,
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                        gap: { xs: 1, sm: 0 },
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: colors.primary.main,
                        }}
                      >
                        {account.accountNumber}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ContentCopy />}
                        onClick={() => copyToClipboard(account.accountNumber)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: colors.primary.main,
                          color: "white",
                          "&:hover": {
                            backgroundColor: colors.primary.dark,
                          },
                          minWidth: { xs: "auto", sm: "initial" },
                          px: { xs: 1.5, sm: 2 },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        คัดลอก
                      </Button>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      {account.accountName}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              <Alert
                severity="warning"
                sx={{
                  mt: 3,
                  borderRadius: 3,
                  backgroundColor: "#fff3e0",
                  border: "1px solid #ff9800",
                  "& .MuiAlert-icon": {
                    color: "#f57c00",
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  📌 โอนเงินเข้าบัญชีข้างต้น แล้วแจ้งชำระเงินด้านล่าง
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 400, color: "#f57c00" }}>
                  📝 หมายเหตุ: หากแนบรูปหลักฐานผิด สามารถแจ้งชำระเงินใหม่ได้อีกครั้ง
                </Typography>
              </Alert>
            </Box>
          </Box>

          {/* ฟอร์มแจ้งชำระเงิน - แสดงเฉพาะเมื่อมีข้อมูลคำสั่งซื้อ */}
          {orderData && !isLoading && !orderError && (
            <Box
              sx={{
                backgroundColor: "white",
                mb: 1,
                borderRadius: { xs: 0, sm: 2 },
                overflow: "hidden",
              }}
            >
            <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: colors.text.primary,
                  mb: 3,
                }}
              >
                แจ้งการโอนเงิน
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, sm: 3 } }}>
                <TextField
                  label={
                    orderData?.paymentType === "DEPOSIT" 
                      ? "จำนวนเงินมัดจำที่โอน" 
                      : "จำนวนเงินที่โอน"
                  }
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  fullWidth
                  required
                  inputProps={{
                    min: 0,
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                          บาท
                        </Typography>
                      ),
                    },
                  }}
                  
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: { xs: 2, sm: 3 },
                      backgroundColor: colors.background.default,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      fontWeight: 500,
                      color: colors.primary.main,
                    },
                  }}
                />

                <Box sx={{ 
                  display: "flex", 
                  gap: { xs: 1.5, sm: 2 }, 
                  flexDirection: { xs: "column", sm: "row" },
                  width: "100%"
                }}>
                  <DatePicker
                    label="วันที่โอน"
                    value={transferDate}
                    onChange={(newValue) => setTransferDate(newValue)}
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    sx={{
                      flex: 1,
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: { xs: 2, sm: 3 },
                        backgroundColor: colors.background.default,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                    }}
                  />

                  <TimePicker
                    label="เวลาที่โอน"
                    value={transferTime}
                    onChange={(newValue) => setTransferTime(newValue)}
                    format="HH:mm"
                    sx={{
                      flex: 1,
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: { xs: 2, sm: 3 },
                        backgroundColor: colors.background.default,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="body1"
                    sx={{ mb: 2, fontWeight: 600, color: colors.text.primary }}
                  >
                    หลักฐานการโอนเงิน *
                  </Typography>

                  {/* Image Preview */}
                  {selectedFile && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: colors.background.paper,
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          color: colors.text.primary,
                        }}
                      >
                        ตัวอย่างรูปภาพ:
                      </Typography>
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: 300,
                          mx: "auto",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      >
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Payment slip preview"
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          textAlign: "center",
                          mt: 1,
                          color: colors.text.secondary,
                        }}
                      >
                        {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{
                      py: { xs: 2.5, sm: 3 },
                      borderRadius: { xs: 2, sm: 3 },
                      borderStyle: "dashed",
                      borderWidth: 2,
                      minHeight: { xs: "60px", sm: "auto" },
                    }}
                  >
                    {selectedFile ? (
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          ✅ เปลี่ยนรูปภาพ
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.text.secondary }}
                        >
                          คลิกเพื่อเลือกไฟล์ใหม่
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          เลือกไฟล์รูปภาพ
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.text.secondary }}
                        >
                          รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 5MB)
                        </Typography>
                      </Box>
                    )}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Box>

                <TextField
                  label="หมายเหตุ (ไม่บังคับ)"
                  multiline
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  fullWidth
                  placeholder="เช่น โอนจากบัญชี xxx-x-xxxxx-x"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: { xs: 2, sm: 3 },
                      backgroundColor: colors.background.default,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                  }}
                />
              </Box>
              </Box>

              {/* Submit Button */}
              <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !selectedFile ||
                    !transferAmount ||
                    !transferDate ||
                    !transferTime
                  }
                  sx={{
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    fontWeight: 600,
                    borderRadius: { xs: 2, sm: 3 },
                    backgroundColor: colors.primary.main,
                    boxShadow: `0 4px 20px ${colors.primary.main}40`,
                    minHeight: { xs: "48px", sm: "56px" },
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
                  {isSubmitting ? "กำลังส่ง..." : "แจ้งชำระเงิน"}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
