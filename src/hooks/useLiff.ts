"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

// LIFF SDK type definitions
interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffObject {
  init: (config: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: () => void;
  logout: () => void;
  getProfile: () => Promise<LiffProfile>;
  getIDToken: () => string | null;
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
          withLoginOnExternalBrowser: true
        });

        // Enable LIFF client features for better navigation
        if (liff.isInClient && liff.isInClient()) {
          console.log("Running in LIFF client mode");
        }

        setLiffObject(liff);
        setIsLoggedIn(liff.isLoggedIn());
        setIsReady(true);

        // Handle LIFF login - only trigger login if not logged in
        if (!liff.isLoggedIn()) {
          liff.login();
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