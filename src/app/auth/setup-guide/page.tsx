"use client";

import { Box, Typography, Card, CardContent, Alert, Button, Stack, Divider } from "@mui/material";
import { useRouter } from "next/navigation";

export default function AuthSetupGuide() {
  const router = useRouter();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔧 LINE OAuth Setup Guide
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          มีปัญหาการเข้าสู่ระบบด้วย LINE OAuth กรุณาตรวจสอบการตั้งค่าต่อไปนี้
        </Typography>
      </Alert>

      <Stack spacing={3}>
        {/* Environment Variables */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              1. ตรวจสอบ Environment Variables
            </Typography>
            <Typography variant="body2" gutterBottom>
              ตรวจสอบว่า environment variables ต่อไปนี้ถูกตั้งค่าแล้ว:
            </Typography>
            <Box component="pre" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '14px' }}>
{`LINE_CLIENT_ID=your_channel_id
LINE_CLIENT_SECRET=your_channel_secret
NEXTAUTH_URL=https://corgi.theredpotion.com
NEXTAUTH_SECRET=your_secret_key`}
            </Box>
          </CardContent>
        </Card>

        {/* LINE Developers Console */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              2. LINE Developers Console Settings
            </Typography>
            <Typography variant="body2" gutterBottom>
              ใน LINE Developers Console ต้องตั้งค่า Callback URLs ดังนี้:
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Web app (NextAuth OAuth):
            </Typography>
            <Box component="pre" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '14px' }}>
{`https://corgi.theredpotion.com/api/auth/callback/line`}
            </Box>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              LIFF app (optional):
            </Typography>
            <Box component="pre" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '14px' }}>
{`https://corgi.theredpotion.com/api/auth/liff-callback
https://corgi.theredpotion.com/liff`}
            </Box>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              3. Debug Information
            </Typography>
            <Typography variant="body2" gutterBottom>
              Current configuration:
            </Typography>
            <Box component="pre" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '14px' }}>
{`Expected NextAuth callback URL:
https://corgi.theredpotion.com/api/auth/callback/line

LINE OAuth Authorize URL:
https://access.line.me/oauth2/v2.1/authorize

LINE Token URL:
https://api.line.me/oauth2/v2.1/token

LINE Profile URL:
https://api.line.me/v2/profile`}
            </Box>
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              4. ปัญหาที่พบบ่อย
            </Typography>
            <Stack spacing={2}>
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Callback URL Mismatch:</strong><br/>
                  ตรวจสอบว่า Callback URL ใน LINE Developers Console ตรงกับ<br/>
                  <code>https://corgi.theredpotion.com/api/auth/callback/line</code>
                </Typography>
              </Alert>
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>Environment Variables Missing:</strong><br/>
                  ตรวจสอบว่า <code>LINE_CLIENT_ID</code>, <code>LINE_CLIENT_SECRET</code>, และ <code>NEXTAUTH_URL</code> ถูกตั้งค่าแล้ว
                </Typography>
              </Alert>
              <Alert severity="error">
                <Typography variant="body2">
                  <strong>HTTPS Required:</strong><br/>
                  LINE OAuth จำเป็นต้องใช้ HTTPS ในการ production
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              การดำเนินการ
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                onClick={() => router.push('/auth/signin')}
              >
                ลองเข้าสู่ระบบอีกครั้ง
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => router.push('/debug-auth')}
              >
                ไปหน้า Debug
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
