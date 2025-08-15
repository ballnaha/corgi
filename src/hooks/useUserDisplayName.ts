import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useUserDisplayName() {
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState<string>("ผู้ใช้งาน");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ถ้า session ยังโหลดอยู่
    if (status === "loading") {
      setLoading(true);
      return;
    }

    // ถ้าไม่มี session หรือไม่มี lineUserId
    if (!session?.user?.lineUserId) {
      setDisplayName(session?.user?.name || "ผู้ใช้งาน");
      setLoading(false);
      return;
    }

    // ดึงข้อมูลจาก API
    setLoading(true);
    fetch("/api/user/display-name")
      .then(res => res.json())
      .then(data => {
        setDisplayName(data.displayName || session?.user?.name || "ผู้ใช้งาน");
      })
      .catch(error => {
        console.error("Error fetching display name:", error);
        setDisplayName(session?.user?.name || "ผู้ใช้งาน");
      })
      .finally(() => setLoading(false));
  }, [session?.user?.lineUserId, session?.user?.name, status]);

  return { displayName, loading };
}