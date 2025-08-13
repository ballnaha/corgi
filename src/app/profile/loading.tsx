import { Box, Typography, CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography>กำลังโหลดโปรไฟล์...</Typography>
    </Box>
  );
}