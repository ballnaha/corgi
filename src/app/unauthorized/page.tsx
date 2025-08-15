"use client";

import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Lock, ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { colors } from "@/theme/colors";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%)",
        p: 3,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          textAlign: "center",
          maxWidth: 500,
          width: "100%",
          backgroundColor: colors.secondary.main,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#FFF3E0",
            mx: "auto",
          }}
        >
          <Lock
            sx={{
              fontSize: 40,
              color: "#F57C00",
            }}
          />
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: colors.text.primary,
            mb: 2,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          ไม่มีสิทธิ์เข้าถึง
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: colors.text.secondary,
            mb: 4,
            fontSize: { xs: "0.875rem", sm: "1rem" },
            lineHeight: 1.6,
          }}
        >
          คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
          <br />
          กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่านี่เป็นข้อผิดพลาด
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{
              borderColor: colors.primary.main,
              color: colors.primary.main,
              "&:hover": {
                borderColor: colors.primary.dark,
                backgroundColor: `${colors.primary.main}10`,
              },
              py: 1.5,
              px: 3,
              borderRadius: 3,
            }}
          >
            ย้อนกลับ
          </Button>

          <Button
            variant="contained"
            onClick={() => router.push("/")}
            sx={{
              backgroundColor: colors.primary.main,
              color: colors.secondary.main,
              "&:hover": {
                backgroundColor: colors.primary.dark,
              },
              py: 1.5,
              px: 3,
              borderRadius: 3,
              boxShadow: `0 4px 12px ${colors.primary.main}30`,
            }}
          >
            กลับหน้าหลัก
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
