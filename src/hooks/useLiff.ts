"use client";

import React, { useEffect, useState } from "react";
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
  login: (params?: { redirectUri?: string }) => void;
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
  const autoLoginTriggeredThisMountRef = React.useRef(false);
  const { data: session, status } = useSession();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isOnSigninPage = pathname === "/auth/signin";

  // Use stable redirect uri to avoid random query/hash differences
  const getStableRedirectUri = () => {
    if (typeof window === "undefined") return "/liff";
    return `${window.location.origin}/liff`;
  };

  // ปิดการ logout อัตโนมัติเมื่อปิดหน้า LIFF ชั่วคราวเพื่อกันชน OAuth (ลด 400)
  // (ถ้าต้องการกลับมาใช้ ให้เพิ่ม flag และ guard ให้แน่นหนากว่านี้)

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
      // Clear old auth cookies/state before starting OAuth to avoid 400/state mismatch
      try {
        // Skip auto login if a recent logout set a skip flag
        const skip = typeof window !== 'undefined' && sessionStorage.getItem('skip_liff_auto_login') === '1';
        if (skip) {
          sessionStorage.removeItem('skip_liff_auto_login');
          console.log('⏭️ Skip LIFF auto login due to recent logout');
          return;
        }
        // Always clear cookies before OAuth to prevent state mismatch
        await fetch('/api/auth/clear-line-cache', { method: 'POST' });
      } catch {}
      // Longer delay to ensure Set-Cookie deletions are fully applied
      await new Promise(resolve => setTimeout(resolve, 500));
      const rid = Math.random().toString(36).slice(2);
      try { sessionStorage.setItem('line_oauth_in_progress', '1'); } catch {}
      await signIn('line', {
        callbackUrl: `/shop?rid=${rid}`,
        redirect: true,
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

      // ปิดการล้าง OAuth cookies ตอน init เพื่อลด state mismatch

      // Only initialize LIFF if we're in LIFF environment and LIFF_ID is configured
      if (!process.env.NEXT_PUBLIC_LIFF_ID) {
        setLiffError("LIFF ID not configured");
        setIsReady(true);
        return;
      }

      try {
        // ปิดการล้าง boot cookies เพื่อลด state mismatch

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

        // In LIFF: ensure LIFF login first, then ensure NextAuth session
        if (!isOnSigninPage && isInLiff) {
          const urlNow = new URL(window.location.href);
          const hasOAuthParams = urlNow.searchParams.has('code') || urlNow.searchParams.has('state') ||
                                 urlNow.searchParams.has('liff.state') || urlNow.searchParams.has('liffRedirectUri');

          if (!liffLoggedIn) {
            const skip = sessionStorage.getItem('skip_liff_auto_login') === '1';
            if (skip) {
              sessionStorage.removeItem('skip_liff_auto_login');
              console.log('⏭️ Skip LIFF login due to recent logout');
            } else if (liff.isInClient && liff.isInClient() && !hasOAuthParams) {
              try { sessionStorage.setItem('liff_login_in_progress', '1'); } catch {}
              liff.login({ redirectUri: getStableRedirectUri() });
            }
          } else {
            const loginInProgress = sessionStorage.getItem('liff_login_in_progress') === '1';
            const oauthInProgress = sessionStorage.getItem('line_oauth_in_progress') === '1';
            const nextAuthUnauthed = status !== 'authenticated';
            if (nextAuthUnauthed && !hasOAuthParams && !oauthInProgress && !autoLoginTriggeredThisMountRef.current) {
              autoLoginTriggeredThisMountRef.current = true;
              setAutoLoginAttempted(true);
              await handleAutoLogin(liff);
            }
          }
        }

        // Clean up temporary LIFF/OAuth params to avoid collision in next load
        try {
          const urlToClean = new URL(window.location.href);
          const paramsToDelete = [
            'code', 'state', 'liff.state', 'liffRedirectUri', 'liffClientId',
          ];
          let changed = false;
          paramsToDelete.forEach((key) => {
            if (urlToClean.searchParams.has(key)) {
              urlToClean.searchParams.delete(key);
              changed = true;
            }
          });
          if (changed) {
            window.history.replaceState(null, '', urlToClean.toString());
          }
          // clear OAuth in-progress flag เมื่อ session พร้อมเท่านั้น
          try {
            if (status === 'authenticated') {
              sessionStorage.removeItem('liff_login_in_progress');
              sessionStorage.removeItem('line_oauth_in_progress');
            }
          } catch {}
        } catch {}
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