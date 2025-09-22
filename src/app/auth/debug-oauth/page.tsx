"use client";

import { Box, Typography, Card, CardContent, Button, Stack, Alert, Divider } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DebugOAuthPage() {
  const router = useRouter();
  const [envCheck, setEnvCheck] = useState<any>(null);
  const [urlCheck, setUrlCheck] = useState<any>(null);

  const checkEnvironment = async () => {
    try {
      const response = await fetch('/api/auth/debug-env', {
        credentials: 'include'
      });
      const data = await response.json();
      setEnvCheck(data);
    } catch (error) {
      setEnvCheck({ error: 'Failed to check environment' });
    }
  };

  const testOAuthUrl = () => {
    // Generate LINE OAuth URL manually to test
    const clientId = process.env.LINE_CLIENT_ID || '2007609360';
    const redirectUri = encodeURIComponent('https://corgi.theredpotion.com/api/auth/callback/line');
    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);
    
    const oauthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `state=${state}&` +
      `scope=profile&` +
      `nonce=${nonce}`;
    
    setUrlCheck({
      clientId,
      redirectUri: decodeURIComponent(redirectUri),
      oauthUrl,
      state,
      nonce
    });
  };

  useEffect(() => {
    checkEnvironment();
    testOAuthUrl();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 LINE OAuth Debug Center
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          เครื่องมือตรวจสอบการตั้งค่า LINE OAuth และวินิจฉัยปัญหา
        </Typography>
      </Alert>

      <Stack spacing={3}>
        {/* Environment Check */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              1. Environment Variables Check
            </Typography>
            {envCheck ? (
              <pre style={{ 
                fontSize: '12px', 
                overflow: 'auto', 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px' 
              }}>
                {JSON.stringify(envCheck, null, 2)}
              </pre>
            ) : (
              <Typography>กำลังตรวจสอบ...</Typography>
            )}
            <Button 
              variant="outlined" 
              onClick={checkEnvironment}
              sx={{ mt: 2 }}
            >
              ตรวจสอบใหม่
            </Button>
          </CardContent>
        </Card>

        {/* OAuth URL Check */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              2. OAuth URL Configuration
            </Typography>
            {urlCheck ? (
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Client ID:</strong> {urlCheck.clientId}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Redirect URI:</strong> {urlCheck.redirectUri}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                  <strong>Generated OAuth URL:</strong>
                </Typography>
                <Box 
                  component="pre" 
                  sx={{ 
                    fontSize: '11px', 
                    overflow: 'auto', 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    wordBreak: 'break-all'
                  }}
                >
                  {urlCheck.oauthUrl}
                </Box>
                <Button 
                  variant="contained" 
                  href={urlCheck.oauthUrl}
                  sx={{ mt: 2 }}
                  color="warning"
                >
                  🧪 ทดสอบ OAuth URL (ระวัง: จะ redirect ไป LINE)
                </Button>
              </Box>
            ) : (
              <Typography>กำลังสร้าง URL...</Typography>
            )}
          </CardContent>
        </Card>

        {/* Required Setup */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              3. สิ่งที่ต้องตรวจสอบใน LINE Developers Console
            </Typography>
            <Stack spacing={2}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Callback URL ต้องเป็น:</strong><br/>
                  <code>https://corgi.theredpotion.com/api/auth/callback/line</code>
                </Typography>
              </Alert>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Channel Type:</strong> LINE Login<br/>
                  <strong>Scope:</strong> profile<br/>
                  <strong>Grant Type:</strong> authorization_code
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Debug Steps */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              4. ขั้นตอนการ Debug
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2">
                <strong>Step 1:</strong> ตรวจสอบ Environment Variables ด้านบน
              </Typography>
              <Typography variant="body2">
                <strong>Step 2:</strong> ตรวจสอบ Callback URL ใน LINE Developers Console
              </Typography>
              <Typography variant="body2">
                <strong>Step 3:</strong> ลองทดสอบ OAuth URL (ปุ่มสีส้มด้านบน)
              </Typography>
              <Typography variant="body2">
                <strong>Step 4:</strong> ดู Network tab ใน DevTools เมื่อ login
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              การดำเนินการ
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                onClick={() => router.push('/auth/signin')}
              >
                กลับไปหน้า Login
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/debug-auth')}
              >
                ไปหน้า Debug Session
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/auth/setup-guide')}
              >
                ดูคู่มือการตั้งค่า
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
