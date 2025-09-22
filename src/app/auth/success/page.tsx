"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import LoadingScreen from "@/components/LoadingScreen";

export default function AuthSuccessPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, isAuthenticated } = useSimpleAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSimpleAuthSession = async () => {
      try {
        console.log('🔄 Auth success page - creating SimpleAuth session');
        
        // Wait for NextAuth session to be available
        if (status === "loading") {
          console.log('⏳ Waiting for NextAuth session...');
          return;
        }

        if (!session?.user?.lineUserId) {
          console.log('❌ No NextAuth session found');
          setError('ไม่พบ session การเข้าสู่ระบบ');
          setTimeout(() => router.push('/auth/signin'), 2000);
          return;
        }

        console.log('✅ NextAuth session found, creating SimpleAuth session...');

        // Call the callback API to create SimpleAuth session
        const response = await fetch('/api/auth/nextauth-callback', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ SimpleAuth session created:', data);
          
          // Wait a moment for the session to be set, then redirect
          setTimeout(() => {
            router.push('/shop');
          }, 1000);
        } else {
          const errorData = await response.json();
          console.error('❌ Failed to create SimpleAuth session:', errorData);
          setError('ไม่สามารถสร้าง session ได้');
          setTimeout(() => router.push('/debug-auth'), 2000);
        }
      } catch (error) {
        console.error('❌ Error in auth success:', error);
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        setTimeout(() => router.push('/debug-auth'), 2000);
      } finally {
        setProcessing(false);
      }
    };

    createSimpleAuthSession();
  }, [session, status, router]);

  // If already authenticated via SimpleAuth, redirect immediately
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Already authenticated via SimpleAuth, redirecting...');
      router.push('/shop');
    }
  }, [isAuthenticated, user, router]);

  if (processing) {
    return (
      <LoadingScreen 
        message="กำลังสร้าง session..." 
        fullScreen={true} 
      />
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 3,
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          กำลังนำไปหน้าตรวจสอบ...
        </Typography>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <LoadingScreen 
      message="เข้าสู่ระบบสำเร็จ กำลังไปหน้าหลัก..." 
      fullScreen={true} 
    />
  );
}
