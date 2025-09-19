"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

// LIFF SDK type definitions
interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffObject {
  init: (config: { liffId: string; withLoginOnExternalBrowser?: boolean }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: () => void;
  logout: () => void;
  getProfile: () => Promise<LiffProfile>;
  getIDToken: () => string | null;
  getAccessToken: () => string | null;
  closeWindow: () => void;
  isInClient: () => boolean;
}

declare global {
  interface Window {
    liff: LiffObject;
  }
}

export const useLiff = () => {
  const [liffObject, setLiffObject] = useState<LiffObject | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInLiff, setIsInLiff] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const { data: session, status } = useSession();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isOnSigninPage = pathname === "/auth/signin";

  // Handle auto login to NextAuth using LIFF
  const handleAutoLogin = async (liff: LiffObject) => {
    try {
      console.log("🔄 Starting LIFF auto login process...");
      
      // If user is already logged in to NextAuth, no need to auto login
      if (status === "authenticated") {
        console.log("✅ User already authenticated via NextAuth");
        return;
      }

      // Avoid auto login loop on signin page
      if (isOnSigninPage) {
        console.log("⏭️ Skip auto login on /auth/signin to avoid loop");
        return;
      }

      // Wait a bit to ensure LIFF is fully initialized
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("🔗 Triggering NextAuth LINE login for LIFF user...");
      
      // Trigger NextAuth LINE login
      await signIn('line', {
        callbackUrl: '/',
        redirect: true, // Redirect to homepage to avoid loops
      });

    } catch (error) {
      console.error("❌ Error during LIFF auto login:", error);
    }
  };

  // Check if running in LIFF environment
  const checkLiffEnvironment = () => {
    if (typeof window === "undefined") return false;

    // Check if LIFF ID is configured
    const hasLiffId = !!process.env.NEXT_PUBLIC_LIFF_ID;
    if (!hasLiffId) return false;

    // Check if in LINE app (more specific detection)
    const userAgent = window.navigator.userAgent;
    const isLineApp = userAgent.includes("Line/") && 
                     (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone"));

    // Check if URL is specifically from LIFF domain (not just contains liff)
    const url = window.location.href;
    const isLiffUrl = url.includes("liff.line.me") || url.includes("liff-web.line.me");

    // Only consider it LIFF if it's actually from LINE app or LIFF domain
    const isRealLiff = isLineApp || isLiffUrl;

    return hasLiffId && isRealLiff;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prevent running on server side or before mounted
    if (typeof window === "undefined" || !mounted) return;

    const initializeLiff = async () => {
      const inLiff = checkLiffEnvironment();
      setIsInLiff(inLiff);

      // If not in LIFF environment, set ready immediately
      if (!inLiff) {
        setIsReady(true);
        return;
      }

      // Only initialize LIFF if we're in LIFF environment and LIFF_ID is configured
      if (!process.env.NEXT_PUBLIC_LIFF_ID) {
        setLiffError("LIFF ID not configured");
        setIsReady(true);
        return;
      }

      try {
        // Load LIFF SDK
        const liff = (await import("@line/liff")).default;
        
        await liff.init({ 
          liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
          // หลีกเลี่ยงการเปิดในเบราว์เซอร์ภายนอกเพราะฟีเจอร์ LIFF จะจำกัดและขึ้นแจ้งเตือน
          withLoginOnExternalBrowser: false
        });

        // Enable LIFF client features for better navigation
        if (liff.isInClient && liff.isInClient()) {
          console.log("Running in LIFF client mode");
        }

        setLiffObject(liff);
        const liffLoggedIn = liff.isLoggedIn();
        setIsLoggedIn(liffLoggedIn);
        setIsReady(true);

        // Auto login to NextAuth if LIFF is logged in but NextAuth session doesn't exist
        if (liffLoggedIn && !autoLoginAttempted && !isOnSigninPage) {
          // Prevent repeated auto login attempts within this session/tab
          const hasAutoLoginFlag = typeof window !== "undefined" && sessionStorage.getItem("liff_auto_login_done") === "1";
          if (!hasAutoLoginFlag) {
            sessionStorage.setItem("liff_auto_login_done", "1");
            setAutoLoginAttempted(true);
            await handleAutoLogin(liff);
          } else {
            console.log("⏭️ Skip auto login (already attempted in this session)");
          }
        } else if (!liffLoggedIn) {
          // เรียก LIFF login เฉพาะเมื่ออยู่ใน LIFF client เท่านั้น
          if (!isOnSigninPage && liff.isInClient && liff.isInClient()) {
            liff.login();
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "LIFF initialization failed";
        setLiffError(errorMessage);
        setIsReady(true);
      }
    };

    // Initialize with small delay to ensure DOM is ready
    const timer = setTimeout(initializeLiff, 100);
    return () => clearTimeout(timer);
  }, [mounted]);

  const logout = () => {
    if (liffObject) {
      liffObject.logout();
      setIsLoggedIn(false);
    }
  };

  const getProfile = async (): Promise<LiffProfile | null> => {
    if (liffObject && isLoggedIn) {
      return await liffObject.getProfile();
    }
    return null;
  };

  const closeWindow = () => {
    if (liffObject) {
      liffObject.closeWindow();
    }
  };

  return {
    liff: liffObject,
    isLoggedIn,
    isReady,
    isInLiff,
    liffError,
    logout,
    getProfile,
    closeWindow,
  };
};