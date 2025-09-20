"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/hooks/useLiff";
import LoadingScreen from "@/components/LoadingScreen";
import { signIn } from "next-auth/react";

export default function LiffPage() {
  const { data: session, status } = useSession();
  const { isReady, isInLiff, isLoggedIn, liffError } = useLiff();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const kickAuthRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // If authenticated, redirect to shop
    if (status === "authenticated") {
      router.push("/shop");
      return;
    }

    // If in LIFF and LIFF is logged in but NextAuth isn't, force NextAuth sign-in
    if (isReady && isInLiff && isLoggedIn && status === "unauthenticated" && !kickAuthRef.current) {
      kickAuthRef.current = true;
      const rid = Math.random().toString(36).slice(2);
      fetch('/api/auth/clear-line-cache', { method: 'POST' })
        .catch(() => {})
        .finally(() => {
          signIn('line', { callbackUrl: `/shop?rid=${rid}` });
        });
      return;
    }

    // If not in LIFF, and LIFF not logged in, go to signin page
    if (isReady && !isLoggedIn && !liffError && !isInLiff) {
      router.push("/auth/signin");
    }
  }, [mounted, status, isReady, isLoggedIn, liffError, isInLiff, router]);

  if (!mounted || !isReady) {
    return <LoadingScreen message="กำลังเชื่อมต่อ LINE..." fullScreen={false} />;
  }

  if (liffError) {
    return <LoadingScreen message={`เกิดข้อผิดพลาด: ${liffError}`} fullScreen={false} />;
  }

  if (status === "loading" || (isLoggedIn && status === "unauthenticated")) {
    return <LoadingScreen message="กำลังเข้าสู่ระบบ..." fullScreen={false} />;
  }

  return <LoadingScreen message="กำลังโหลด..." fullScreen={false} />;
}