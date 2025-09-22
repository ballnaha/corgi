"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import { Home, ArrowBack, Search } from "@mui/icons-material";
import { colors } from "@/theme/colors";
import Image from "next/image";

export default function GlobalNotFound() {
  const router = useRouter();
  
  // Debug log to confirm this component is rendered
  React.useEffect(() => {
    console.log('🚫 404 Not Found page rendered');
  }, []);

  const handleGoHome = () => {
    router.push("/home");
  };

  const handleGoShop = () => {
    router.push("/shop");
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              p: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            {/* Logo */}
            <Box sx={{ mb: 3 }}>
              <Image
                src="/images/natpi_logo.png"
                alt="NATPI & Corgi Farm and Pet Shop"
                width={160}
                height={60}
                style={{
                  objectFit: "contain",
                  maxWidth: "100%",
                  height: "auto",
                }}
                priority
              />
            </Box>

            {/* Error Message */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: colors.text.primary,
                mb: 2,
                fontSize: { xs: "1.5rem", sm: "2rem" },
              }}
            >
              ไม่พบหน้าที่คุณต้องการ
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: colors.text.secondary,
                mb: 4,
                lineHeight: 1.6,
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              ขออภัยครับ หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่มีอยู่จริง
              <br />
              กรุณาตรวจสอบ URL หรือลองหาสินค้าที่คุณต้องการในหน้าร้านค้า
            </Typography>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={handleGoHome}
                sx={{
                  backgroundColor: colors.primary.main,
                  color: colors.secondary.main,
                  fontWeight: "bold",
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: colors.primary.dark,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                กลับหน้าหลัก
              </Button>

              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={handleGoShop}
                sx={{
                  borderColor: colors.primary.main,
                  color: colors.primary.main,
                  fontWeight: "bold",
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: colors.primary.dark,
                    color: colors.primary.dark,
                    backgroundColor: `${colors.primary.main}10`,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                ไปหาสินค้า
              </Button>

              <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                sx={{
                  color: colors.text.secondary,
                  fontWeight: 500,
                  py: 1.5,
                  px: 3,
                  "&:hover": {
                    backgroundColor: `${colors.text.secondary}10`,
                  },
                }}
              >
                ย้อนกลับ
              </Button>
            </Box>

            {/* Additional Help */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${colors.background.default}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: colors.text.secondary,
                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                }}
              >
                หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อเราผ่าน LINE Official Account
                <br />
                <strong>@658jluqf</strong>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
