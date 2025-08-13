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
        return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE กรุณาลองใหม่อีกครั้ง";
      case "OAuthAccountNotLinked":
        return "บัญชีนี้ไม่ได้เชื่อมโยงกับ LINE";
      case "EmailCreateAccount":
        return "ไม่สามารถสร้างบัญชีด้วยอีเมลนี้ได้";
      case "Callback":
        return "เกิดข้อผิดพลาดในการ callback";
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