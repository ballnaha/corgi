"use client";

import React, { useState } from "react";
import {
  Typography,
  IconButton,
  Badge,
  Box,
  InputBase,
  Skeleton,
  Avatar,
  useMediaQuery,
  useTheme,
  Container,
  Button,
  Tooltip,
} from "@mui/material";
import { Search, Tune, ShoppingBag } from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { colors } from "@/theme/colors";
import { useSession, signIn } from "next-auth/react";
import { useUserDisplayName } from "@/hooks/useUserDisplayName";
import Link from "next/link";
import Image from "next/image";
import LineIcon from "./LineIcon";

const MobileHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: colors.secondary.main,
  borderRadius: "0 0 24px 24px",
  marginBottom: theme.spacing(2),
}));

const DesktopHeader = styled(Box)(({ theme }) => ({
  backgroundColor: colors.secondary.main,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  padding: theme.spacing(1, 0),
}));

const SearchBox = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: "16px",
  backgroundColor: colors.background.default,
  border: `1px solid ${alpha(colors.text.secondary, 0.2)}`,
  marginTop: theme.spacing(2),
  width: "100%",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.text.secondary,
}));

const FilterButton = styled(IconButton)({
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  backgroundColor: colors.primary.main,
  color: colors.secondary.main,
  width: 32,
  height: 32,
  "&:hover": {
    backgroundColor: colors.primary.dark,
  },
});

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: colors.text.primary,
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1.5, 6, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: "0.9rem",
    "&::placeholder": {
      color: colors.text.secondary,
      opacity: 1,
    },
  },
}));

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchChange?: (query: string) => void;
  showLogo?: boolean;
  logoSrc?: string;
}

export default function Header({
  cartItemCount = 0,
  onCartClick,
  onSearchChange,
  showLogo = false,
  logoSrc,
}: HeaderProps) {
  const { data: session } = useSession();
  const { displayName, loading } = useUserDisplayName();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen && searchQuery) {
      setSearchQuery("");
      onSearchChange?.("");
    }
  };

  const handleLineLogin = () => {
    signIn("line", { callbackUrl: "/shop" });
  };

  if (isMobile) {
    return (
      <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <MobileHeader>
          {/* Top row with profile and notification */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            {session?.user ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={session?.user?.image || undefined}
                  alt={displayName || "User Avatar"}
                  sx={{
                    width: 48,
                    height: 48,
                    background: session?.user?.image
                      ? "transparent"
                      : "linear-gradient(135deg, #FF6B35 0%, #F4511E 100%)",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {!session?.user?.image && (displayName?.charAt(0) || "U")}
                </Avatar>
                <Box>
                  {loading ? (
                    <Skeleton
                      variant="text"
                      width={120}
                      height={28}
                      sx={{
                        bgcolor: alpha(colors.text.secondary, 0.1),
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: colors.text.primary,
                        fontSize: "1.1rem",
                        mb: 0,
                      }}
                    >
                      สวัสดี! {displayName}
                    </Typography>
                  )}
                  <Link href="/profile" style={{ textDecoration: "none" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        "&:hover": {
                          color: colors.primary.main,
                        },
                      }}
                    >
                      การซื้อของฉัน
                    </Typography>
                  </Link>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleLineLogin}
                  sx={{
                    backgroundColor: "#00B900",
                    color: "white",
                    borderRadius: "20px",
                    py: 1,
                    px: 2,
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    textTransform: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    boxShadow: "0 2px 8px rgba(0, 185, 0, 0.3)",
                    "&:hover": {
                      backgroundColor: "#009900",
                      boxShadow: "0 4px 12px rgba(0, 185, 0, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease"
                  }}
                >
                  <LineIcon sx={{ fontSize: "1rem" }} />
                  เข้าสู่ระบบ
                </Button>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                onClick={handleSearchToggle}
                sx={{
                  backgroundColor: colors.background.default,
                  color: colors.text.secondary,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    backgroundColor: colors.background.accent,
                  },
                }}
              >
                <Search fontSize="small" />
              </IconButton>

              <IconButton
                onClick={onCartClick}
                sx={{
                  backgroundColor: colors.background.default,
                  color: colors.text.secondary,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    backgroundColor: colors.background.accent,
                  },
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: colors.primary.main,
                      color: colors.secondary.main,
                      fontSize: "0.7rem",
                      minWidth: 16,
                      height: 16,
                    },
                  }}
                >
                  <Image
                    src="/images/icon-cart.png"
                    alt="Shopping Cart"
                    width={20}
                    height={20}
                    style={{
                      filter: "brightness(0) saturate(100%) invert(44%) sepia(5%) saturate(629%) hue-rotate(314deg) brightness(92%) contrast(95%)",
                    }}
                  />
                </Badge>
              </IconButton>
            </Box>
          </Box>

          {/* Search Bar - Only show when isSearchOpen is true */}
          {isSearchOpen && (
            <SearchBox>
              <SearchIconWrapper>
                <Search />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search a pet"
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
              <FilterButton>
                <Tune fontSize="small" />
              </FilterButton>
            </SearchBox>
          )}
        </MobileHeader>
      </Box>
    );
  }

  // Desktop Header
  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1100 }}>
      <DesktopHeader>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1,
            }}
          >
            {/* Left side - Logo or Brand */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {showLogo && logoSrc ? (
                <Image
                  src={logoSrc}
                  alt="Logo"
                  width={140}
                  height={60}
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    color: colors.primary.main,
                    fontSize: "1.5rem",
                  }}
                >
                  🐕 Corgi Shop
                </Typography>
              )}
              
              {/* Search Bar */}
              <SearchBox sx={{ width: 300, mt: 0 }}>
                <SearchIconWrapper>
                  <Search />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="ค้นหาสัตว์เลี้ยง..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </SearchBox>
            </Box>

            {/* Right side - Navigation & User */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              
              {/* LINE Login Icon for Desktop - Show only when not logged in */}
              {!session?.user && (
                <Tooltip 
                  title="เข้าสู่ระบบด้วย LINE" 
                  arrow
                  placement="bottom"
                >
                  <IconButton
                    onClick={handleLineLogin}
                    sx={{
                      color: "#00B900",
                      backgroundColor: colors.background.default,
                      width: 48,
                      height: 48,
                      "&:hover": {
                        color: "#009900",
                        backgroundColor: "rgba(0, 185, 0, 0.1)",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease"
                    }}
                  >
                    <LineIcon sx={{ fontSize: "1.5rem" }} />
                  </IconButton>
                </Tooltip>
              )}

              {/* Cart */}
              <IconButton
                onClick={onCartClick}
                sx={{
                  backgroundColor: colors.background.default,
                  color: colors.text.secondary,
                  width: 48,
                  height: 48,
                  "&:hover": {
                    backgroundColor: colors.background.accent,
                  },
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: colors.primary.main,
                      color: colors.secondary.main,
                      fontSize: "0.75rem",
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  <Image
                    src="/images/icon-cart.png"
                    alt="Shopping Cart"
                    width={24}
                    height={24}
                    style={{
                      filter: "brightness(0) saturate(100%) invert(44%) sepia(5%) saturate(629%) hue-rotate(314deg) brightness(92%) contrast(95%)",
                    }}
                  />
                </Badge>
              </IconButton>

              {/* User Avatar and Name - Show only when logged in */}
              {session?.user && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    src={session?.user?.image || undefined}
                    alt={displayName || "User Avatar"}
                    sx={{
                      width: 40,
                      height: 40,
                      background: session?.user?.image
                        ? "transparent"
                        : "linear-gradient(135deg, #FF6B35 0%, #F4511E 100%)",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {!session?.user?.image && (displayName?.charAt(0) || "U")}
                  </Avatar>
                  
                  {loading ? (
                    <Skeleton
                      variant="text"
                      width={100}
                      height={24}
                      sx={{
                        bgcolor: alpha(colors.text.secondary, 0.1),
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: colors.text.primary,
                        fontSize: "0.95rem",
                      }}
                    >
                      สวัสดี! {displayName}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </DesktopHeader>
    </Box>
  );
}
