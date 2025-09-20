"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isInLiffEnvironment, safeLiffNavigation } from "@/lib/liff-navigation";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const checkLiffAndRedirect = async () => {
      try {
        const isLiff = isInLiffEnvironment();

        if (isLiff) {
          // กลับมาเข้าหน้า /shop โดยตรง แล้วให้ LineAuthProvider บังคับไป /liff หากยังไม่ auth
          safeLiffNavigation("/shop");
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname !== '/shop') {
              window.location.href = '/shop';
            }
          }, 300);
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
