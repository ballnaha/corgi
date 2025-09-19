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

  const sendReport = async () => {
    const rid = Math.random().toString(36).slice(2);
    try {
      await fetch("/api/logs/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-rid": rid },
        body: JSON.stringify({
          rid,
          error,
          location: typeof window !== 'undefined' ? window.location.href : '',
          search: typeof window !== 'undefined' ? window.location.search : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });
      alert(`ส่งรายงานสำเร็จ (รหัส: ${rid})`);
    } catch {}
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
          <Button fullWidth variant="outlined" onClick={sendReport}>ส่งรายงานปัญหา</Button>
          <Button fullWidth variant="outlined" onClick={() => router.push("/auth/signin")}>ไปหน้าล็อกอิน</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

 