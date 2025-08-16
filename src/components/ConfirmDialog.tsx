"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { Warning, Close } from "@mui/icons-material";
import { colors } from "@/theme/colors";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: "warning" | "error" | "info";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  severity = "warning",
  loading = false,
}: ConfirmDialogProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case "error":
        return colors.error;
      case "info":
        return colors.primary.main;
      case "warning":
      default:
        return colors.warning;
    }
  };

  const getSeverityIcon = () => {
    return <Warning sx={{ fontSize: 48, color: getSeverityColor() }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            disabled={loading}
            sx={{ color: colors.text.secondary }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center", py: 3 }}>
        <Box sx={{ mb: 2 }}>
          {getSeverityIcon()}
        </Box>
        <Typography variant="body1" sx={{ color: colors.text.primary }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            flex: 1,
            borderColor: colors.text.disabled,
            color: colors.text.secondary,
            "&:hover": {
              borderColor: colors.text.secondary,
              backgroundColor: "rgba(0,0,0,0.04)",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          sx={{
            flex: 1,
            backgroundColor: getSeverityColor(),
            "&:hover": {
              backgroundColor: severity === "error" 
                ? colors.error + "dd" 
                : severity === "info"
                ? colors.primary.dark
                : colors.warning + "dd",
            },
          }}
        >
          {loading ? "กำลังดำเนินการ..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}