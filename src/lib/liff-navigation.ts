"use client";

// Utility functions for handling navigation in LIFF environment
export const isInLiffEnvironment = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent;
  const isLineApp = userAgent.includes("Line/") && 
                   (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone"));
  
  const url = window.location.href;
  const isLiffUrl = url.includes("liff.line.me") || url.includes("liff-web.line.me");
  
  return isLineApp || isLiffUrl;
};

export const safeLiffNavigation = (url: string) => {
  if (typeof window === "undefined") return;
  
  const isLiff = isInLiffEnvironment();
  
  if (isLiff) {
    // In LIFF environment, use window.location for navigation
    // This works better than router.push() in LINE mobile app
    console.log("LIFF navigation to:", url);
    window.location.href = url;
  } else {
    // In regular browser, use normal navigation
    window.location.href = url;
  }
};

export const handleLiffNavigation = (router: any, path: string) => {
  const isLiff = isInLiffEnvironment();
  
  if (isLiff) {
    // Use window.location for LIFF
    safeLiffNavigation(path);
  } else {
    // Use Next.js router for regular browsers
    router.push(path);
  }
};

export const suppressLiffAutoLogin = (minutes: number = 5) => {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + minutes * 60 * 1000;
    sessionStorage.setItem("liff_auto_login_suppress_until", String(until));
  } catch {}
};

export const logoutLiffIfAvailable = async () => {
  if (typeof window === "undefined") return;
  try {
    const anyWindow = window as any;
    if (anyWindow.liff && typeof anyWindow.liff.logout === "function") {
      anyWindow.liff.logout();
    }
  } catch {}
};

export const clearAuthCookies = async () => {
  try {
    await fetch('/api/auth/clear-line-cache', { method: 'POST' });
  } catch {}
};