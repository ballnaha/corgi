"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

export default function LiffRedirect() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if we're coming from LIFF URL
    const currentUrl = window.location.href;
    const isFromLiff = currentUrl.includes("liff.line.me");

    if (isFromLiff) {
      // Redirect to the main domain to avoid hydration issues
      const targetUrl = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN
        ? `https://${process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN}`
        : `https://${process.env.NEXT_PUBLIC_TEST_DOMAIN}`;

      window.location.href = targetUrl;
      return;
    }

    // If not from LIFF, redirect to home
    router.push("/");
  }, [mounted, router]);

  return <LoadingScreen message="กำลังเปลี่ยนเส้นทาง..." fullScreen={false} />;
}