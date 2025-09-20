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
          // ใช้ window.location ใน LIFF เพื่อลดโอกาสค้าง
          safeLiffNavigation("/shop");
          // เผื่อว่า navigation ไม่ทำงาน ให้บังคับเปลี่ยนหน้าอีกครั้งหลังหน่วงสั้น ๆ
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
