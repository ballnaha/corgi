"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import AdminLayout from "@/components/admin/AdminLayout";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

interface AdminClientLayoutProps {
  children: React.ReactNode;
}

export default function AdminClientLayout({
  children,
}: AdminClientLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      handleLiffNavigation(router, `/auth/signin?callbackUrl=${callbackUrl}`);
    }
  }, [mounted, status, router]);

  // Show loading while checking authentication
  if (!mounted || status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background.default,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress color="primary" size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: colors.text.secondary }}>
            กำลังตรวจสอบสิทธิ์...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show unauthorized if not admin
  if (status === "authenticated" && !session?.user?.isAdmin && !session?.user?.role?.includes("ADMIN")) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background.default,
          p: 3,
        }}
      >
        <Box sx={{ textAlign: "center", maxWidth: 400 }}>
          <Typography variant="h4" sx={{ mb: 2, color: colors.text.primary }}>
            ไม่มีสิทธิ์เข้าถึง
          </Typography>
          <Typography variant="body1" sx={{ color: colors.text.secondary, mb: 3 }}>
            คุณไม่มีสิทธิ์ในการเข้าถึงแผงควบคุมผู้ดูแลระบบ
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleLiffNavigation(router, "/")}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
            }}
          >
            กลับหน้าหลัก
          </Button>
        </Box>
      </Box>
    );
  }

  // Show admin layout for authorized users
  if (status === "authenticated" && (session?.user?.isAdmin || session?.user?.role?.includes("ADMIN"))) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return null;
}
