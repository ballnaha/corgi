"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLiff } from "@/hooks/useLiff";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { ErrorBoundary } from "./ErrorBoundary";
import LoadingScreen from "./LoadingScreen";
import NoSSR from "./NoSSR";

interface LineAuthProviderProps {
  children: ReactNode;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated" && pathname !== "/auth/signin" && pathname !== "/liff" && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/auth/signin");
    }
  }, [status, router, pathname, mounted, isRedirecting]);

  // Show loading until mounted and session is determined
  if (!mounted || status === "loading") {
    return <LoadingScreen message="กำลังตรวจสอบการเข้าสู่ระบบ..." />;
  }

  // Show redirecting state
  if (isRedirecting) {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." />;
  }

  // Allow signin page and liff page when unauthenticated
  if (status === "unauthenticated" && (pathname === "/auth/signin" || pathname === "/liff")) {
    return <>{children}</>;
  }

  // Show content when authenticated
  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Fallback loading state
  return <LoadingScreen message="กำลังตรวจสอบการเข้าสู่ระบบ..." fullScreen={false} />;
}

function LiffWrapper({ children }: { children: ReactNode }) {
  const { isReady, isInLiff, liffError, closeWindow, liff } = useLiff();
  const [showLiffLoading, setShowLiffLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only show LIFF loading if we're actually in LIFF environment
    if (!isInLiff) {
      setShowLiffLoading(false);
    } else if (isReady) {
      setShowLiffLoading(false);
    }
  }, [isInLiff, isReady]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <LoadingScreen message="กำลังโหลด..." fullScreen={false} />;
  }

  if (liffError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 2,
          p: 3,
        }}
      >
        <Typography color="error" variant="h6">
          เกิดข้อผิดพลาดในการเชื่อมต่อ LINE
        </Typography>
        <Typography color="error" variant="body2">
          {liffError}
        </Typography>

        {isInLiff && (
          <Button
            variant="contained"
            onClick={closeWindow}
            sx={{ mt: 2 }}
          >
            ปิดหน้าต่าง
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          sx={{ mt: 1 }}
        >
          รีโหลดหน้า
        </Button>
      </Box>
    );
  }

  // Only show LIFF loading if we're in LIFF environment and not ready
  if (isInLiff && showLiffLoading) {
    return <LoadingScreen message="กำลังเชื่อมต่อ LINE..." fullScreen={false} />;
  }

  return <>{children}</>;
}

export default function LineAuthProvider({ children }: LineAuthProviderProps) {
  return (
    <ErrorBoundary>
      <NoSSR fallback={<LoadingScreen message="กำลังโหลด..." />}>
        <SessionProvider>
          <AuthGuard>
            <LiffWrapper>{children}</LiffWrapper>
          </AuthGuard>
        </SessionProvider>
      </NoSSR>
    </ErrorBoundary>
  );
}