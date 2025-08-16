"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleLiffNavigation(router, "/profile");
    handleMenuClose();
  };

  const handleSignOut = () => {
    signOut();
    handleMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: colors.background.paper,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: colors.text.primary,
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => handleLiffNavigation(router, "/")}
        >
          Oong-Oong Pet Shop
        </Typography>

        {session ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => handleLiffNavigation(router, '/favorites')} sx={{ color: colors.error }}>
              <FavoriteBorderIcon />
            </IconButton>
            <Typography
              variant="body2"
              sx={{ color: colors.text.secondary, display: { xs: "none", sm: "block" } }}
            >
              สวัสดี, {session.user?.name}
            </Typography>
            <IconButton onClick={handleMenuOpen}>
              <Avatar
                src={session.user?.image || ""}
                alt={session.user?.name || "User"}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <Avatar
                  src={session.user?.image || ""}
                  alt={session.user?.name || "User"}
                  sx={{ width: 24, height: 24, mr: 2 }}
                />
                โปรไฟล์
              </MenuItem>
              <MenuItem onClick={handleSignOut}>
                ออกจากระบบ
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={() => handleLiffNavigation(router, "/auth/signin")}
            sx={{
              color: colors.text.primary,
              borderColor: colors.text.disabled,
            }}
          >
            เข้าสู่ระบบ
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}