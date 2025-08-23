"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const checkLiffAndRedirect = async () => {
      try {
        // Check if we're in LIFF environment
        const isLiff = typeof window !== 'undefined' && (
          window.location.href.includes('liff.line.me') ||
          window.location.href.includes('liff-web.line.me') ||
          window.location.search.includes('liff') ||
          navigator.userAgent.includes('Line/')
        );

        if (isLiff) {
          // If from LIFF, redirect to shop page for authentication
          router.replace("/shop");
        } else {
          // If normal web access, redirect to home page (public access)
          router.replace("/home");
        }
      } catch (error) {
        console.error('Error checking LIFF environment:', error);
        // Fallback to home page for normal web access
        router.replace("/home");
      } finally {
        setIsRedirecting(false);
      }
    };

    checkLiffAndRedirect();
  }, [router]);

  // Show full screen loading to prevent bottom navigation flash
  return <LoadingScreen message="กำลังเปลี่ยนหน้า..." fullScreen={true} />;
}
