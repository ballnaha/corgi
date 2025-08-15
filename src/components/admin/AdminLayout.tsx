"use client";

import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  People,
  ShoppingCart,
  Settings,
  ExitToApp,
  ChevronLeft,
  Notifications,
  Add,
  Edit,
  Assessment,
} from "@mui/icons-material";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

const DRAWER_WIDTH = 280;

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    path: "/admin",
    icon: <Dashboard />,
  },
  {
    title: "จัดการสินค้า",
    path: "/admin/products",
    icon: <Inventory />,
    children: [
      {
        title: "รายการสินค้า",
        path: "/admin/products",
        icon: <Inventory />,
      },
      {
        title: "เพิ่มสินค้าใหม่",
        path: "/admin/products/new",
        icon: <Add />,
      },
    ],
  },
  {
    title: "จัดการคำสั่งซื้อ",
    path: "/admin/orders",
    icon: <ShoppingCart />,
    badge: 5, // จำนวน pending orders
  },
  {
    title: "จัดการผู้ใช้",
    path: "/admin/users",
    icon: <People />,
  },
  {
    title: "รายงาน",
    path: "/admin/reports",
    icon: <Assessment />,
  },
  {
    title: "ตั้งค่า",
    path: "/admin/settings",
    icon: <Settings />,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigate = (path: string) => {
    handleLiffNavigation(router, path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    handleLiffNavigation(router, "/");
    handleUserMenuClose();
  };

  const isActivePath = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  const DrawerContent = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo/Header */}
      <Box
        sx={{
          p: 3,
          backgroundColor: colors.primary.main,
          color: colors.secondary.main,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: colors.secondary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          🐕
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
            CorgiShop
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List sx={{ p: 1 }}>
          {navigationItems.map((item) => (
            <React.Fragment key={item.path}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: isActivePath(item.path)
                      ? `${colors.primary.main}15`
                      : "transparent",
                    color: isActivePath(item.path)
                      ? colors.primary.main
                      : colors.text.primary,
                    "&:hover": {
                      backgroundColor: `${colors.primary.main}10`,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActivePath(item.path)
                        ? colors.primary.main
                        : colors.text.secondary,
                      minWidth: 40,
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: isActivePath(item.path) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Sub-navigation items */}
              {item.children &&
                isActivePath(item.path) &&
                item.children.map((child) => (
                  <ListItem key={child.path} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigate(child.path)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        ml: 2,
                        backgroundColor: pathname === child.path
                          ? `${colors.primary.main}20`
                          : "transparent",
                        color: pathname === child.path
                          ? colors.primary.main
                          : colors.text.secondary,
                        "&:hover": {
                          backgroundColor: `${colors.primary.main}10`,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: pathname === child.path
                            ? colors.primary.main
                            : colors.text.secondary,
                          minWidth: 35,
                        }}
                      >
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={child.title}
                        primaryTypographyProps={{
                          fontSize: "0.85rem",
                          fontWeight: pathname === child.path ? 600 : 400,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* User info at bottom */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: colors.background.default,
          }}
        >
          <Avatar
            src={session?.user?.image || ""}
            sx={{ width: 32, height: 32 }}
          >
            {session?.user?.name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {session?.user?.displayName || session?.user?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: colors.text.secondary, lineHeight: 1.2 }}
            >
              {session?.user?.role || "ADMIN"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: colors.secondary.main,
          color: colors.text.primary,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {pathname === "/admin"
              ? "Dashboard"
              : navigationItems.find((item) => isActivePath(item.path))?.title ||
                "Admin Panel"}
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* User menu */}
          <IconButton onClick={handleUserMenuOpen} color="inherit">
            <Avatar
              src={session?.user?.image || ""}
              sx={{ width: 32, height: 32 }}
            >
              {session?.user?.name?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <MenuItem onClick={() => handleNavigate("/profile")}>
              <ListItemIcon>
                <People fontSize="small" />
              </ListItemIcon>
              โปรไฟล์
            </MenuItem>
            <MenuItem onClick={() => handleNavigate("/admin/settings")}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              ตั้งค่า
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              ออกจากระบบ
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          <DrawerContent />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          <DrawerContent />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          backgroundColor: colors.background.default,
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
