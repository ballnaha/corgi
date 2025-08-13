"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography, CircularProgress, Alert } from "@mui/material";
import { useLiff } from "@/hooks/useLiff";
import LoadingScreen from "@/components/LoadingScreen";

export default function SignIn() {
  const { data: session, status } = useSession();
  const { isInLiff, isReady, liffError } = useLiff();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "authenticated") {
      // Wait a bit to ensure everything is ready before redirecting
      setTimeout(() => {
        router.push("/");
      }, 500);
    }
  }, [status, router, mounted]);

  const handleSignIn = () => {
    setLoading(true);
    signIn("line", { callbackUrl: "/" });
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
      <Typography variant="h4" component="h1" gutterBottom>
        CorgiShop
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        เข้าสู่ระบบเพื่อใช้งานร้านขายสัตว์เลี้ยง
      </Typography>

      {isInLiff && (
        <Alert severity="info" sx={{ mb: 2 }}>
          คุณกำลังใช้งานผ่าน LINE Application
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

      {isInLiff && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          หากมีปัญหาในการเข้าสู่ระบบ กรุณาลองเปิดใน browser ภายนอก
        </Typography>
      )}
    </Box>
  );
}