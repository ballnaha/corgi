"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Box, Typography, Button, Card, CardContent, Alert } from "@mui/material";

export default function TestOrderPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLineAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/line/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult({
        status: response.status,
        success: response.ok,
        data
      });
    } catch (error) {
      setResult({
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  const testReceiptAPI = async () => {
    setLoading(true);
    setResult(null);

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
        }
      ],
      subtotal: 25000,
      shippingFee: 200,
      discountAmount: 0,
      total: 25200,
      paymentType: "FULL_PAYMENT" as const,
      depositAmount: 0,
      remainingAmount: 0,
      shippingMethod: "จัดส่งด่วน",
      shippingAddress: "123 ถนนทดสอบ เขตทดสอบ กรุงเทพฯ 10110"
    };

    try {
      console.log("🚀 [TEST] ส่งข้อมูลใบเสร็จทดสอบ...", testReceiptData);
      
      const response = await fetch("/api/line/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testReceiptData),
      });

      console.log("📡 [TEST] Response status:", response.status);
      
      const data = await response.json();
      console.log("📊 [TEST] Response data:", data);
      
      setResult({
        status: response.status,
        success: response.ok,
        data
      });
    } catch (error) {
      console.error("❌ [TEST] Error:", error);
      setResult({
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test LINE API
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Session Info:</Typography>
          <Typography>Name: {session?.user?.name || "Not logged in"}</Typography>
          <Typography>Email: {session?.user?.email || "No email"}</Typography>
          <Typography>LINE User ID: {session?.user?.lineUserId || "❌ Not found"}</Typography>
          <Typography>Provider: {session?.user?.lineUserId ? "line" : "Unknown"}</Typography>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2, gap: 2, display: 'flex' }}>
        <Button 
          variant="contained" 
          onClick={testLineAPI}
          disabled={loading}
        >
          🧪 Test LINE API
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={testReceiptAPI}
          disabled={loading}
        >
          📋 Test Receipt API
        </Button>
      </Box>

      {loading && (
        <Alert severity="info">กำลังทดสอบ...</Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6">
              ผลลัพธ์: {result.success ? "✅ สำเร็จ" : "❌ ล้มเหลว"}
            </Typography>
            <Typography>Status: {result.status}</Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '10px' }}>
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
