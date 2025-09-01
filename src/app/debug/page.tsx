"use client";

import { useSession } from "next-auth/react";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";

export default function DebugPage() {
  const { data: session } = useSession();

  const checkSession = async () => {
    const response = await fetch('/api/auth/session');
    const sessionData = await response.json();
    console.log("Session Data:", sessionData);
    alert(JSON.stringify(sessionData, null, 2));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔍 Debug Session Info
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Current Session:</Typography>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">LINE User ID Status:</Typography>
          <Typography>
            LINE User ID: {session?.user?.lineUserId || "❌ Not found"}
          </Typography>
          <Typography>
            Login Provider: {session?.user?.provider || "Unknown"}
          </Typography>
          <Typography>
            User Name: {session?.user?.name || "No name"}
          </Typography>
        </CardContent>
      </Card>

      <Button variant="contained" onClick={checkSession}>
        Check Session API
      </Button>
    </Box>
  );
}
