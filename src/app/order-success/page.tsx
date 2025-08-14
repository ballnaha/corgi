"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
} from "@mui/material";
import { CheckCircle, Home, Receipt } from "@mui/icons-material";
import { colors } from "@/theme/colors";

export default function OrderSuccessPage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Card sx={{ width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <CheckCircle
              sx={{
                fontSize: 80,
                color: colors.success,
                mb: 2,
              }}
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: colors.text.primary,
                mb: 2,
              }}
            >
              สั่งซื้อสำเร็จ!
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: colors.text.secondary,
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              ขอบคุณสำหรับการสั่งซื้อ
              เราจะดำเนินการจัดส่งสินค้าให้คุณโดยเร็วที่สุด
              <br />
              คุณจะได้รับอีเมลยืนยันการสั่งซื้อในอีกสักครู่
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<Home />}
                onClick={() => router.push("/")}
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  backgroundColor: colors.primary.main,
                  "&:hover": {
                    backgroundColor: colors.primary.dark,
                  },
                }}
              >
                กลับสู่หน้าแรก
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<Receipt />}
                onClick={() => router.push("/profile")}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                ดูประวัติการสั่งซื้อ
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
