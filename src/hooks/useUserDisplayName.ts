import { useState, useEffect } from "react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

export function useUserDisplayName() {
  const { user, isAuthenticated, isLoading } = useSimpleAuth();
  const [displayName, setDisplayName] = useState<string>("ผู้ใช้งาน");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ถ้า auth ยังโหลดอยู่
    if (isLoading) {
      setLoading(true);
      return;
    }

    // ถ้าไม่มี user หรือไม่มี lineUserId
    if (!isAuthenticated || !user?.lineUserId) {
      setDisplayName(user?.displayName || "ผู้ใช้งาน");
      setLoading(false);
      return;
    }

    // ใช้ displayName จาก user โดยตรง (ข้อมูลมาจาก LIFF แล้ว)
    setDisplayName(user.displayName || "ผู้ใช้งาน");
    setLoading(false);
  }, [user?.lineUserId, user?.displayName, isAuthenticated, isLoading]);

  return { displayName, loading };
}