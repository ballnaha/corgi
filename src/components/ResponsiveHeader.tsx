"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Typography, 
  Button, 
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  Menu as MuiMenu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from "@mui/material";
import { ShoppingCart, Logout, Menu, Close, Person, AccountCircle } from "@mui/icons-material";
import { useSession, signOut, signIn } from "next-auth/react";
import { clearAuthCookies, logoutLiffIfAvailable, handleLiffNavigation } from "@/lib/liff-navigation";
import { useUserDisplayName } from "@/hooks/useUserDisplayName";
import LineIcon from "./LineIcon";

interface ResponsiveHeaderProps {
  showCartIcon?: boolean;
  onCartClick?: () => void;
  cartItemCount?: number;
}

const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  showCartIcon = false,
  onCartClick,
  cartItemCount = 0
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { displayName, loading: userLoading } = useUserDisplayName();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Desktop user menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const isUserMenuOpen = Boolean(userMenuAnchor);

  const handleShopNow = () => {
    router.push('/shop');
  };

  const handleLogout = async () => {
    try {
      await clearAuthCookies();
      await signOut({ redirect: false });
      await logoutLiffIfAvailable();
      handleLiffNavigation(router, '/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    router.push('/profile');
  };

  const handleLogoutClick = () => {
    handleUserMenuClose();
    handleLogout();
  };

  const handleLineLogin = () => {
    signIn("line", { callbackUrl: "/shop" });
  };

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
                    padding: "8px",
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

            {/* Cart Icon for Desktop */}
            {showCartIcon && (
              <IconButton
                onClick={onCartClick}
                sx={{
                  color: "#333",
                  position: "relative",
                  "&:hover": {
                    color: "#FF6B35",
                    backgroundColor: "rgba(255, 107, 53, 0.1)",
                  }
                }}
              >
                <ShoppingCart />
                {cartItemCount > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      backgroundColor: "#FF6B35",
                      color: "white",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                      border: "1px solid white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Box>
                )}
              </IconButton>
            )}

            {session?.user && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>


                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{
                    p: 0,
                    "&:hover": {
                      backgroundColor: "rgba(255, 107, 53, 0.1)",
                    },
                    transition: "all 0.2s ease"
                  }}
                  title="เมนูผู้ใช้"
                >
                  <Avatar
                    src={session.user.image || undefined}
                    alt={displayName || "User Avatar"}
                    sx={{
                      width: 40,
                      height: 40,
                      background: session.user.image
                        ? "transparent"
                        : "linear-gradient(135deg, #FF6B35 0%, #F4511E 100%)",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    {!session.user.image && (displayName?.charAt(0) || "U")}
                  </Avatar>
                </IconButton>
                {!userLoading && (
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: "#333",
                      fontSize: "0.95rem"
                    }}
                  >
                    สวัสดี! {displayName}
                  </Typography>
                )}
              </Box>
            )}
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

              {/* Cart for Mobile */}
              {showCartIcon && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    onCartClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{
                    borderColor: "#000",
                    color: "#000",
                    borderRadius: "20px",
                    py: 1,
                    fontSize: "14px",
                    textTransform: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                      borderColor: "#FF6B35",
                      color: "#FF6B35"
                    }
                  }}
                >
                  <ShoppingCart fontSize="small" />
                  ตรวจสอบตะกร้า
                  {cartItemCount > 0 && (
                    <Box
                      sx={{
                        backgroundColor: "#FF6B35",
                        color: "white",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                        ml: 1,
                        border: "1px solid white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }}
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Box>
                  )}
                </Button>
              )}

              {/* LINE Login for Mobile - Show only when not logged in */}
              {!session?.user && (
                <Button
                  variant="contained"
                  onClick={() => {
                    handleLineLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{
                    backgroundColor: "#00B900",
                    color: "white",
                    borderRadius: "20px",
                    py: 1.2,
                    px: 2,
                    fontSize: "14px",
                    fontWeight: "500",
                    textTransform: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    boxShadow: "0 2px 8px rgba(0, 185, 0, 0.3)",
                    "&:hover": {
                      backgroundColor: "#009900",
                      boxShadow: "0 4px 12px rgba(0, 185, 0, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease"
                  }}
                >
                  <LineIcon sx={{ fontSize: "1.2rem" }} />
                  เข้าสู่ระบบด้วย LINE
                </Button>
              )}

              {session?.user && (
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  p: 2,
                  backgroundColor: "#f8f9fa",
                  borderRadius: "12px"
                }}>
                  <Avatar
                    src={session.user.image || undefined}
                    alt={displayName || "User Avatar"}
                    sx={{
                      width: 36,
                      height: 36,
                      background: session.user.image
                        ? "transparent"
                        : "linear-gradient(135deg, #FF6B35 0%, #F4511E 100%)",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    {!session.user.image && (displayName?.charAt(0) || "U")}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    {!userLoading && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "#333",
                          fontSize: "0.9rem"
                        }}
                      >
                        สวัสดี! {displayName}
                      </Typography>
                    )}
                  </Box>

                  <IconButton
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    sx={{
                      color: "#666",
                      "&:hover": {
                        color: "#FF6B35",
                        backgroundColor: "rgba(255, 107, 53, 0.1)",
                      }
                    }}
                    title="ออกจากระบบ"
                  >
                    <Logout fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Slide>
      )}

      {/* Desktop User Menu */}
      <MuiMenu
        anchorEl={userMenuAnchor}
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #f0f0f0'
          }
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              โปรไฟล์
            </Typography>
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#f44336' }}>
              ออกจากระบบ
            </Typography>
          </ListItemText>
        </MenuItem>
      </MuiMenu>
    </>
  );
};

export default ResponsiveHeader;
