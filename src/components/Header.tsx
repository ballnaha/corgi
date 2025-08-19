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
} from "@mui/material";
import { Search, Tune } from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { colors } from "@/theme/colors";
import { useSession } from "next-auth/react";
import { useUserDisplayName } from "@/hooks/useUserDisplayName";
import Link from "next/link";
import Image from "next/image";

const MobileHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: colors.secondary.main,
  borderRadius: "0 0 24px 24px",
  marginBottom: theme.spacing(2),
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
}

export default function Header({
  cartItemCount = 0,
  onCartClick,
  onSearchChange,
}: HeaderProps) {
  const { data: session } = useSession();
  const { displayName, loading } = useUserDisplayName();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
