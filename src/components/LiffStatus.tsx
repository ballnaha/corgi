"use client";

import { useLiff } from "@/hooks/useLiff";
import { useSession } from "next-auth/react";
import { Box, Chip } from "@mui/material";

export default function LiffStatus() {
  const { isInLiff, isLoggedIn, isReady } = useLiff();
  const { data: session } = useSession();

  if (!isReady) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 1000,
        display: "flex",
        gap: 1,
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <Chip
        label={isInLiff ? "LIFF Mode" : "Web Mode"}
        color={isInLiff ? "primary" : "default"}
        size="small"
        variant="outlined"
      />
      
      {isInLiff && (
        <Chip
          label={isLoggedIn ? "LINE Logged In" : "LINE Not Logged In"}
          color={isLoggedIn ? "success" : "error"}
          size="small"
          variant="outlined"
        />
      )}
      
      <Chip
        label={session ? "NextAuth Active" : "NextAuth Inactive"}
        color={session ? "success" : "warning"}
        size="small"
        variant="outlined"
      />
    </Box>
  );
}