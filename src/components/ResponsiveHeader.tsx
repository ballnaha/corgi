"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  Tooltip
} from "@mui/material";
import { Menu, Close } from "@mui/icons-material";

const ResponsiveHeader: React.FC = () => {
  const router = useRouter();
  // User auth hooks removed - keeping consistent with LIFF
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Desktop user menu removed

  const handleShopNow = () => {
    router.push('/shop');
  };

  // Logout functionality removed - keeping consistent with LIFF

  // Desktop user menu functions removed


  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "white",
          py: 2,
          px: isMobile ? 2 : 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f0f0f0",
          minHeight: "70px",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
      >
        {/* Logo - Always center on mobile */}
        <Box sx={{ 
          display: "flex", 
          alignItems: "center",
          flex: isMobile ? "1" : "0 0 auto",
          justifyContent: isMobile ? "center" : "flex-start",
          ml: isMobile ? 0 : 5
        }}>
          <Box
            component="button"
            onClick={() => router.push('/')}
            sx={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <img 
              src="/images/natpi_logo.png" 
              alt="logo" 
              width={isMobile ? 140 : 160} 
              height={isMobile ? 50 : 60} 
              style={{ 
                objectFit: "contain",
                filter: "contrast(1.1) brightness(1.1)"
              }} 
            />
          </Box>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
            <Button
              variant="outlined"
              onClick={handleShopNow}
              sx={{
                borderColor: "#000",
                color: "#000",
                borderRadius: "20px",
                px: 3,
                py: 0.5,
                fontSize: "14px",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#FF6B35",
                  color: "#FF6B35"
                }
              }}
            >
              Shop Now
            </Button>


{/* Desktop user profile removed - keeping consistent with LIFF */}
          </Box>
        )}

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            sx={{
              position: "absolute",
              right: 16,
              color: "#333",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "rgba(255, 107, 53, 0.1)",
                color: "#FF6B35"
              }
            }}
          >
            {isMobileMenuOpen ? <Close /> : <Menu />}
          </IconButton>
        )}
      </Box>
      
      {/* Header Spacer - เพื่อป้องกันเนื้อหาซ้อนทับ header */}
      <Box sx={{ height: "70px" }} />

      {/* Mobile Menu Overlay */}
      {isMobile && (
        <Fade in={isMobileMenuOpen} mountOnEnter unmountOnExit>
          <Box
            onClick={() => setIsMobileMenuOpen(false)}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 998
            }}
          />
        </Fade>
      )}

      {/* Mobile Menu Dropdown */}
      {isMobile && (
        <Slide direction="down" in={isMobileMenuOpen} mountOnEnter unmountOnExit>
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: "white",
              borderBottom: "1px solid #f0f0f0",
              py: 2,
              px: 2,
              position: "fixed",
              top: "70px",
              left: 0,
              right: 0,
              width: "100%",
              zIndex: 999,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  handleShopNow();
                  setIsMobileMenuOpen(false);
                }}
                sx={{
                  borderColor: "#000",
                  color: "#000",
                  borderRadius: "20px",
                  py: 1,
                  fontSize: "14px",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#FF6B35",
                    color: "#FF6B35"
                  }
                }}
              >
                Shop Now
              </Button>


  {/* Mobile user profile removed - keeping consistent with LIFF */}
            </Box>
          </Box>
        </Slide>
      )}

{/* Desktop User Menu removed - keeping consistent with LIFF */}
    </>
  );
};

export default ResponsiveHeader;
