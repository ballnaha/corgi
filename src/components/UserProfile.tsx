"use client";

import { useSession, signOut } from "next-auth/react";
import { Box, Avatar, Typography, Button } from "@mui/material";
import { colors } from "@/theme/colors";

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        backgroundColor: colors.background.paper,
        borderRadius: 2,
        mb: 2,
      }}
    >
      <Avatar
        src={session.user?.image || ""}
        alt={session.user?.name || "User"}
        sx={{ width: 48, height: 48 }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: colors.text.primary,
            fontWeight: "bold",
          }}
        >
          {session.user?.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: colors.text.secondary,
          }}
        >
          LINE ID: {session.user?.lineUserId}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={() => signOut()}
        sx={{
          color: colors.text.secondary,
          borderColor: colors.text.disabled,
        }}
      >
        ออกจากระบบ
      </Button>
    </Box>
  );
}