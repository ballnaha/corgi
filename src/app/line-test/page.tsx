"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { colors } from "@/theme/colors";

export default function LineTestPage() {
  const { data: session, status } = useSession();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestLineAPI = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/line/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      setTestResult({
        success: response.ok && result.success,
        status: response.status,
        data: result,
      });

    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        data: {
          error: "Network error",
          details: error instanceof Error ? error.message : "Unknown error"
        },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestReceiptAPI = async () => {
    setTesting(true);
    setTestResult(null);

    // สร้างข้อมูลทดสอบสำหรับใบเสร็จ
    const testReceiptData = {
      orderNumber: `TEST${Date.now()}`,
      customerName: session?.user?.name || "Test Customer",
      customerEmail: session?.user?.email || "test@example.com",
      customerPhone: "081-234-5678",
      items: [
        {
          productName: "ชิบะอินุ (ตัวผู้)",
          quantity: 1,
          price: 25000,
          total: 25000
        },
        {
          productName: "อาหารสุนัข Premium",
          quantity: 2,
          price: 500,
          total: 1000
        }
      ],
      subtotal: 26000,
      shippingFee: 200,
      discountAmount: 1000,
      total: 25200,
      paymentType: "DEPOSIT_PAYMENT" as const,
      depositAmount: 2520,
      remainingAmount: 22680,
      shippingMethod: "จัดส่งด่วน",
      shippingAddress: "123 ถนนทดสอบ เขตทดสอบ กรุงเทพฯ 10110"
    };

    try {
      const response = await fetch("/api/line/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testReceiptData),
      });

      const result = await response.json();
      setTestResult({
        success: response.ok && (result.success || result.skipLine),
        status: response.status,
        data: result,
      });

    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        data: {
          error: "Network error",
          details: error instanceof Error ? error.message : "Unknown error"
        },
      });
    } finally {
      setTesting(false);
    }
  };

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          กรุณาเข้าสู่ระบบก่อนทดสอบ LINE API
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        🧪 LINE API Test
      </Typography>

      {/* Session Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ข้อมูล Session
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>User ID:</strong> {session.user?.id || "N/A"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Name:</strong> {session.user?.name || "N/A"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {session.user?.email || "N/A"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>LINE User ID:</strong> {session.user?.lineUserId || "❌ ไม่มี"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Display Name:</strong> {session.user?.displayName || "N/A"}
          </Typography>
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={handleTestLineAPI}
          disabled={testing}
          sx={{ backgroundColor: colors.primary.main }}
        >
          {testing ? "กำลังทดสอบ..." : "ทดสอบ Simple Text Message"}
        </Button>

        <Button
          variant="contained"
          onClick={handleTestReceiptAPI}
          disabled={testing}
          sx={{ backgroundColor: "#ff9800" }}
        >
          {testing ? "กำลังทดสอบ..." : "ทดสอบ Receipt Flex Message"}
        </Button>
      </Box>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ผลการทดสอบ
            </Typography>

            <Alert 
              severity={testResult.success ? "success" : "error"}
              sx={{ mb: 2 }}
            >
              <strong>Status:</strong> {testResult.success ? "✅ สำเร็จ" : "❌ ไม่สำเร็จ"} 
              (HTTP {testResult.status})
            </Alert>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Raw Response:
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1,
                overflow: "auto",
                fontSize: "0.875rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(testResult.data, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>วิธีทดสอบ:</strong>
          <br />
          1. ตรวจสอบว่าคุณ login ด้วย LINE แล้ว (ต้องมี LINE User ID)
          <br />
          2. กดปุ่มทดสอบด้านบน
          <br />
          3. ตรวจสอบ LINE chat ของคุณเพื่อดูว่าได้รับข้อความหรือไม่
          <br />
          4. ถ้าไม่ได้รับ ตรวจสอบ console และ response ด้านล่าง
        </Typography>
      </Alert>
    </Box>
  );
}
