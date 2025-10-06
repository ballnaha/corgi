"use client";

import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useRouter } from "next/navigation";
import { Box, Avatar, Typography, Button } from "@mui/material";
import { colors } from "@/theme/colors";

export default function UserProfile() {
  const { user, isAuthenticated, logout } = useSimpleAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) {
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
        src={user.pictureUrl || undefined}
        alt={user.displayName || "User"}
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
          {user.displayName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: colors.text.secondary,
          }}
        >
          LINE ID: {user.lineUserId}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={async () => {
          try { sessionStorage.setItem('skip_liff_auto_login','1'); } catch {}
          logout();
          router.push('/shop');
        }}
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