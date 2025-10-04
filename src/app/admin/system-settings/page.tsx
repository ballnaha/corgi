"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from "@mui/material";
import { Save, Refresh } from "@mui/icons-material";
import AdminLayout from "@/components/admin/AdminLayout";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  category: string;
}

interface DepositSettings {
  minAmount: number;
  percentage: number;
  enabled: boolean;
}

export default function SystemSettingsPage() {
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DepositSettings>({
    minAmount: 10000,
    percentage: 10,
    enabled: true
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/system-settings?category=payment");
      if (response.ok) {
        const data = await response.json();
        
        // แปลงข้อมูลเป็น DepositSettings format
        const settingsMap = data.reduce((acc: any, setting: SystemSetting) => {
          acc[setting.key] = setting;
          return acc;
        }, {});

        setSettings({
          minAmount: parseFloat(settingsMap["deposit.min_amount"]?.value || "10000"),
          percentage: parseFloat(settingsMap["deposit.percentage"]?.value || "10"),
          enabled: settingsMap["deposit.enabled"]?.value === "true"
        });
      } else {
        showSnackbar("ไม่สามารถโหลดการตั้งค่าได้", "error");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      showSnackbar("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates = [
        {
          key: "deposit.min_amount",
          value: settings.minAmount.toString(),
          type: "number",
          category: "payment"
        },
        {
          key: "deposit.percentage",
          value: settings.percentage.toString(),
          type: "number",
          category: "payment"
        },
        {
          key: "deposit.enabled",
          value: settings.enabled.toString(),
          type: "boolean",
          category: "payment"
        }
      ];

      const promises = updates.map(update =>
        fetch("/api/system-settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(update),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every(result => result.ok);

      if (allSuccessful) {
        showSnackbar("บันทึกการตั้งค่าสำเร็จ", "success");
      } else {
        showSnackbar("เกิดข้อผิดพลาดในการบันทึก", "error");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
   
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 3
        }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.5rem", md: "2.125rem" }
              }}
            >
              การตั้งค่าระบบ - การชำระเงิน
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.875rem", md: "1rem" },
                mt: 0.5
              }}
            >
              จัดการการตั้งค่าเกี่ยวกับการชำระเงินมัดจำสำหรับสัตว์เลี้ยง
            </Typography>
          </Box>
        </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
              <Box sx={{ flex: { md: 2 } }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      การตั้งค่าการจ่ายมัดจำ
                    </Typography>
                    
                    <Box sx={{ mt: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.enabled}
                            onChange={(e) =>
                              setSettings(prev => ({
                                ...prev,
                                enabled: e.target.checked
                              }))
                            }
                            color="primary"
                          />
                        }
                        label="เปิดใช้งานระบบการจ่ายมัดจำ"
                      />
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", sm: "row" } }}>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="จำนวนเงินขั้นต่ำ (บาท)"
                          type="number"
                          value={settings.minAmount}
                          onChange={(e) =>
                            setSettings(prev => ({
                              ...prev,
                              minAmount: parseFloat(e.target.value) || 0
                            }))
                          }
                          helperText="ยอดสั่งซื้อขั้นต่ำที่ต้องจ่ายมัดจำ"
                          InputProps={{
                            inputProps: { min: 0 }
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="เปอร์เซ็นต์มัดจำ (%)"
                          type="number"
                          value={settings.percentage}
                          onChange={(e) =>
                            setSettings(prev => ({
                              ...prev,
                              percentage: parseFloat(e.target.value) || 0
                            }))
                          }
                          helperText="เปอร์เซ็นต์ของยอดสั่งซื้อที่ต้องจ่ายมัดจำ"
                          InputProps={{
                            inputProps: { min: 0, max: 100 }
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchSettings}
                        disabled={loading}
                      >
                        โหลดใหม่
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: { md: 1 } }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    ตัวอย่างการคำนวณ
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>สถานะ:</strong> {settings.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Typography>
                  </Alert>

                  {settings.enabled && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>เงื่อนไข:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2, mb: 2 }}>
                        • สินค้าเป็นสัตว์เลี้ยง<br/>
                        • ยอดสั่งซื้อ ≥ {settings.minAmount.toLocaleString()} บาท
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>การคำนวณ:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        มัดจำ = ยอดสั่งซื้อ × {settings.percentage}%<br/>
                        ยอดคงเหลือ = ยอดสั่งซื้อ - มัดจำ
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="body2" gutterBottom>
                        <strong>ตัวอย่าง:</strong> ยอดสั่งซื้อ 15,000 บาท
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2, color: "success.main" }}>
                        มัดจำ: {(15000 * settings.percentage / 100).toLocaleString()} บาท<br/>
                        คงเหลือ: {(15000 - (15000 * settings.percentage / 100)).toLocaleString()} บาท
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          )}

          <SnackbarComponent />
        </Box>
    
  );
}