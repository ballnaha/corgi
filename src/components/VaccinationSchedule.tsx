"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
} from "@mui/material";
import {
  MedicalServices,
  Schedule,
  CheckCircle,
  PendingActions,
  CalendarToday,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { Product } from "@/types";
import { getVaccinationInfo, formatThaiDate, getVaccineStatusText, getNextVaccineDueText } from "@/lib/vaccination-utils";

interface VaccinationScheduleProps {
  product: Product;
}

export default function VaccinationSchedule({ product }: VaccinationScheduleProps) {
  if ((product.category !== "dogs" && product.category !== "cats") || !product.birthDate) {
    return null;
  }

  const birthDate = typeof product.birthDate === 'string' ? new Date(product.birthDate) : product.birthDate;
  const vaccinationInfo = getVaccinationInfo(
    birthDate,
    product.vaccineStatus as any,
    product.firstVaccineDate ? (typeof product.firstVaccineDate === 'string' ? new Date(product.firstVaccineDate) : product.firstVaccineDate) : null,
    product.secondVaccineDate ? (typeof product.secondVaccineDate === 'string' ? new Date(product.secondVaccineDate) : product.secondVaccineDate) : null
  );

  if (!vaccinationInfo) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="h6"
        sx={{
          color: colors.text.primary,
          fontWeight: "bold",
          fontSize: "1.1rem",
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MedicalServices 
          sx={{ 
            color: colors.primary.main, 
            fontSize: "1.3rem" 
          }} 
        />
        ตารางการฉีดวัคซีน{product.category === 'cats' ? ' (แมว)' : ' (สุนัข)'}
      </Typography>

      {/* Vaccination Status Summary */}
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: 3,
          p: 2.5,
          mb: 2,
          border: "2px solid rgba(178, 223, 219, 0.6)",
          boxShadow: "0 4px 12px rgba(178, 223, 219, 0.3)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: "#00695C",
            fontWeight: "700",
            fontSize: "1rem",
            mb: 1,
          }}
        >
          สถานะการฉีดวัคซีน
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {vaccinationInfo.status === 'SECOND_DONE' ? (
            <CheckCircle sx={{ color: "#4CAF50", fontSize: "1.2rem" }} />
          ) : vaccinationInfo.status === 'FIRST_DONE' ? (
            <Schedule sx={{ color: "#FF9800", fontSize: "1.2rem" }} />
          ) : (
            <PendingActions sx={{ color: "#FF9800", fontSize: "1.2rem" }} />
          )}
          <Typography
            variant="body2"
            sx={{
              color: vaccinationInfo.status === 'SECOND_DONE' ? "#2E7D32" : "#F57C00",
              fontWeight: "600",
            }}
          >
            {getVaccineStatusText(vaccinationInfo.status)}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: "#00695C",
            fontSize: "0.9rem",
          }}
        >
          {getNextVaccineDueText(vaccinationInfo)}
        </Typography>
      </Box>

      {/* Vaccination Schedule */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* First vaccine schedule */}
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: 3,
            p: 2.5,
            border: vaccinationInfo.status !== 'NONE' 
              ? "2px solid rgba(165, 214, 167, 0.6)" 
              : "2px solid rgba(255, 245, 157, 0.6)",
            boxShadow: vaccinationInfo.status !== 'NONE' 
              ? "0 4px 12px rgba(165, 214, 167, 0.3)" 
              : "0 4px 12px rgba(255, 245, 157, 0.3)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: vaccinationInfo.status !== 'NONE' ? "#2E7D32" : "#E65100",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                6-8 สัปดาห์ - เข็มที่ 1
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: vaccinationInfo.status !== 'NONE' ? "#1B5E20" : "#BF360C",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  mt: 0.5,
                }}
              >
                วัคซีเข็มที่ 1
              </Typography>
              
              {product.firstVaccineDate && vaccinationInfo.status !== 'NONE' && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#2E7D32",
                    fontSize: "0.8rem",
                    display: "block",
                    fontWeight: "600",
                  }}
                >
                  ฉีดแล้ววันที่: {formatThaiDate(typeof product.firstVaccineDate === 'string' ? new Date(product.firstVaccineDate) : product.firstVaccineDate)}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: "50%",
                p: 0.8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {vaccinationInfo.status !== 'NONE' ? (
                <CheckCircle 
                  sx={{ 
                    color: "#4CAF50", 
                    fontSize: "1.2rem" 
                  }} 
                />
              ) : (
                <Schedule 
                  sx={{ 
                    color: "#FF8F00", 
                    fontSize: "1.2rem" 
                  }} 
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Second vaccine schedule */}
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: 3,
            p: 2.5,
            border: vaccinationInfo.status === 'SECOND_DONE' 
              ? "2px solid rgba(165, 214, 167, 0.6)" 
              : "2px solid rgba(179, 229, 252, 0.6)",
            boxShadow: vaccinationInfo.status === 'SECOND_DONE' 
              ? "0 4px 12px rgba(165, 214, 167, 0.3)" 
              : "0 4px 12px rgba(179, 229, 252, 0.3)",
            opacity: vaccinationInfo.status === 'NONE' ? 0.7 : 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: vaccinationInfo.status === 'SECOND_DONE' ? "#2E7D32" : "#0D47A1",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                10-12 สัปดาห์ - เข็มที่ 2
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: vaccinationInfo.status === 'SECOND_DONE' ? "#1B5E20" : "#1565C0",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  mt: 0.5,
                }}
              >
                วัคซีนเข็มที่ 2
              </Typography>
              
              <Typography
                variant="caption"
                sx={{
                  color: vaccinationInfo.status === 'SECOND_DONE' ? "#2E7D32" : "#0D47A1",
                  fontSize: "0.8rem",
                  display: "block",
                  mt: 0.5,
                }}
              >
                กำหนด: {formatThaiDate(vaccinationInfo.schedule.secondVaccineDate!)}
              </Typography>
              {product.secondVaccineDate && vaccinationInfo.status === 'SECOND_DONE' && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#2E7D32",
                    fontSize: "0.8rem",
                    display: "block",
                    fontWeight: "600",
                  }}
                >
                  ฉีดแล้ววันที่: {formatThaiDate(typeof product.secondVaccineDate === 'string' ? new Date(product.secondVaccineDate) : product.secondVaccineDate)}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  color: vaccinationInfo.status === 'SECOND_DONE' ? "#2E7D32" : "#0D47A1",
                  fontSize: "0.8rem",
                  display: "block",
                  mt: 0.5,
                  fontStyle: "italic",
                }}
              >
                {vaccinationInfo.status !== 'SECOND_DONE' ? "ยังไม่ได้รับการฉีดวัคซีน" : null}
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: "50%",
                p: 0.8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {vaccinationInfo.status === 'SECOND_DONE' ? (
                <CheckCircle 
                  sx={{ 
                    color: "#4CAF50", 
                    fontSize: "1.2rem" 
                  }} 
                />
              ) : (
                <Schedule 
                  sx={{ 
                    color: "#2196F3", 
                    fontSize: "1.2rem" 
                  }} 
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Vaccination Notes */}
        {product.vaccineNotes && (
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 3,
              p: 2.5,
              border: "2px solid rgba(255, 204, 128, 0.6)",
              boxShadow: "0 4px 12px rgba(255, 204, 128, 0.3)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#E65100",
                fontSize: "0.8rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                display: "block",
                mb: 1,
              }}
            >
              📝 หมายเหตุการฉีดวัคซีน
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#BF360C",
                fontWeight: "600",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {product.vaccineNotes}
            </Typography>
          </Box>
        )}

        
      </Box>
    </Box>
  );
}
