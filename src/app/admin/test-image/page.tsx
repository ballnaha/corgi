"use client";

import React, { useState } from "react";
import { Box, Container, Typography, TextField, Button, Card, CardContent, Alert } from "@mui/material";

export default function ImageTestPage() {
  const [imagePath, setImagePath] = useState("/uploads/products/1759800830104_3_large.png");
  const [testResults, setTestResults] = useState<any>(null);

  const testImage = async () => {
    const results = {
      directPath: {
        url: imagePath,
        status: "testing...",
        loadable: false,
      },
      apiPath: {
        url: `/api/images/uploads${imagePath.replace('/uploads/', '/')}`,
        status: "testing...",
        loadable: false,
      },
    };

    // Test direct path
    try {
      const response = await fetch(imagePath);
      results.directPath.status = `${response.status} ${response.statusText}`;
      results.directPath.loadable = response.ok;
    } catch (error: any) {
      results.directPath.status = `Error: ${error.message}`;
    }

    // Test API path
    const apiPath = imagePath.replace('/uploads/', 'uploads/');
    try {
      const response = await fetch(`/api/images/${apiPath}`);
      results.apiPath.status = `${response.status} ${response.statusText}`;
      results.apiPath.loadable = response.ok;
      results.apiPath.url = `/api/images/${apiPath}`;
    } catch (error: any) {
      results.apiPath.status = `Error: ${error.message}`;
    }

    setTestResults(results);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Image Path Tester
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Image Path"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="/uploads/products/filename.jpg"
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={testImage}>
            Test Image
          </Button>
        </CardContent>
      </Card>

      {testResults && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Direct Path Test
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
                {testResults.directPath.url}
              </Typography>
              <Alert severity={testResults.directPath.loadable ? "success" : "error"}>
                Status: {testResults.directPath.status}
              </Alert>
              {testResults.directPath.loadable && (
                <Box sx={{ mt: 2 }}>
                  <img 
                    src={testResults.directPath.url} 
                    alt="Direct test"
                    style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #ddd' }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Path Test
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
                {testResults.apiPath.url}
              </Typography>
              <Alert severity={testResults.apiPath.loadable ? "success" : "error"}>
                Status: {testResults.apiPath.status}
              </Alert>
              {testResults.apiPath.loadable && (
                <Box sx={{ mt: 2 }}>
                  <img 
                    src={testResults.apiPath.url} 
                    alt="API test"
                    style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #ddd' }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 Tips:
        </Typography>
        <Typography variant="body2">
          • ตรวจสอบ Console logs สำหรับ error messages<br />
          • ตรวจสอบ Network tab ใน DevTools<br />
          • ตรวจสอบว่าไฟล์มีอยู่จริงใน public/uploads/products/
        </Typography>
      </Alert>
    </Container>
  );
}
