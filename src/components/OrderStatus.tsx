"use client";

import React from "react";
import { Box, Typography, Chip, LinearProgress, Paper } from "@mui/material";
import { OrderStatus as OrderStatusEnum } from "@prisma/client";
import { getStatusInfo, getStatusProgress, isFinalStatus, isCancelledStatus } from "@/lib/order-status";

interface OrderStatusProps {
  status: OrderStatusEnum;
  showProgress?: boolean;
  showDescription?: boolean;
  size?: "small" | "medium" | "large";
}

export default function OrderStatus({ 
  status, 
  showProgress = false, 
  showDescription = false,
  size = "medium" 
}: OrderStatusProps) {
  const statusInfo = getStatusInfo(status);
  const progress = getStatusProgress(status);
  const isFinal = isFinalStatus(status);
  const isCancelled = isCancelledStatus(status);

  const getChipSize = () => {
    switch (size) {
      case "small":
        return "small";
      case "large":
        return "medium";
      default:
        return "small";
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case "small":
        return "caption" as const;
      case "large":
        return "h6" as const;
      default:
        return "body2" as const;
    }
  };

  return (
    <Box>
      {/* Status Chip */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: showDescription ? 1 : 0 }}>
        <Chip
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <span>{statusInfo.icon}</span>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {statusInfo.label}
              </Typography>
            </Box>
          }
          sx={{
            backgroundColor: `${statusInfo.color}15`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}30`,
            fontWeight: 600,
            "& .MuiChip-label": {
              px: size === "large" ? 2 : 1,
              py: size === "large" ? 0.5 : 0.25,
            },
          }}
          size={getChipSize()}
        />

        {isFinal && !isCancelled && (
          <Chip
            label="✅ เสร็จสิ้น"
            size="small"
            sx={{
              backgroundColor: "#4CAF5015",
              color: "#4CAF50",
              border: "1px solid #4CAF5030",
            }}
          />
        )}
      </Box>

      {/* Status Description */}
      {showDescription && (
        <Typography 
          variant={getTypographyVariant()} 
          color="text.secondary"
          sx={{ mb: showProgress ? 1 : 0 }}
        >
          {statusInfo.description}
        </Typography>
      )}

      {/* Progress Bar */}
      {showProgress && !isCancelled && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              ความคืบหน้า
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "#f5f5f5",
              "& .MuiLinearProgress-bar": {
                backgroundColor: statusInfo.color,
                borderRadius: 3,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

// Component สำหรับแสดง Status พร้อม Timeline
interface OrderStatusTimelineProps {
  currentStatus: OrderStatusEnum;
  orderDetails?: {
    requiresDeposit: boolean;
    shippingMethod: string;
    paymentType: string;
  };
}

export function OrderStatusTimeline({ currentStatus, orderDetails }: OrderStatusTimelineProps) {
  // สร้าง timeline ตาม order type
  const getTimelineSteps = () => {
    const baseSteps = [
      OrderStatusEnum.PENDING,
      OrderStatusEnum.CONFIRMED,
    ];

    if (orderDetails?.requiresDeposit) {
      baseSteps.push(OrderStatusEnum.PAYMENT_PENDING, OrderStatusEnum.PAID);
    } else {
      baseSteps.push(OrderStatusEnum.PAID);
    }

    baseSteps.push(OrderStatusEnum.PREPARING);

    if (orderDetails?.shippingMethod?.includes("pickup") || orderDetails?.shippingMethod?.includes("รับด้วยตัวเอง")) {
      baseSteps.push(OrderStatusEnum.READY_FOR_PICKUP, OrderStatusEnum.COMPLETED);
    } else {
      baseSteps.push(OrderStatusEnum.SHIPPED, OrderStatusEnum.OUT_FOR_DELIVERY, OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED);
    }

    return baseSteps;
  };

  const timelineSteps = getTimelineSteps();
  const currentIndex = timelineSteps.indexOf(currentStatus);

  return (
    <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        สถานะการสั่งซื้อ
      </Typography>

      <Box sx={{ position: "relative" }}>
        {timelineSteps.map((step, index) => {
          const statusInfo = getStatusInfo(step);
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <Box key={step} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {/* Timeline Dot */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: isCompleted ? statusInfo.color : "#e0e0e0",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  position: "relative",
                  zIndex: 2,
                  border: isCurrent ? `3px solid ${statusInfo.color}40` : "none",
                }}
              >
                {isCompleted ? statusInfo.icon : index + 1}
              </Box>

              {/* Timeline Line */}
              {index < timelineSteps.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 19,
                    top: 40,
                    width: 2,
                    height: 40,
                    backgroundColor: index < currentIndex ? statusInfo.color : "#e0e0e0",
                    zIndex: 1,
                  }}
                />
              )}

              {/* Status Info */}
              <Box sx={{ ml: 2, flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: isCompleted ? 600 : 400,
                    color: isCompleted ? "text.primary" : "text.secondary",
                  }}
                >
                  {statusInfo.label}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {statusInfo.description}
                </Typography>
              </Box>

              {/* Current Status Indicator */}
              {isCurrent && (
                <Chip
                  label="ปัจจุบัน"
                  size="small"
                  sx={{
                    backgroundColor: `${statusInfo.color}15`,
                    color: statusInfo.color,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
