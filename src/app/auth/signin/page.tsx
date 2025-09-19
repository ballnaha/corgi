"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography, CircularProgress, Alert, Card, CardContent, Divider } from "@mui/material";
import Image from "next/image";
import { useLiff } from "@/hooks/useLiff";
import LoadingScreen from "@/components/LoadingScreen";

export default function SignIn() {
  const { data: session, status } = useSession();
  const { isInLiff, isReady, liffError } = useLiff();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const error = searchParams?.get("error");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "authenticated") {
      // Wait a bit to ensure everything is ready before redirecting
      setTimeout(() => {
        router.push("/shop");
      }, 500);
    }
  }, [status, router, mounted]);

  const handleSignIn = () => {
    setLoading(true);
    signIn("line", { callbackUrl: "/shop" });
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const response = await fetch("/api/auth/clear-line-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Optionally show success message or refresh the page
        window.location.reload();
      } else {
        console.error("Failed to clear cache");
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
    } finally {
      setClearingCache(false);
    }
  };

  if (!mounted || status === "loading") {
    return <LoadingScreen message="กำลังตรวจสอบการเข้าสู่ระบบ..." fullScreen={false} />;
  }

  if (status === "authenticated") {
    return <LoadingScreen message="เข้าสู่ระบบสำเร็จ กำลังเปลี่ยนหน้า..." fullScreen={false} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 3,
        p: 3,
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 2 }}>
        <Image
          src="/images/natpi_logo.png"
          alt="NATPI & Corgi Farm and Pet Shop"
          width={250}
          height={150}
          style={{
            objectFit: "contain",
            maxWidth: "100%",
            height: "auto"
          }}
          priority
        />
      </Box>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        แนะนำให้ใช้งานด้วย line application เพื่อประสบการณ์ที่ดีที่สุด
      </Typography>

      {(isInLiff || error) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error
            ? `เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ: ${error}`
            : "คุณกำลังใช้งานผ่าน LINE Application"}
        </Alert>
      )}

      {liffError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          LIFF Error: {liffError}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={handleSignIn}
        disabled={loading}
        sx={{
          backgroundColor: "#00B900",
          "&:hover": {
            backgroundColor: "#009900",
          },
          minWidth: 200,
        }}
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย LINE"}
      </Button>

      <Button
        variant="outlined"
        size="medium"
        onClick={handleClearCache}
        disabled={clearingCache}
        sx={{
          borderColor: "#00B900",
          color: "#00B900",
          "&:hover": {
            borderColor: "#009900",
            backgroundColor: "rgba(0, 185, 0, 0.04)",
          },
          minWidth: 200,
        }}
      >
        {clearingCache ? "กำลังล้าง Cache..." : "ล้าง Cache แล้วลองใหม่"}
      </Button>

      {/* LINE Official Account Section */}
      <Card sx={{ maxWidth: 400, width: "100%", mt: 3 }}>
        <CardContent sx={{ textAlign: "center", p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            หรือเพิ่มเราเป็นเพื่อนใน LINE Official Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            สแกน QR Code เพื่อเพิ่มเพื่อนและรับข้อมูลข่าวสารล่าสุด
          </Typography>

          {/* QR Code */}
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            mb: 2,
            p: 2,
            backgroundColor: "#fff",
            borderRadius: 2,
            border: "1px solid #e0e0e0"
          }}>
            <Image
              src="/images/qr_line.png"
              alt="LINE Official Account QR Code"
              width={180}
              height={180}
              style={{
                objectFit: "contain"
              }}
            />
          </Box>

          {/* LINE ID */}
          <Typography variant="body2" sx={{ mb: 2, fontWeight: "bold" }}>
            LINE ID: @658jluqf
          </Typography>

          {/* Add Friend Button */}
          <Button
            variant="outlined"
            sx={{
              borderColor: "#00B900",
              color: "#00B900",
              "&:hover": {
                borderColor: "#009900",
                backgroundColor: "rgba(0, 185, 0, 0.04)",
              },
              mb: 2
            }}
            onClick={() => window.open("https://line.me/R/ti/p/@658jluqf", "_blank")}
          >
            เพิ่มเพื่อน LINE
          </Button>

          <Typography variant="caption" color="text.secondary" display="block">
            เพิ่มเพื่อนเพื่อรับข้อมูลสินค้าใหม่และโปรโมชั่นพิเศษ
          </Typography>
        </CardContent>
      </Card>

      {isInLiff && (
        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          หากมีปัญหาในการเข้าสู่ระบบ กรุณาลองเปิดใน browser ภายนอก
        </Typography>
      )}
    </Box>
  );
}