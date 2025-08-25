"use client";

import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Divider,
  Button
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Verified as VerifiedIcon,
  Assignment as AssignmentIcon,
  Pets as PetsIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from "@mui/icons-material";

interface RegistrationCertificateSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function RegistrationCertificateSheet({
  open,
  onClose
}: RegistrationCertificateSheetProps) {
  const benefits = [
    {
      icon: <VerifiedIcon sx={{ color: "#4CAF50" }} />,
      title: "การยืนยันตัวตน",
      description: "ยืนยันว่าสุนัขของคุณมีตัวตนที่ถูกต้องตามกฎหมาย"
    },
    {
      icon: <SecurityIcon sx={{ color: "#2196F3" }} />,
      title: "ความปลอดภัย",
      description: "ช่วยในการติดตามและค้นหาสุนัขที่หายไป"
    },
    {
      icon: <AssignmentIcon sx={{ color: "#FF9800" }} />,
      title: "ข้อมูลสายพันธุ์",
      description: "บันทึกข้อมูลสายพันธุ์และประวัติการเจริญเติบโต"
    },
    {
      icon: <PetsIcon sx={{ color: "#E91E63" }} />,
      title: "สุขภาพและวัคซีน",
      description: "ติดตามประวัติการฉีดวัคซีนและสุขภาพของสุนัข"
    }
  ];

  const requirements = [
    "ใบรับรองการเกิดของสุนัข",
    "ข้อมูลพ่อแม่พันธุ์",
    "ประวัติการฉีดวัคซีน",
    "การตรวจสุขภาพจากสัตวแพทย์",
    "ข้อมูลผู้เลี้ยง"
  ];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "90vh",
          overflow: "auto"
        }
      }}
    >
      <Box sx={{ width: "100%", p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "#FF6B35",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AssignmentIcon sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000" }}>
              ใบรับรองการลงทะเบียนสุนัข
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#666" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Main Description Card */}
        <Card sx={{ mb: 3, border: "2px solid #F0F0F0", borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <InfoIcon sx={{ color: "#2196F3", fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#000" }}>
                ใบรับรองการลงทะเบียนสุนัข คืออะไร?
              </Typography>
            </Box>
            <Typography
              sx={{
                color: "#666",
                fontSize: 16,
                lineHeight: 1.7,
                mb: 2
              }}
            >
              ใบรับรองการลงทะเบียนสุนัข คือ เอกสารสำคัญที่รับรองตัวตนและสายพันธุ์ของสุนัข 
              ซึ่งออกโดยองค์กรที่ได้รับการรับรองอย่างเป็นทางการ
            </Typography>
            <Typography
              sx={{
                color: "#666",
                fontSize: 16,
                lineHeight: 1.7
              }}
            >
              เอกสารนี้จะมีข้อมูลครบถ้วนเกี่ยวกับประวัติของสุนัข รวมถึงข้อมูลพ่อแม่พันธุ์ 
              ซึ่งเป็นหลักฐานสำคัญในการยืนยันความบริสุทธิ์ของสายพันธุ์
            </Typography>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          ประโยชน์ของใบรับรองการลงทะเบียน
        </Typography>
        <Box sx={{ mb: 3 }}>
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              sx={{
                mb: 2,
                border: "1px solid #E0E0E0",
                borderRadius: 2,
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box
                    sx={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#F8F9FA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 16,
                        color: "#000",
                        mb: 0.5
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: "#666",
                        fontSize: 14,
                        lineHeight: 1.5
                      }}
                    >
                      {benefit.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Requirements Section */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          เอกสารที่ต้องใช้ในการขอใบรับรอง
        </Typography>
        <List sx={{ mb: 3 }}>
          {requirements.map((requirement, index) => (
            <ListItem
              key={index}
              sx={{
                px: 0,
                py: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon sx={{ color: "#4CAF50", fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={requirement}
                primaryTypographyProps={{
                  fontSize: 15,
                  color: "#333"
                }}
              />
            </ListItem>
          ))}
        </List>

        {/* Important Note */}
        <Card
          sx={{
            backgroundColor: "#FFF8E1",
            border: "2px solid #FFE082",
            borderRadius: 2,
            mb: 3
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <InfoIcon sx={{ color: "#FF9800", fontSize: 24 }} />
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: "#E65100"
                }}
              >
                หมายเหตุสำคัญ
              </Typography>
            </Box>
            <Typography
              sx={{
                color: "#BF360C",
                fontSize: 14,
                lineHeight: 1.6
              }}
            >
              สุนัขทุกตัวที่จำหน่ายจากร้านของเรามาพร้อมกับใบรับรองการลงทะเบียนที่ถูกต้องตามกฎหมาย 
              รับประกันความบริสุทธิ์ของสายพันธุ์ และมีประวัติสุขภาพที่สมบูรณ์
            </Typography>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            width: "100%",
            py: 1.5,
            backgroundColor: "#FF6B35",
            color: "white",
            borderRadius: 3,
            fontSize: 16,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#E55A2B"
            }
          }}
        >
          เข้าใจแล้ว
        </Button>
      </Box>
    </Drawer>
  );
}
