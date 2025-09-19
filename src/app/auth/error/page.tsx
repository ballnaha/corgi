"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography, Alert, Stack } from "@mui/material";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

function getFriendlyMessage(error: string | null) {
  switch (error) {
    case "TokenExchange":
      return "ไม่สามารถแลกเปลี่ยนโทเค็นกับ LINE ได้ กรุณาลองใหม่อีกครั้ง";
    case "NoCode":
      return "ไม่ได้รับโค้ดจาก LINE กรุณาลองเข้าสู่ระบบใหม่";
    case "OAuthAccountNotLinked":
      return "บัญชีนี้เชื่อมกับผู้ใช้อื่นอยู่ กรุณาใช้ LINE เดิมที่เคยเข้าสู่ระบบ";
    case "AccessDenied":
      return "การอนุญาตถูกปฏิเสธ กรุณาลองใหม่หรือยืนยันสิทธิ์ใน LINE";
    case "Configuration":
      return "การตั้งค่าการเข้าสู่ระบบไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ";
    case "Callback":
    case "StateError":
    case "SessionRequired":
      return "เซสชันหมดอายุหรือข้อมูลไม่ครบถ้วน กรุณาล้างคุกกี้แล้วเข้าสู่ระบบใหม่";
    default:
      return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
  }
}

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clearing, setClearing] = useState(false);
  const error = searchParams.get("error");
  const message = getFriendlyMessage(error);

  useEffect(() => {
    // ป้องกัน PWA/Cache เก่า
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("liff_auto_login_done");
    }
  }, []);

  const clearAndRetry = async () => {
    setClearing(true);
    try {
      await fetch("/api/auth/clear-line-cache", { method: "POST" });
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((n) => caches.delete(n)));
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    setClearing(false);
    // เริ่ม Login ใหม่
    signIn("line", { callbackUrl: "/shop" });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 520, width: "100%" }}>
        <Typography variant="h5" fontWeight={700} textAlign="center">
          เข้าสู่ระบบไม่สำเร็จ
        </Typography>
        <Alert severity="warning">{message}</Alert>
        {error && (
          <Typography variant="caption" color="text.secondary">
            รายละเอียด: {error}
          </Typography>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            fullWidth
            variant="contained"
            onClick={clearAndRetry}
            disabled={clearing}
            sx={{
              backgroundColor: "#00B900",
              "&:hover": { backgroundColor: "#009900" },
            }}
          >
            {clearing ? "กำลังเคลียร์และลองใหม่..." : "ล้างและลองเข้าสู่ระบบใหม่"}
          </Button>
          <Button fullWidth variant="outlined" onClick={() => router.push("/auth/signin")}>ไปหน้าล็อกอิน</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, Button, Alert } from "@mui/material";
import { useEffect, useState } from "react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    setError(errorParam);
  }, [searchParams]);

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthCallback":
        return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE อาจเป็นเพราะ state cookie หายไป กรุณาล้างแคชและลองใหม่";
      case "OAuthCallbackError":
        return "เกิดข้อผิดพลาดในการ callback จาก LINE (state cookie missing) กรุณาล้างแคชเบราว์เซอร์และลองใหม่";
      case "OAuthAccountNotLinked":
        return "บัญชีนี้ไม่ได้เชื่อมโยงกับ LINE";
      case "EmailCreateAccount":
        return "ไม่สามารถสร้างบัญชีด้วยอีเมลนี้ได้";
      case "Callback":
        return "เกิดข้อผิดพลาดในการ callback อาจเป็นเพราะ cookies ถูกบล็อก";
      case "OAuthCreateAccount":
        return "ไม่สามารถสร้างบัญชีได้";
      case "EmailSignin":
        return "ไม่สามารถส่งอีเมลเข้าสู่ระบบได้";
      case "CredentialsSignin":
        return "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง";
      case "SessionRequired":
        return "จำเป็นต้องเข้าสู่ระบบ";
      default:
        return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
    }
  };

  const handleClearCacheAndRetry = async () => {
    try {
      // ล้าง NextAuth cookies
      const response = await fetch("/api/auth/clear-line-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // รีเฟรชหน้าเพื่อล้างแคช
        window.location.href = "/auth/signin";
      } else {
        handleRetry();
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      handleRetry();
    }
  };

  const handleRetry = () => {
    router.push("/auth/signin");
  };

  const handleGoHome = () => {
    router.push("/");
  };

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
        maxWidth: 400,
        mx: "auto",
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom color="error">
        เกิดข้อผิดพลาด
      </Typography>

      <Alert severity="error" sx={{ width: "100%" }}>
        {getErrorMessage(error)}
      </Alert>

      {error && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          รหัสข้อผิดพลาด: {error}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 2, flexDirection: "column", width: "100%" }}>
        {(error === "OAuthCallback" || error === "OAuthCallbackError" || error === "Callback") ? (
          <>
            <Button
              variant="contained"
              size="large"
              onClick={handleClearCacheAndRetry}
              sx={{
                backgroundColor: "#ff9800",
                "&:hover": {
                  backgroundColor: "#f57c00",
                },
              }}
            >
              🧹 ล้างแคชและลองใหม่
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={handleRetry}
              sx={{
                borderColor: "#00B900",
                color: "#00B900",
                "&:hover": {
                  backgroundColor: "#00B90020",
                  borderColor: "#009900",
                },
              }}
            >
              ลองเข้าสู่ระบบอีกครั้ง
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={handleRetry}
            sx={{
              backgroundColor: "#00B900",
              "&:hover": {
                backgroundColor: "#009900",
              },
            }}
          >
            ลองเข้าสู่ระบบอีกครั้ง
          </Button>
        )}
        
        <Button
          variant="outlined"
          size="large"
          onClick={handleGoHome}
        >
          กลับหน้าแรก
        </Button>
      </Box>
    </Box>
  );
}