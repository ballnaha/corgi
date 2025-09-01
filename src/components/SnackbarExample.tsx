"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useThemedSnackbar } from "./ThemedSnackbar";
import { colors } from "@/theme/colors";

export default function SnackbarExample() {
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();

  const handleSuccess = () => {
    showSnackbar("การดำเนินการสำเร็จแล้ว!", "success");
  };

  const handleWarning = () => {
    showSnackbar("กรุณาตรวจสอบข้อมูลของคุณ", "warning");
  };

  const handleError = () => {
    showSnackbar("เกิดข้อผิดพลาดในการดำเนินการ", "error");
  };

  const handleInfo = () => {
    showSnackbar("ข้อมูลเพิ่มเติมสำหรับคุณ", "info");
  };

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 600,
        mx: "auto",
        backgroundColor: colors.background.paper,
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          color: colors.text.primary,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        ตัวอย่าง Themed Snackbar
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 2,
          "@media (max-width: 600px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        <Button
          variant="contained"
          onClick={handleSuccess}
          sx={{
            backgroundColor: colors.success,
            "&:hover": {
              backgroundColor: colors.success,
              opacity: 0.9,
            },
          }}
        >
          Success Message
        </Button>

        <Button
          variant="contained"
          onClick={handleWarning}
          sx={{
            backgroundColor: colors.warning,
            "&:hover": {
              backgroundColor: colors.warning,
              opacity: 0.9,
            },
          }}
        >
          Warning Message
        </Button>

        <Button
          variant="contained"
          onClick={handleError}
          sx={{
            backgroundColor: colors.error,
            "&:hover": {
              backgroundColor: colors.error,
              opacity: 0.9,
            },
          }}
        >
          Error Message
        </Button>

        <Button
          variant="contained"
          onClick={handleInfo}
          sx={{
            backgroundColor: colors.info,
            "&:hover": {
              backgroundColor: colors.info,
              opacity: 0.9,
            },
          }}
        >
          Info Message
        </Button>
      </Box>

      <Typography
        variant="body2"
        sx={{
          mt: 3,
          color: colors.text.secondary,
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        คลิกปุ่มเพื่อทดสอบ Snackbar แต่ละประเภท
      </Typography>

      {/* Snackbar Component */}
      <SnackbarComponent />
    </Box>
  );
}
