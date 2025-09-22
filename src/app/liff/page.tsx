"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/hooks/useLiff";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import LoadingScreen from "@/components/LoadingScreen";

export default function LiffPage() {
  const { user, isAuthenticated, isLoading, login } = useSimpleAuth();
  const { isReady, isInLiff, isLoggedIn, liffError } = useLiff();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const kickAuthRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    // ล้างพารามิเตอร์ OAuth ทันทีเมื่อเข้าหน้า /liff เพื่อกันชนกับรอบก่อน
    try {
      const url = new URL(window.location.href);
      const changed = ['code', 'state', 'liff.state', 'liffRedirectUri', 'liffClientId'].some(key => {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          return true;
        }
        return false;
      });
      if (changed) {
        window.history.replaceState(null, '', url.toString());
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if user wants to skip auto login (just logged out)
    const skipAutoLogin = sessionStorage.getItem('skip_liff_auto_login') === '1';
    
    // If authenticated, redirect to shop
    if (isAuthenticated) {
      router.push("/shop");
      return;
    }

    // If user just logged out, don't auto login and redirect to home
    if (skipAutoLogin) {
      console.log('🚫 Skipping LIFF auto login due to recent logout');
      router.push("/home");
      return;
    }

    // If in LIFF and LIFF is logged in but simple auth isn't, use LIFF ID token
    if (isReady && isInLiff && isLoggedIn && !isAuthenticated && !kickAuthRef.current) {
      kickAuthRef.current = true;
      
      // Get LIFF ID token and login with simple auth
      try {
        const idToken = window.liff?.getIDToken();
        if (idToken) {
          login(idToken).then(success => {
            if (success) {
              // Dispatch auto login event to notify other components/pages
              window.dispatchEvent(new CustomEvent('liff-auto-login-success'));
              console.log('📡 LIFF page auto login event dispatched');
              router.push("/shop");
            }
          });
        }
      } catch (error) {
        console.error('LIFF token error:', error);
      }
      return;
    }

    // If not in LIFF, and LIFF not logged in, go to signin page
    if (isReady && !isLoggedIn && !liffError && !isInLiff) {
      router.push("/auth/signin");
    }
  }, [mounted, isAuthenticated, isReady, isLoggedIn, liffError, isInLiff, router, login]);

  if (!mounted || !isReady) {
    return <LoadingScreen message="กำลังเชื่อมต่อ LINE..." fullScreen={false} />;
  }

  if (liffError) {
    return <LoadingScreen message={`เกิดข้อผิดพลาด: ${liffError}`} fullScreen={false} />;
  }

  if (isLoading || (isLoggedIn && !isAuthenticated)) {
    return <LoadingScreen message="กำลังเข้าสู่ระบบ..." fullScreen={false} />;
  }

  return <LoadingScreen message="กำลังโหลด..." fullScreen={false} />;
}