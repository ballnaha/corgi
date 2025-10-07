"use client";

import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Card, CardContent, Button, CircularProgress, Alert, Chip } from "@mui/material";
import { CheckCircle, Error, Refresh } from "@mui/icons-material";

interface DiagnosticResult {
  timestamp: string;
  uploadsPath: string;
  directories: Record<string, any>;
  totalFiles: number;
  totalSize: number;
  totalSizeKB: string;
  totalSizeMB: string;
}

export default function ImageDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [uploads, setUploads] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Run storage diagnostics
      const diagResponse = await fetch('/api/upload/diagnostics');
      if (diagResponse.ok) {
        const diagData = await diagResponse.json();
        setDiagnostics(diagData);
      }

      // List uploaded files
      const listResponse = await fetch('/api/upload/list');
      if (listResponse.ok) {
        const listData = await listResponse.json();
        setUploads(listData);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🔍 Image Upload Diagnostics
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={runDiagnostics}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Storage Diagnostics */}
      {diagnostics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📁 Storage Configuration
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Environment: {diagnostics.environment.isServerless ? '☁️ Serverless' : '🖥️ Traditional Server'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Node ENV: {diagnostics.environment.nodeEnv}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Platform: {diagnostics.environment.platform}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                Working Directory: {diagnostics.environment.cwd}
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Upload Directories:
            </Typography>
            {Object.entries(diagnostics.storage.uploadDirs).map(([dir, info]: [string, any]) => (
              <Box key={dir} sx={{ ml: 2, mb: 1 }}>
                <Typography variant="body2">
                  {dir}:{' '}
                  {info.exists ? (
                    <>
                      <Chip
                        size="small"
                        icon={<CheckCircle />}
                        label="Exists"
                        color="success"
                        sx={{ mr: 1 }}
                      />
                      {info.writable ? (
                        <Chip
                          size="small"
                          icon={<CheckCircle />}
                          label="Writable"
                          color="success"
                        />
                      ) : (
                        <Chip
                          size="small"
                          icon={<Error />}
                          label="Not Writable"
                          color="error"
                        />
                      )}
                    </>
                  ) : (
                    <Chip
                      size="small"
                      icon={<Error />}
                      label="Not Found"
                      color="error"
                    />
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, wordBreak: 'break-all' }}>
                  {info.path}
                </Typography>
              </Box>
            ))}

            {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
              <Alert severity={diagnostics.recommendations[0].startsWith('✅') ? 'success' : 'warning'} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations:
                </Typography>
                {diagnostics.recommendations.map((rec: string, idx: number) => (
                  <Typography key={idx} variant="body2">
                    {rec}
                  </Typography>
                ))}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploads && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📦 Uploaded Files
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Total Files: <strong>{uploads.totalFiles}</strong>
              </Typography>
              <Typography variant="body2">
                Total Size: <strong>{uploads.totalSizeMB} MB</strong> ({uploads.totalSizeKB} KB)
              </Typography>
            </Box>

            {Object.entries(uploads.directories).map(([dir, info]: [string, any]) => (
              <Box key={dir} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {dir}/ {info.error ? (
                    <Chip label={info.error} color="error" size="small" />
                  ) : (
                    <Chip label={`${info.fileCount} files (${info.totalSizeMB} MB)`} size="small" />
                  )}
                </Typography>
                
                {info.files && info.files.length > 0 && (
                  <Box sx={{ ml: 2 }}>
                    {info.files.map((file: any, idx: number) => (
                      <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {file.sizeKB} KB | URL: {file.url}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <img 
                            src={file.url} 
                            alt={file.name}
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '200px', 
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              padding: '4px',
                              background: '#f5f5f5'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Error Loading</text></svg>';
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                    {info.fileCount > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {info.fileCount - 10} more files
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
