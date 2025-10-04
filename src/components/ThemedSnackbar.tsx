"use client";

import React from "react";
import { Snackbar, Alert, SnackbarProps, AlertProps, Slide } from "@mui/material";
import { colors } from "@/theme/colors";

interface ThemedSnackbarProps {
  open: boolean;
  message: string;
  severity: "success" | "warning" | "error" | "info";
  onClose: () => void;
  autoHideDuration?: number;
  anchorOrigin?: SnackbarProps["anchorOrigin"];
  showIcon?: boolean;
  variant?: AlertProps["variant"];
}

const SlideUpTransition = React.forwardRef<
  unknown,
  { children: React.ReactElement<any, any> }
>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ThemedSnackbar({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 3000,
  anchorOrigin = { vertical: "top", horizontal: "center" },
  showIcon = false,
  variant = "standard",
}: ThemedSnackbarProps) {
  // Get themed colors based on severity
  const getSnackbarColors = (severity: string) => {
    switch (severity) {
      case "success":
        return {
          shadowColor: "rgba(34, 139, 34, 0.3)", // เงาเขียวเข้ม
          backgroundColor: "rgba(255, 255, 255, 0.8)", // พื้นขาวแก้ว
          color: "#1B5E20", // เขียวเข้ม (Dark Green)
          borderColor: "rgba(76, 175, 80, 0.3)", // ขอบเขียวอ่อน
        };
      case "warning":
        return {
          shadowColor: "rgba(255, 152, 0, 0.25)",
          backgroundColor: `${colors.warning}15`,
          color: colors.warning,
          borderColor: `${colors.warning}40`,
        };
      case "error":
        return {
          shadowColor: "rgba(244, 67, 54, 0.25)",
          backgroundColor: `${colors.error}15`,
          color: colors.error,
          borderColor: `${colors.error}40`,
        };
      case "info":
      default:
        return {
          shadowColor: "rgba(33, 150, 243, 0.25)",
          backgroundColor: `${colors.info}15`,
          color: colors.info,
          borderColor: `${colors.info}40`,
        };
    }
  };

  const snackbarColors = getSnackbarColors(severity);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      TransitionComponent={SlideUpTransition}
      sx={{ 
        pointerEvents: "none",
        zIndex: (theme) => theme.zIndex.snackbar + 1
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant={variant}
        icon={showIcon}
        sx={{
          pointerEvents: "all",
          width: "auto",
          minWidth: "300px",
          maxWidth: "min(480px, calc(100vw - 32px))",
          px: 3,
          py: 1.5,
          borderRadius: 3,
          overflow: "hidden",
          overflowX: "hidden",
          overflowY: "hidden",
          
          // Modern shadow with theme colors - เพิ่ม shadow สำหรับ success
          ...(severity === "success" ? {
            boxShadow: `0 12px 40px ${snackbarColors.shadowColor}, 0 4px 12px rgba(27, 94, 32, 0.15), 0 1px 4px rgba(255,255,255,0.8) inset`,
          } : {
            boxShadow: `0 8px 32px ${snackbarColors.shadowColor}, 0 2px 8px rgba(0,0,0,0.05)`,
          }),
          
          // Glassmorphism effect - เพิ่ม blur สำหรับ success
          ...(severity === "success" ? {
            backdropFilter: "saturate(200%) blur(25px)",
            WebkitBackdropFilter: "saturate(200%) blur(25px)",
          } : {
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
          }),
          
          // Background with theme colors - liquid glass สำหรับ success
          backgroundColor: snackbarColors.backgroundColor,
          ...(severity === "success" ? {
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 50%, rgba(248,255,248,0.8) 100%)`,
          } : {
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)`,
          }),
          backgroundBlendMode: "overlay",
          
          // Text color
          color: snackbarColors.color,
          
          // Text styling สำหรับ success
          ...(severity === "success" ? {
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(27, 94, 32, 0.1)",
          } : {
            fontWeight: 500,
          }),
          
          // Border with theme colors
          border: `1px solid ${snackbarColors.borderColor}`,
          
          // Typography
          fontSize: "0.95rem",
          fontFamily: "Prompt, sans-serif",
          
          // Icon styling
          "& .MuiAlert-icon": {
            color: snackbarColors.color,
            fontSize: "1.3rem",
          },
          
          // Close button styling
          "& .MuiAlert-action": {
            "& .MuiIconButton-root": {
              color: snackbarColors.color,
              opacity: 0.8,
              "&:hover": {
                opacity: 1,
                backgroundColor: `${snackbarColors.color}10`,
              },
            },
          },
          
          // Message styling
          "& .MuiAlert-message": {
            padding: 0,
            fontSize: "inherit",
            fontWeight: "inherit",
            lineHeight: 1.4,
            wordWrap: "break-word",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          },
          
          // Animation
          animation: "slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes slideInFromTop": {
            "0%": {
              transform: "translateY(-100px)",
              opacity: 0,
            },
            "100%": {
              transform: "translateY(0)",
              opacity: 1,
            },
          },
          
          // Mobile responsive
          "@media (max-width: 600px)": {
            minWidth: "280px",
            maxWidth: "calc(100vw - 24px)",
            px: 2,
            py: 1.25,
            fontSize: "0.9rem",
            overflow: "hidden",
            "& .MuiAlert-message": {
              wordWrap: "break-word",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              lineHeight: 1.3,
            },
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

// Hook for easier usage
export const useThemedSnackbar = () => {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info" as "success" | "warning" | "error" | "info",
  });

  const showSnackbar = React.useCallback((
    message: string, 
    severity: "success" | "warning" | "error" | "info" = "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const hideSnackbar = React.useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const SnackbarComponent = React.useCallback(() => (
    <ThemedSnackbar
      open={snackbar.open}
      message={snackbar.message}
      severity={snackbar.severity}
      onClose={hideSnackbar}
    />
  ), [snackbar.open, snackbar.message, snackbar.severity, hideSnackbar]);

  return {
    showSnackbar,
    hideSnackbar,
    SnackbarComponent,
  };
};
