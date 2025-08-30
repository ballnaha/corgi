"use client";

import React from 'react';
import { Box, IconButton, Badge, useTheme, useMediaQuery } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { colors } from '@/theme/colors';
import BackToTop from './BackToTop';

interface FloatingActionsProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  showCart?: boolean;
}

export default function FloatingActions({ 
  cartItemCount = 0, 
  onCartClick,
  showCart = false 
}: FloatingActionsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box>
      {/* Back to Top Button */}
      <BackToTop />
      
      {/* Floating Cart Button - Positioned to not overlap with Back to Top */}
      {showCart && cartItemCount > 0 && (
        <IconButton
          onClick={onCartClick}
          sx={{
            position: "fixed",
            // Mobile: Stacked above back to top button
            // Desktop: Traditional bottom right position
            bottom: isMobile ? 100 : 100,
            right: isMobile ? 20 : 20,
            left: isMobile ? 'auto' : 'auto',
            backgroundColor: colors.primary.main,
            color: "white",
            width: 56,
            height: 56,
            zIndex: 999,
            boxShadow: "0 4px 20px rgba(255, 107, 53, 0.3)",
            "&:hover": {
              backgroundColor: colors.primary.dark,
              transform: "scale(1.1)"
            },
            transition: "all 0.2s ease"
          }}
        >
          <Badge 
            badgeContent={cartItemCount} 
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#f44336",
                color: "white",
                fontSize: "0.75rem",
                minWidth: 18,
                height: 18,
              },
            }}
          >
            <ShoppingCart fontSize="medium" />
          </Badge>
        </IconButton>
      )}
    </Box>
  );
}
