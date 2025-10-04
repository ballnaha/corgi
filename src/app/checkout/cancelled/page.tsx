"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  IconButton,
} from "@mui/material";
import {
  CancelOutlined,
  ArrowBack,
  ShoppingCart,
  Home,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { clearCartStorage } from "@/lib/cart";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

export default function CheckoutCancelledPage() {
  const router = useRouter();
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();

  useEffect(() => {
    // ล้างตะกร้าสินค้าเมื่อยกเลิกการชำระเงิน
    clearCartStorage();
    
    // แสดงข้อความแจ้งเตือน
    setTimeout(() => {
      showSnackbar("ยกเลิกการชำระเงินแล้ว ตะกร้าสินค้าถูกล้างเรียบร้อย", "info");
    }, 500);
  }, [showSnackbar]);

  const handleGoHome = () => {
    handleLiffNavigation(router, "/");
  };

  const handleGoToShop = () => {
    handleLiffNavigation(router, "/shop");
  };

  const handleBackToCheckout = () => {
    handleLiffNavigation(router, "/checkout");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.background.default,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 100,
          py: { xs: 1.5, sm: 2, md: 3 },
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: { xs: "100%", sm: "100%", md: "1200px" }, mx: "auto" }}>
          <Box
            sx={{
              px: { xs: 0.5, sm: 1, md: 3 },
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <IconButton
              onClick={handleGoHome}
              sx={{
                backgroundColor: "rgba(0,0,0,0.04)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                borderRadius: 2,
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
            >
              การชำระเงินถูกยกเลิก
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                py: { xs: 4, sm: 6, md: 8 },
                px: { xs: 2, sm: 3, md: 4 },
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: { xs: 80, sm: 100, md: 120 },
                  height: { xs: 80, sm: 100, md: 120 },
                  borderRadius: "50%",
                  backgroundColor: "#ff9800",
                  mb: { xs: 2, sm: 3, md: 4 },
                  mx: "auto",
                }}
              >
                <CancelOutlined
                  sx={{
                    fontSize: { xs: 40, sm: 50, md: 60 },
                    color: "white",
                  }}
                />
              </Box>

              {/* Title */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: colors.text.primary,
                  mb: 2,
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                }}
              >
                การชำระเงินถูกยกเลิก
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: colors.text.secondary,
                  mb: { xs: 3, sm: 4, md: 5 },
                  lineHeight: 1.6,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                }}
              >
                คุณได้ยกเลิกการชำระเงินด้วยบัตรเครดิต
                <br />
                ตะกร้าสินค้าของคุณถูกล้างเรียบร้อยแล้ว
              </Typography>

              {/* Buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGoToShop}
                  startIcon={<ShoppingCart />}
                  sx={{
                    minWidth: { xs: "100%", sm: 200 },
                    py: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    backgroundColor: colors.primary.main,
                    boxShadow: `0 4px 20px ${colors.primary.main}40`,
                    "&:hover": {
                      backgroundColor: colors.primary.dark,
                      boxShadow: `0 6px 25px ${colors.primary.main}50`,
                    },
                  }}
                >
                  เลือกซื้อสินค้าใหม่
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGoHome}
                  startIcon={<Home />}
                  sx={{
                    minWidth: { xs: "100%", sm: 200 },
                    py: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    borderColor: colors.primary.main,
                    color: colors.primary.main,
                    "&:hover": {
                      borderColor: colors.primary.dark,
                      backgroundColor: `${colors.primary.main}08`,
                    },
                  }}
                >
                  กลับหน้าหลัก
                </Button>
              </Box>

              {/* Additional Info */}
              <Box
                sx={{
                  mt: { xs: 3, sm: 4 },
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: colors.background.default,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                    fontSize: "0.875rem",
                  }}
                >
                  💡 หากต้องการความช่วยเหลือ กรุณาติดต่อเรา
                  <br />
                  หรือสามารถเลือกซื้อสินค้าใหม่ได้ตลอดเวลา
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Snackbar */}
      <SnackbarComponent />
    </Box>
  );
}
