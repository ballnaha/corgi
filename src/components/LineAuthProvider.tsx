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
  
  // Minimal LIFF environment detection to avoid redirect loop
  const isLikelyInLiffEnvironment = typeof window !== "undefined" && (() => {
    const userAgent = window.navigator.userAgent;
    const isLineApp = userAgent.includes("Line/") && (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone"));
    const url = window.location.href;
    const isLiffUrl = url.includes("liff.line.me") || url.includes("liff-web.line.me");
    return isLineApp || isLiffUrl;
  })();

  // Public routes that don't require authentication
  const publicRoutes = ['/home', '/', '/unauthorized', '/auth/signin', '/liff'];
  // Protected routes that require authentication for LIFF users but redirect non-LIFF to home
  const protectedRoutes = ['/checkout', '/profile', '/favorites', '/order-success', '/shop', '/product'];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isRedirecting) return;
    
    // For public routes, allow access without authentication
    if (isPublicRoute) return;
    
    // Handle protected routes and other non-public routes
    if (status === "unauthenticated") {
      // Set redirecting state immediately to prevent content flash
      setIsRedirecting(true);
      
      if (isProtectedRoute) {
        if (!isLikelyInLiffEnvironment) {
          // For non-LIFF users accessing protected routes, redirect to home
          router.replace("/home");
          return;
        } else {
          // For LIFF users, redirect to signin for protected routes
          router.replace("/auth/signin");
          return;
        }
      }
      
      // For other routes (like admin), redirect based on environment
      if (!isLikelyInLiffEnvironment) {
        router.replace("/home");
        return;
      }
      
      // For LIFF users on other protected routes
      if (pathname !== "/auth/signin" && pathname !== "/liff") {
        router.replace("/auth/signin");
      }
    }
  }, [status, router, pathname, mounted, isRedirecting, isLikelyInLiffEnvironment, isPublicRoute, isProtectedRoute]);

  // Show loading until mounted and session is determined
  if (!mounted || status === "loading") {
    return <LoadingScreen message="กำลังตรวจสอบการเข้าสู่ระบบ..." fullScreen={true} />;
  }

  // Show redirecting state - prevent any content from showing during redirect
  if (isRedirecting) {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." fullScreen={true} />;
  }

  // Handle protected routes for non-LIFF users - prevent content flash
  if (!isLikelyInLiffEnvironment && (isProtectedRoute || !isPublicRoute) && status === "unauthenticated") {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." fullScreen={true} />;
  }

  // Allow public routes without authentication
  if (isPublicRoute) {
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
  const { isReady, isInLiff, liffError, closeWindow, liff, isLoggedIn } = useLiff();
  const [showLiffLoading, setShowLiffLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only show LIFF loading if we're actually in LIFF environment
    if (!isInLiff) {
      setShowLiffLoading(false);
    } else if (isReady) {
      // For LIFF environment, wait for both LIFF ready and session authenticated
      if (isLoggedIn && status === "authenticated") {
        setShowLiffLoading(false);
      } else if (!isLoggedIn) {
        setShowLiffLoading(false);
      }
    }
  }, [isInLiff, isReady, isLoggedIn, status]);

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

  // Show different loading messages based on LIFF state
  if (isInLiff && showLiffLoading) {
    if (isLoggedIn && status === "loading") {
      return <LoadingScreen message="กำลังเข้าสู่ระบบ..." fullScreen={false} />;
    }
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