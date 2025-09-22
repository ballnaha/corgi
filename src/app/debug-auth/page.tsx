"use client";

import { useSession } from "next-auth/react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { Box, Typography, Card, CardContent, Button, Stack, Alert } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DebugAuthPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user, isAuthenticated, manualSync } = useSimpleAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const checkDebugSession = async () => {
    try {
      const response = await fetch('/api/auth/debug-session', {
        credentials: 'include'
      });
      const data = await response.json();
      setDebugData(data);
      console.log("Debug Data:", data);
    } catch (error) {
      console.error("Debug failed:", error);
      setDebugData({ error: 'Failed to fetch debug data' });
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const success = await manualSync();
      if (success) {
        alert('Sync successful! Check console for details.');
      } else {
        alert('Sync failed! Check console for details.');
      }
    } catch (error) {
      alert('Sync error! Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCookies = async () => {
    setClearing(true);
    try {
      const response = await fetch('/api/auth/clear-pkce', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        alert('Cookies cleared! Try login again.');
        window.location.reload();
      } else {
        alert('Failed to clear cookies.');
      }
    } catch (error) {
      console.error('Clear cookies error:', error);
      alert('Error clearing cookies.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 Authentication Debug Center
      </Typography>
      
      <Stack spacing={3}>
        {/* NextAuth Session */}
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              NextAuth Session
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Session มาจาก NextAuth (สำหรับ LINE OAuth)
            </Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(session, null, 2) || 'No session'}
            </pre>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Status: {session ? '✅ Active' : '❌ No session'}
            </Typography>
          </CardContent>
        </Card>

        {/* SimpleAuth Session */}
        <Card>
          <CardContent>
            <Typography variant="h6" color="secondary" gutterBottom>
              SimpleAuth Session
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Session มาจาก SimpleAuth (สำหรับ LIFF และ sync จาก NextAuth)
            </Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(user, null, 2) || 'No user'}
            </pre>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
            </Typography>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Actions
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                onClick={checkDebugSession}
                color="info"
              >
                Check Server Session
              </Button>
              <Button 
                variant="contained" 
                onClick={handleManualSync}
                disabled={syncing}
                color="warning"
              >
                {syncing ? 'Syncing...' : 'Manual Sync NextAuth → SimpleAuth'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => router.push("/auth/debug-oauth")}
                color="secondary"
              >
                Debug OAuth Setup
              </Button>
              <Button 
                variant="contained" 
                onClick={handleClearCookies}
                disabled={clearing}
                color="error"
              >
                {clearing ? 'Clearing...' : 'Clear NextAuth Cookies'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Debug Data */}
        {debugData && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Debug Data
              </Typography>
              <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Alert severity="info">
          <Typography variant="body2">
            <strong>การใช้งาน:</strong><br/>
            1. ถ้าคุณ login ด้วย LINE OAuth (desktop) แต่ SimpleAuth ไม่ทำงาน ให้กด "Manual Sync"<br/>
            2. ถ้า NextAuth session ไม่มี ให้ไปหน้า /auth/signin ก่อน<br/>
            3. ตรวจสอบ console ของ browser สำหรับข้อมูล debug เพิ่มเติม
          </Typography>
        </Alert>

        {/* Current Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Status Summary
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                NextAuth: {session ? '✅ Active' : '❌ Inactive'} 
                {session?.user?.lineUserId && ` (LINE ID: ${session.user.lineUserId})`}
              </Typography>
              <Typography variant="body2">
                SimpleAuth: {isAuthenticated ? '✅ Active' : '❌ Inactive'}
                {user?.lineUserId && ` (LINE ID: ${user.lineUserId})`}
              </Typography>
              <Typography variant="body2">
                Sync Needed: {session && !isAuthenticated ? '⚠️ Yes' : '✅ No'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
