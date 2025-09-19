"use client";

import React from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  Slide,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Link,
  Drawer,
  Divider,
  Tooltip,
  Container,
} from "@mui/material";
import type { SlideProps } from "@mui/material";
import {
  ArrowBack,
  Edit,
  Email,
  Phone,
  Close,
  Save,
  Person,
  Message,
  Payment,
  Receipt,
  Info,
  LocalShipping,
  Schedule,
  ClearAll,
  LogoutOutlined,
  PowerSettingsNew,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { useLiff } from "@/hooks/useLiff";
import { generateSlug } from "@/lib/products";
import { handleLiffNavigation } from "@/lib/liff-navigation";
// Removed unused EditProfileDialog

interface UserData {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  statusMessage?: string | null;
  createdAt: Date | string;
  lastLoginAt: Date | string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    breed?: string | null;
    gender?: string | null;
    age?: string | null;
  };
}

interface PaymentNotification {
  id: string;
  transferAmount: number;
  transferDate: Date | string;
  paymentSlipData?: string | null;
  paymentSlipMimeType?: string | null;
  paymentSlipFileName?: string | null;
  submittedAt: Date | string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: Date | string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingFee?: number;
  discountAmount?: number;
  paymentType?: string;
  depositAmount?: number | null;
  remainingAmount?: number | null;
  adminComment?: string | null;
  paymentNotifications?: PaymentNotification[];
  items: OrderItem[];
}

export default function ProfilePage() {
  const SlideUpTransition = React.forwardRef(function SlideUpTransition(
    props: SlideProps,
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  const { data: session, status } = useSession();
  const { isInLiff, getProfile } = useLiff();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<
    { key: string; name: string; icon?: string }[]
  >([]);
  const [statusFilter, setStatusFilter] = useState("all");
  // Bottom navigation is now global in RootLayout
  const [dataFetched, setDataFetched] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    statusMessage: "",
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [snackbarKey, setSnackbarKey] = useState<number>(0);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoadingUser(true);
      // Get additional LINE profile data if in LIFF
      let lineProfile = null;
      if (isInLiff) {
        try {
          lineProfile = await getProfile();
        } catch (error) {
          console.warn("Could not get LIFF profile:", error);
        }
      }

      // Fetch user data from our API
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserData({
          ...data,
          statusMessage: lineProfile?.statusMessage || data.statusMessage,
        });
      } else {
        console.warn(
          "User not found in database. This should not happen as users are created during login."
        );
        // User should already exist from login process, but fallback to session data
        setUserData({
          id: session?.user?.id || "",
          lineUserId: session?.user?.lineUserId || "",
          displayName: session?.user?.name || "",
          pictureUrl: session?.user?.image || null,
          email: session?.user?.email || null,
          phoneNumber: null,
          statusMessage: lineProfile?.statusMessage || null,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingUser(false);
    }
  }, [isInLiff, getProfile]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch("/api/user/orders");

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        console.error("Failed to fetch orders, status:", response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch("/api/categories");
      if (!res.ok) return;
      const cats = await res.json();
      // Ensure only needed fields and order stable
      const categoryList = cats
        .filter((c: any) =>
          ["dogs", "cats", "birds", "fish", "toys", "food"].includes(c.key)
        )
        .map((c: any) => ({ key: c.key, name: c.name, icon: c.icon }))
        // Keep the visual order similar to existing UI
        .sort((a: any, b: any) => {
          const order = ["dogs", "cats", "birds", "fish", "toys"];
          return order.indexOf(a.key) - order.indexOf(b.key);
        });
      setCategories(categoryList);
    } catch (e) {
      // ignore
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || status === "loading" || dataFetched) return;

    // Only fetch data once when component mounts and session is available
    if (mounted && session && status === "authenticated") {
      fetchUserData();
      fetchOrders();
      fetchCategories();
      setDataFetched(true);
    }
  }, [mounted, session, status, dataFetched]);

  const handleUpdateProfile = async (updatedData: {
    displayName: string;
    email: string;
    phoneNumber: string;
    statusMessage: string;
  }) => {
    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
        setEditDialogOpen(false);
        setSnackbar({
          open: true,
          message: "บันทึกข้อมูลโปรไฟล์สำเร็จ!",
          severity: "success",
        });
        setSnackbarKey((k) => k + 1);
      } else {
        setSnackbar({
          open: true,
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          severity: "error",
        });
        setSnackbarKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
    }
  };

  const handleEditClick = () => {
    if (userData) {
      setEditForm({
        displayName: userData.displayName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        statusMessage: userData.statusMessage || "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleFormSubmit = () => {
    handleUpdateProfile(editForm);
  };

  const handleOrderDetailOpen = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleOrderDetailClose = () => {
    setOrderDetailOpen(false);
    setSelectedOrder(null);
  };

  const handleProductClick = (product: OrderItem["product"]) => {
    // Use the same generateSlug function as homepage
    const slug = generateSlug(product.name, product.id);
    handleLiffNavigation(router, `/product/${slug}`);
  };

  const handleClearLineCache = async () => {
    try {
      setSnackbar({
        open: true,
        message: "กำลังล้าง LINE Cache...",
        severity: "info",
      });
      setSnackbarKey((k) => k + 1);

      // Call API to clear LINE cache
      const response = await fetch("/api/auth/clear-line-cache", {
        method: "POST",
      });

      if (response.ok) {
        // Clear LINE-specific localStorage items
        Object.keys(localStorage).forEach((key) => {
          if (
            key.includes("line") ||
            key.includes("auth") ||
            key.includes("liff")
          ) {
            localStorage.removeItem(key);
          }
        });

        // Clear LINE-specific sessionStorage items
        Object.keys(sessionStorage).forEach((key) => {
          if (
            key.includes("line") ||
            key.includes("auth") ||
            key.includes("liff")
          ) {
            sessionStorage.removeItem(key);
          }
        });

        setSnackbar({
          open: true,
          message: "ล้าง LINE Cache สำเร็จ!",
          severity: "success",
        });
        setSnackbarKey((k) => k + 1);
      } else {
        throw new Error("Failed to clear LINE cache");
      }
    } catch (error) {
      console.error("Error clearing LINE cache:", error);
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการล้าง LINE Cache",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
    }
  };

  const handleLogout = async () => {
    try {
      setSnackbar({
        open: true,
        message: "กำลังออกจากระบบและล้างข้อมูล...",
        severity: "info",
      });
      setSnackbarKey((k) => k + 1);

      // Clear LINE cache first
      try {
        const response = await fetch("/api/auth/clear-line-cache", {
          method: "POST",
        });

        if (response.ok) {
          // Clear LINE-specific localStorage items
          Object.keys(localStorage).forEach((key) => {
            if (
              key.includes("line") ||
              key.includes("auth") ||
              key.includes("liff")
            ) {
              localStorage.removeItem(key);
            }
          });

          // Clear LINE-specific sessionStorage items
          Object.keys(sessionStorage).forEach((key) => {
            if (
              key.includes("line") ||
              key.includes("auth") ||
              key.includes("liff")
            ) {
              sessionStorage.removeItem(key);
            }
          });
        }
      } catch (lineError) {
        console.warn("Could not clear LINE cache:", lineError);
      }

      // Clear NextAuth session
      await signOut({ redirect: false });

      // Clear browser cache
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear all cookies by setting them to expire
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie =
          name +
          "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" +
          window.location.hostname;
      });

      // Show success message before redirect
      setSnackbar({
        open: true,
        message: "ออกจากระบบสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...",
        severity: "success",
      });
      setSnackbarKey((k) => k + 1);

      // Wait a moment for user to see the message, then redirect to sign in
      setTimeout(() => {
        window.location.href = "/auth/signin";
      }, 1500);
    } catch (error) {
      console.error("Error during logout:", error);
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการออกจากระบบ",
        severity: "error",
      });
      setSnackbarKey((k) => k + 1);
    }
  };

  // Filter orders by category and status
  const getFilteredOrders = () => {
    let filteredOrders = orders;

    // Filter by category
    if (selectedCategory !== "all") {
      const dynamicKeys = categories.map((c) => c.key);

      if (selectedCategory === "other") {
        filteredOrders = filteredOrders.filter((order) =>
          order.items.some((item) => !dynamicKeys.includes(item.product.category))
        );
      } else {
        filteredOrders = filteredOrders.filter((order) =>
          order.items.some((item) => item.product.category === selectedCategory)
        );
      }
    }

    // Filter by status
    if (statusFilter !== "all") {
      filteredOrders = filteredOrders.filter((order) => order.status === statusFilter);
    }

    return filteredOrders;
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "dogs":
        return "🐕";
      case "cats":
        return "🐱";
      case "birds":
        return "🐦";
      case "fish":
        return "🐠";
      default:
        return "🐾";
    }
  };

  // Get background color based on product ID (same as ProductCard)
  const getCardBgColor = (productId: string) => {
    const pastelColors = [
      colors.cardBg.orange,     // Soft pink
      colors.cardBg.teal,     // Soft mint  
      colors.cardBg.yellow,   // Soft lavender
      colors.cardBg.blue,     // Soft coral
      colors.cardBg.lightOrange,    // Soft blue
      colors.cardBg.lightTeal,    // Soft green
      colors.cardBg.lightBlue,    // Soft blue
    ];
    
    // Use product id to get consistent color for each product
    const colorIndex = Math.abs(productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % pastelColors.length;
    return pastelColors[colorIndex];
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Translate order status to Thai
  const getStatusInThai = (status: string) => {
    switch (status) {
      case "PENDING":
        return "รอการชำระเงิน";
      case "PAYMENT_PENDING":
        return "รอตรวจสอบการชำระเงิน";
      case "CONFIRMED":
        return "ยืนยันการชำระเงิน";
      case "PROCESSING":
        return "กำลังจัดเตรียมสินค้า";
      case "SHIPPED":
        return "จัดส่งแล้ว";
      case "DELIVERED":
        return "ส่งมอบแล้ว";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return colors.success;
      case "SHIPPED":
        return "#2196F3"; // Blue
      case "PROCESSING":
      case "CONFIRMED":
        return colors.warning;
      case "PAYMENT_PENDING":
        return "#FF9800"; // Orange
      case "PENDING":
        return colors.info;
      case "CANCELLED":
        return "#F44336"; // Red
      default:
        return colors.info;
    }
  };

  // Only show loading for initial mount and auth loading
  if (!mounted || status === "loading") {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
          zIndex: 9999,
          gap: 2,
        }}
      >
        <Typography suppressHydrationWarning>กำลังโหลดโปรไฟล์...</Typography>
      </Box>
    );
  }

  // Wait until all API calls have completed before rendering content (only when authenticated)
  const isDataLoading = session && (loadingUser || loadingOrders || loadingCategories);

  if (isDataLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%)",
          position: "relative",
          pb: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Use session data as fallback while userData is loading
  const displayData = userData || {
    displayName: session?.user?.name || "",
    pictureUrl: session?.user?.image || "",
    email: session?.user?.email || "",
    lineUserId: session?.user?.lineUserId || "",
  };



  // Show loading while determining auth status
  if (!mounted) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Show QR code when not authenticated
  if (!session) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1100,
          }}
        >
          <IconButton
            onClick={() => router.back()}
            sx={{
              backgroundColor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>

        {/* QR Code Section */}
        <Card
          sx={{
            maxWidth: 400,
            width: "100%",
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Logo */}
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            mb: 2 
          }}>
            <Image
              src="/images/natpi_logo.png"
              alt="NATPI & Corgi Farm and Pet Shop"
              width={200}
              height={100}
              style={{
                objectFit: "contain",
                maxWidth: "100%",
                height: "auto"
              }}
              priority
            />
          </Box>
          

          
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: colors.text.secondary,
              lineHeight: 1.6,
            }}
          >
            เข้าสู่ระบบผ่าน LINE เพื่อดูประวัติการซื้อและติดตามคำสั่งซื้อของคุณ
          </Typography>

          {/* QR Code */}
          <Box
            sx={{
              width: 200,
              height: 200,
              mx: "auto",
              mb: 3,
              borderRadius: 2,
              overflow: "hidden",
              border: "2px solid #E0E0E0",
            }}
          >
            <img
              src="/images/qr_line.png"
              alt="LINE Official Account QR Code"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: colors.text.primary,
            }}
          >
            LINE Official Account
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              mb: 3,
            }}
          >
            @658jluqf
          </Typography>

                     <Button
             variant="contained"
             fullWidth
             sx={{
               py: 1.5,
               backgroundColor: "#06C755",
               color: "white",
               fontWeight: 600,
               borderRadius: 2,
               "&:hover": {
                 backgroundColor: "#05b04a",
               },
             }}
             onClick={() => signIn("line", { callbackUrl: "/shop" })}
           >
             LINE Login
           </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%)",
        position: "relative",
        pb: 10, // Space for bottom navigation
      }}
    >
      {isDataLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "background.default",
            zIndex: 1300,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Header - Transparent with Back and Logout Buttons */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          zIndex: 1100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Tooltip title="กลับ" arrow>
          <IconButton
            onClick={() => router.back()}
            sx={{
              backgroundColor: "transparent",
              color: colors.secondary.main,
              width: 48,
              height: 48,
              borderRadius: "50%",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <ArrowBack fontSize="medium" />
          </IconButton>
        </Tooltip>

        <Tooltip title="ออกจากระบบ" arrow>
          <IconButton
            onClick={handleLogout}
            sx={{
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              color: "white",
              width: 48,
              height: 48,
              borderRadius: "50%",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(244, 67, 54, 0.2)",
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <PowerSettingsNew fontSize="medium" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* User Profile Section */}
      <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            pt: 8,
            pb: 4,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
        {/* User Avatar */}
        <Avatar
          src={displayData.pictureUrl || session.user?.image || ""}
          alt={displayData.displayName || session.user?.name || "User"}
          sx={{
            width: 100,
            height: 100,
            border: `3px solid ${colors.secondary.main}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />

        {/* User Info */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color: colors.secondary.main,
                fontWeight: "bold",
                fontSize: "1.8rem",
              }}
            >
              {displayData.displayName || session.user?.name}
            </Typography>
            <IconButton
              onClick={handleEditClick}
              sx={{
                color: colors.secondary.main,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>

          {userData?.email && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Email
                fontSize="small"
                sx={{ color: colors.secondary.main, opacity: 0.8 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: colors.secondary.main,
                  opacity: 0.8,
                  fontSize: "0.9rem",
                }}
              >
                {userData.email}
              </Typography>
            </Box>
          )}

          {userData?.phoneNumber && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Phone
                fontSize="small"
                sx={{ color: colors.secondary.main, opacity: 0.8 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: colors.secondary.main,
                  opacity: 0.8,
                  fontSize: "0.9rem",
                }}
              >
                {userData.phoneNumber}
              </Typography>
            </Box>
          )}

          {userData?.statusMessage && (
            <Box
              sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1 }}
            >
              <Message
                fontSize="small"
                sx={{ color: colors.secondary.main, opacity: 0.8, mt: 0.2 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: colors.secondary.main,
                  opacity: 0.8,
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                }}
              >
                &quot;{userData.statusMessage}&quot;
              </Typography>
            </Box>
          )}
          </Box>
        </Box>
      </Container>

      {/* Purchase History Section */}
      <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            backgroundColor: colors.secondary.main,
            borderRadius: { xs: "24px 24px 0 0", sm: "32px 32px 0 0" },
            minHeight: "60vh",
            p: { xs: 2, sm: 3 },
            mt: 2,
          }}
        >
        <Typography
          variant="h5"
          sx={{
            color: colors.text.primary,
            fontWeight: "bold",
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          ประวัติการซื้อสินค้า
        </Typography>

        {/* Category Filter */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel
              id="category-filter-label"
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              กรองตามหมวดหมู่
            </InputLabel>
            <Select
              labelId="category-filter-label"
              value={selectedCategory}
              label="กรองตามหมวดหมู่"
              onChange={(e) => setSelectedCategory(e.target.value)}
              MenuProps={{
                disableScrollLock: true,
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    overflow: 'auto',
                    overflowX: 'hidden',
                  },
                },
              }}
              sx={{
                borderRadius: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: { xs: 1.5, sm: 2 },
                },
                "& .MuiSelect-select": {
                  py: { xs: 1.5, sm: 2 },
                },
              }}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.key} value={c.key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: "1.2rem" }}>{c.icon ?? "🐾"}</span>
                    {c.name}
                  </Box>
                </MenuItem>
              ))}
              <MenuItem value="other">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1.2rem" }}>🐾</span>
                  อื่นๆ
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel
              id="status-filter-label"
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              กรองตามสถานะ
            </InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="กรองตามสถานะ"
              onChange={(e) => setStatusFilter(e.target.value)}
              MenuProps={{
                disableScrollLock: true,
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    overflow: 'auto',
                    overflowX: 'hidden',
                  },
                },
              }}
              sx={{
                borderRadius: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: { xs: 1.5, sm: 2 },
                },
                "& .MuiSelect-select": {
                  py: { xs: 1.5, sm: 2 },
                },
              }}
            >
              <MenuItem value="all">ทุกสถานะ</MenuItem>
              <MenuItem value="PENDING">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>⏳</span>
                  รอการชำระเงิน
                </Box>
              </MenuItem>
              <MenuItem value="PAYMENT_PENDING">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>🔍</span>
                  รอตรวจสอบการชำระเงิน
                </Box>
              </MenuItem>
              <MenuItem value="CONFIRMED">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>✅</span>
                  ยืนยันการชำระเงิน
                </Box>
              </MenuItem>
              <MenuItem value="PROCESSING">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>📦</span>
                  กำลังเตรียมสินค้า
                </Box>
              </MenuItem>
              <MenuItem value="SHIPPED">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>🚚</span>
                  จัดส่งแล้ว
                </Box>
              </MenuItem>
              <MenuItem value="DELIVERED">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>📬</span>
                  ส่งมอบแล้ว
                </Box>
              </MenuItem>
              <MenuItem value="CANCELLED">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1rem" }}>❌</span>
                  ยกเลิกคำสั่งซื้อ
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Purchase History Content */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
          }}
        >
          {loadingOrders ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              {getFilteredOrders().length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: colors.text.secondary }}
                  >
                    {orders.length === 0 
                      ? "ยังไม่มีประวัติการซื้อ" 
                      : "ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการกรอง"}
                  </Typography>
                  {orders.length > 0 && (
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary }}
                    >
                      ลองเปลี่ยนหมวดหมู่หรือสถานะการกรอง
                    </Typography>
                  )}
                </Box>
              ) : (
                getFilteredOrders().map((order) => (
                  <Card
                    key={order.id}
                    sx={{
                      borderRadius: { xs: 2, sm: 3 },
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      overflow: "hidden",
                      
                      width: "100%",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      {/* Order Header with Order Number and Status */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: { xs: 1.5, sm: 2 },
                          pb: { xs: 1.5, sm: 2 },
                          borderBottom: `1px solid ${colors.background.default}`,
                          flexWrap: { xs: "wrap", sm: "nowrap" },
                          gap: { xs: 1, sm: 0 },
                        }}
                      >
                        <Box
                          sx={{ flex: 1, minWidth: { xs: "100%", sm: "auto" } }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: colors.text.secondary,
                              fontSize: { xs: "0.75rem", sm: "0.8rem" },
                              mb: 0.5,
                            }}
                          >
                            หมายเลขคำสั่งซื้อ
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: colors.text.primary,
                              fontWeight: "bold",
                              fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            }}
                          >
                            #
                            {order.orderNumber ||
                              order.id.slice(-8).toUpperCase()}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: { xs: 1, sm: 1.5 },
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: {
                              xs: "flex-end",
                              sm: "flex-start",
                            },
                          }}
                        >


                          <Chip
                            onClick={() => handleOrderDetailOpen(order)}
                            label="ดูรายละเอียด"
                            size="small"
                            sx={{
                              color: colors.text.primary,
                              backgroundColor: colors.background.paper,
                              border: "1px solid rgba(0,0,0,0.1)",
                              cursor: "pointer",
                              
                            }}
                          />

                          <Chip
                            label={getStatusInThai(order.status)}
                            size="small"
                            sx={{
                              color: getStatusColor(order.status),
                              backgroundColor: `${getStatusColor(
                                order.status
                              )}20`,
                              fontWeight: "500",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              height: { xs: 24, sm: 28 },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Order Items */}
                      {order.items.map((item, index) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            gap: { xs: 2, sm: 3 },
                            mb:
                              index < order.items.length - 1
                                ? { xs: 1.5, sm: 2 }
                                : 0,
                          }}
                        >
                          {item.product.imageUrl ? (
                            <Box
                              sx={{
                                width: { xs: 80, sm: 96 },
                                height: { xs: 80, sm: 96 },
                                borderRadius: { xs: 1.5, sm: 2 },
                                background: `linear-gradient(135deg, ${getCardBgColor(item.product.id)} 0%, ${getCardBgColor(item.product.id)}DD 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                border: `1px solid ${colors.background.default}`,
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                },
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                component="img"
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                loading="lazy"
                                onClick={() => handleProductClick(item.product)}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/images/icon-corgi.png";
                                }}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: { xs: 1.5, sm: 2 },
                                }}
                              />
                            </Box>
                                                ) : (
                            <Box
                              onClick={() => handleProductClick(item.product)}
                              sx={{
                                width: { xs: 80, sm: 96 },
                                height: { xs: 80, sm: 96 },
                                borderRadius: { xs: 1.5, sm: 2 },
                                background: `linear-gradient(135deg, ${getCardBgColor(item.product.id)} 0%, ${getCardBgColor(item.product.id)}DD 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: { xs: "1.5rem", sm: "2rem" },
                                flexShrink: 0,
                                border: `1px solid ${colors.background.default}`,
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                },
                              }}
                            >
                              {getCategoryIcon(item.product.category)}
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              onClick={() => handleProductClick(item.product)}
                              sx={{
                                color: colors.text.primary,
                                fontWeight: "bold",
                                fontSize: { xs: "1rem", sm: "1.2rem" },
                                mb: { xs: 0.5, sm: 1 },
                                cursor: "pointer",
                                lineHeight: 1.3,
                                "&:hover": {
                                  color: colors.primary.main,
                                  textDecoration: "underline",
                                },
                                // Truncate long text on mobile
                                display: "-webkit-box",
                                WebkitLineClamp: { xs: 2, sm: 3 },
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.product.name}
                              {item.product.breed && ` - ${item.product.breed}`}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: colors.text.secondary,
                                mb: { xs: 0.5, sm: 1 },
                                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                              }}
                            >
                              วันที่ซื้อ: {formatDate(order.createdAt)}
                            </Typography>
                            {item.product.gender && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: colors.text.secondary,
                                  mb: { xs: 0.5, sm: 1 },
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                }}
                              >
                                เพศ:{" "}
                                {item.product.gender === "MALE"
                                  ? "ผู้ชาย"
                                  : item.product.gender === "FEMALE"
                                  ? "ผู้หญิง"
                                  : "ไม่ระบุ"}
                                {item.product.age &&
                                  ` • อายุ: ${item.product.age}`}
                              </Typography>
                            )}
                            <Typography
                              variant="h6"
                              sx={{
                                color: colors.primary.main,
                                fontWeight: "bold",
                                fontSize: { xs: "0.95rem", sm: "1.1rem" },
                              }}
                            >
                              ฿{item.price.toLocaleString()}
                              {item.quantity > 1 && ` x ${item.quantity}`}
                            </Typography>
                          </Box>
                        </Box>
                      ))}

                      {/* Order Total */}
                      <Box
                        sx={{
                          mt: { xs: 1.5, sm: 2 },
                          pt: { xs: 1.5, sm: 2 },
                          borderTop: `1px solid ${colors.background.default}`,
                        }}
                      >
                        {/* Deposit Information */}
                        {order.paymentType === "DEPOSIT_PAYMENT" ? (
                          <Box sx={{ mb: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                              >
                                ราคาเต็ม
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold", fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                              >
                                ฿{((order.depositAmount || 0) + (order.remainingAmount || 0)).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                              >
                                ยอดมัดจำ
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold", color: colors.primary.main, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                              >
                                ฿{(order.depositAmount || 0).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                              >
                                {order.status === "DELIVERED" ? "ชำระครบแล้ว" : "คงเหลือ"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  fontWeight: "bold", 
                                  color: order.status === "DELIVERED" ? colors.success : colors.warning, 
                                  fontSize: { xs: "0.85rem", sm: "0.95rem" } 
                                }}
                              >
                                {order.status === "DELIVERED" ? "ไม่ต้องจ่ายเพิ่ม" : `฿${(order.remainingAmount || 0).toLocaleString()}`}
                              </Typography>
                            </Box>
                            
                            {/* Payment Status */}
                            {(() => {
                              const totalPaid = (order.paymentNotifications || []).reduce((sum, payment) => {
                                return sum + Number(payment.transferAmount || 0);
                              }, 0);
                              const orderTotal = Number(order.totalAmount || 0);
                              const remainingToPay = Math.max(0, orderTotal - totalPaid);
                              
                              if (totalPaid > 0 && order.status !== "DELIVERED") {
                                return (
                                  <>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 1,
                                        p: 1,
                                        backgroundColor: colors.success + "15",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ color: colors.text.secondary, fontSize: { xs: "0.75rem", sm: "0.85rem" }, fontWeight: 500 }}
                                      >
                                        💰 ได้รับแล้ว
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ 
                                          fontWeight: "bold", 
                                          color: colors.success,
                                          fontSize: { xs: "0.8rem", sm: "0.9rem" }
                                        }}
                                      >
                                        ฿{totalPaid.toLocaleString()}
                                      </Typography>
                                    </Box>
                                    
                                    {remainingToPay > 0 && (
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          mb: 1,
                                          p: 1,
                                          backgroundColor: colors.warning + "15",
                                          borderRadius: 1,
                                        }}
                                      >
                                        <Typography
                                          variant="body2"
                                          sx={{ 
                                            color: colors.text.secondary, 
                                            fontSize: { xs: "0.75rem", sm: "0.85rem" }, 
                                            fontWeight: 500 
                                          }}
                                        >
                                          ⏳ ยังต้องจ่าย
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{ 
                                            fontWeight: "bold", 
                                            color: colors.warning,
                                            fontSize: { xs: "0.8rem", sm: "0.9rem" }
                                          }}
                                        >
                                          ฿{remainingToPay.toLocaleString()}
                                        </Typography>
                                      </Box>
                                    )}
                                  </>
                                );
                              }
                              return null;
                            })()}
                            {/* Shipping Fee */}
                            {order.shippingFee !== undefined && order.shippingFee > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                                >
                                  ค่าจัดส่ง
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold", color: colors.info, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                                >
                                  ฿{order.shippingFee.toLocaleString()}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box>
                            {/* Shipping Fee for full payment */}
                            {order.shippingFee !== undefined && order.shippingFee > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                                >
                                  ค่าจัดส่ง
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold", color: colors.info, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                                >
                                  ฿{order.shippingFee.toLocaleString()}
                                </Typography>
                              </Box>
                            )}
                            {/* Payment Status for Full Payment */}
                            {(() => {
                              const totalPaid = (order.paymentNotifications || []).reduce((sum, payment) => {
                                return sum + Number(payment.transferAmount || 0);
                              }, 0);
                              const orderTotal = Number(order.totalAmount || 0);
                              const remainingToPay = Math.max(0, orderTotal - totalPaid);
                              
                              return (
                                <>
                                  {/* ยอดรวม */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ color: colors.text.secondary, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                                    >
                                      ยอดรวม
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: "bold", fontSize: { xs: "0.9rem", sm: "1rem" } }}
                                    >
                                      ฿{orderTotal.toLocaleString()}
                                    </Typography>
                                  </Box>
                                  
                                  {/* ยอดที่ได้รับแล้ว */}
                                  {(totalPaid > 0 || order.status === "DELIVERED") && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 1,
                                        p: 1,
                                        backgroundColor: colors.success + "15",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ color: colors.text.secondary, fontSize: { xs: "0.75rem", sm: "0.85rem" }, fontWeight: 500 }}
                                      >
                                        {order.status === "DELIVERED" ? "✅ ชำระแล้ว" : "💰 ได้รับแล้ว"}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ 
                                          fontWeight: "bold", 
                                          color: colors.success,
                                          fontSize: { xs: "0.8rem", sm: "0.9rem" }
                                        }}
                                      >
                                        {order.status === "DELIVERED" && totalPaid === 0 ? "ครบถ้วน" : `฿${totalPaid.toLocaleString()}`}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  {/* ยอดคงเหลือ */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      p: 1,
                                      backgroundColor: (order.status === "DELIVERED" || remainingToPay <= 0) ? colors.success + "15" : colors.warning + "15",
                                      borderRadius: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ 
                                        color: colors.text.secondary, 
                                        fontSize: { xs: "0.75rem", sm: "0.85rem" }, 
                                        fontWeight: 500 
                                      }}
                                    >
                                      {order.status === "DELIVERED" ? "✅ ชำระครบแล้ว" : remainingToPay > 0 ? "⏳ คงเหลือ" : "✅ ครบแล้ว"}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ 
                                        fontWeight: "bold", 
                                        color: (order.status === "DELIVERED" || remainingToPay <= 0) ? colors.success : colors.warning,
                                        fontSize: { xs: "0.8rem", sm: "0.9rem" }
                                      }}
                                    >
                                      {order.status === "DELIVERED" ? "ไม่ต้องจ่ายเพิ่ม" : `฿${remainingToPay.toLocaleString()}`}
                                    </Typography>
                                  </Box>
                                </>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>

                      {/* Admin Comment */}
                      {order.adminComment && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: "#f3f4f6",
                            borderRadius: 2,
                            borderLeft: `4px solid ${colors.info}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.info,
                              fontWeight: "bold",
                              mb: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            💬 ข้อความจากผู้ดูแลระบบ
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.text.primary,
                              lineHeight: 1.6,
                            }}
                          >
                            {order.adminComment}
                          </Typography>
                        </Box>
                      )}

                      {/* Payment Button - Only show for PENDING or PAYMENT_PENDING orders */}
                      {(order.status === "PENDING" ||
                        order.status === "PAYMENT_PENDING") &&
                        order.orderNumber && (
                          <Box
                            sx={{
                              mt: { xs: 2, sm: 3 },
                              pt: { xs: 2, sm: 3 },
                              borderTop: `1px solid ${colors.background.default}`,
                            }}
                          >
                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<Payment />}
                              onClick={() =>
                                handleLiffNavigation(
                                  router,
                                  `/payment-notification?orderNumber=${order.orderNumber}`
                                )
                              }
                              sx={{
                                backgroundColor: colors.primary.main,
                                color: colors.secondary.main,
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                fontWeight: "bold",
                                py: { xs: 1.5, sm: 2 },
                                borderRadius: { xs: 2, sm: 3 },
                                boxShadow: `0 4px 12px ${colors.primary.main}30`,
                                "&:hover": {
                                  backgroundColor: colors.primary.dark,
                                  boxShadow: `0 6px 16px ${colors.primary.main}40`,
                                  transform: "translateY(-1px)",
                                },
                                transition: "all 0.2s ease",
                              }}
                            >
                              {(order.paymentNotifications && order.paymentNotifications.length > 0) 
                                ? "แจ้งชำระอีกครั้ง" 
                                : "แจ้งชำระเงิน"}
                            </Button>
                          </Box>
                        )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </Box>
        </Box>
      </Container>

      {/* Edit Profile Dialog - Full Screen */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: colors.background.default,
          },
        }}
      >
        {/* App Bar Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: colors.primary.main,
            color: colors.secondary.main,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setEditDialogOpen(false)}
              sx={{ mr: 2 }}
            >
              <Close />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                flex: 1,
                fontWeight: "bold",
              }}
            >
              แก้ไขข้อมูลโปรไฟล์
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleFormSubmit}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              <Save />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* Display Name Field */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Person sx={{ color: colors.primary.main }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: colors.text.primary,
                }}
              >
                ชื่อแสดง
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={editForm.displayName}
              onChange={(e) =>
                setEditForm({ ...editForm, displayName: e.target.value })
              }
              variant="outlined"
              placeholder="กรอกชื่อแสดงของคุณ"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Email Field */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Email sx={{ color: colors.primary.main }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: colors.text.primary,
                }}
              >
                อีเมล
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              variant="outlined"
              placeholder="กรอกอีเมลของคุณ"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Phone Number Field */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Phone sx={{ color: colors.primary.main }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: colors.text.primary,
                }}
              >
                เบอร์โทรศัพท์
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="tel"
              value={editForm.phoneNumber}
              onChange={(e) =>
                setEditForm({ ...editForm, phoneNumber: e.target.value })
              }
              variant="outlined"
              placeholder="เช่น 081-234-5678"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Status Message Field */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Message sx={{ color: colors.primary.main }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  color: colors.text.primary,
                }}
              >
                ข้อความสถานะ
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editForm.statusMessage}
              onChange={(e) =>
                setEditForm({ ...editForm, statusMessage: e.target.value })
              }
              variant="outlined"
              placeholder="เขียนข้อความสถานะของคุณ..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Box>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        key={snackbarKey}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={SlideUpTransition}
        sx={{ pointerEvents: "none" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="standard"
          icon={false}
          sx={{
            pointerEvents: "all",
            width: "auto",
            maxWidth: "min(480px, calc(100vw - 32px))",
            px: 2,
            py: 1.25,
            borderRadius: 3,
            boxShadow:
              snackbar.severity === "success"
                ? "0 20px 40px rgba(46,125,50,0.18)"
                : snackbar.severity === "warning"
                ? "0 20px 40px rgba(240,180,0,0.18)"
                : snackbar.severity === "error"
                ? "0 20px 40px rgba(211,47,47,0.18)"
                : "0 20px 40px rgba(25,118,210,0.18)",
            backdropFilter: "saturate(180%) blur(12px)",
            WebkitBackdropFilter: "saturate(180%) blur(12px)",
            backgroundColor:
              snackbar.severity === "success"
                ? "rgba(46, 125, 50, 0.12)"
                : snackbar.severity === "warning"
                ? "rgba(240, 180, 0, 0.12)"
                : snackbar.severity === "error"
                ? "rgba(211, 47, 47, 0.12)"
                : "rgba(25, 118, 210, 0.12)",
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
            backgroundBlendMode: "overlay",
            color:
              snackbar.severity === "success"
                ? "#1b5e20"
                : snackbar.severity === "warning"
                ? "#7a5c00"
                : snackbar.severity === "error"
                ? "#8e0000"
                : "#0d47a1",
            border:
              snackbar.severity === "success"
                ? "1px solid rgba(46, 125, 50, 0.28)"
                : snackbar.severity === "warning"
                ? "1px solid rgba(240, 180, 0, 0.28)"
                : snackbar.severity === "error"
                ? "1px solid rgba(211, 47, 47, 0.28)"
                : "1px solid rgba(25, 118, 210, 0.28)",
            borderLeft:
              snackbar.severity === "success"
                ? "4px solid rgba(46, 125, 50, 0.65)"
                : snackbar.severity === "warning"
                ? "4px solid rgba(240, 180, 0, 0.65)"
                : snackbar.severity === "error"
                ? "4px solid rgba(211, 47, 47, 0.65)"
                : "4px solid rgba(25, 118, 210, 0.65)",
            fontWeight: 600,
            letterSpacing: 0.2,
            "& .MuiAlert-action > button": {
              color:
                snackbar.severity === "success"
                  ? "#1b5e20"
                  : snackbar.severity === "warning"
                  ? "#7a5c00"
                  : snackbar.severity === "error"
                  ? "#8e0000"
                  : "#0d47a1",
            },
          }}
        >
          {snackbar.message}
          <Box
            sx={{
              mt: 0.75,
              height: 2,
              borderRadius: 2,
              backgroundColor:
                snackbar.severity === "success"
                  ? "rgba(46,125,50,0.2)"
                  : snackbar.severity === "warning"
                  ? "rgba(240,180,0,0.2)"
                  : snackbar.severity === "error"
                  ? "rgba(211,47,47,0.2)"
                  : "rgba(25,118,210,0.2)",
              overflow: "hidden",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "100%",
                backgroundColor:
                  snackbar.severity === "success"
                    ? "rgba(46,125,50,0.6)"
                    : snackbar.severity === "warning"
                    ? "rgba(240,180,0,0.6)"
                    : snackbar.severity === "error"
                    ? "rgba(211,47,47,0.6)"
                    : "rgba(25,118,210,0.6)",
                transformOrigin: "left",
                animation: "snackGrow 3s linear forwards",
              },
              "@keyframes snackGrow": {
                from: { transform: "scaleX(0)" },
                to: { transform: "scaleX(1)" },
              },
            }}
          />
        </Alert>
      </Snackbar>

      {/* Order Detail Bottom Sheet */}
      <Drawer
        anchor="bottom"
        open={orderDetailOpen}
        onClose={handleOrderDetailClose}
        PaperProps={{
          sx: {
            borderRadius: "24px 24px 0 0",
            maxHeight: "80vh",
            backgroundColor: colors.background.default,
          },
        }}
      >
        {selectedOrder && (
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: colors.text.primary,
                }}
              >
                รายละเอียดคำสั่งซื้อ
              </Typography>
              <IconButton
                onClick={handleOrderDetailClose}
                sx={{
                  backgroundColor: colors.background.paper,
                  "&:hover": { backgroundColor: colors.primary.light },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Order Info */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    หมายเลขคำสั่งซื้อ
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: "bold", color: colors.primary.main }}
                  >
                    #
                    {selectedOrder.orderNumber ||
                      selectedOrder.id.slice(-8).toUpperCase()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    วันที่สั่งซื้อ
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: colors.text.secondary }}
                  >
                    {formatDate(selectedOrder.createdAt)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    สถานะ
                  </Typography>
                  <Chip
                    label={getStatusInThai(selectedOrder.status)}
                    size="small"
                    sx={{
                      color: getStatusColor(selectedOrder.status),
                      backgroundColor: `${getStatusColor(
                        selectedOrder.status
                      )}20`,
                      fontWeight: "bold",
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {selectedOrder.paymentType === "DEPOSIT_PAYMENT" ? "ราคาเต็ม" : "ยอดรวม"}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: colors.primary.main }}
                  >
                    ฿{selectedOrder.paymentType === "DEPOSIT_PAYMENT" 
                      ? ((selectedOrder.depositAmount || 0) + (selectedOrder.remainingAmount || 0)).toLocaleString()
                      : selectedOrder.totalAmount.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Payment & Shipping Info */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, color: colors.text.primary }}
                >
                  ข้อมูลการชำระเงิน & จัดส่ง
                </Typography>

                {/* Payment Type & Amount */}
                {(() => {
                  // คำนวณยอดเงินที่ได้รับจาก payment notifications
                  const totalPaid = (selectedOrder.paymentNotifications || []).reduce((sum, payment) => {
                    return sum + Number(payment.transferAmount || 0);
                  }, 0);
                  
                  const orderTotal = Number(selectedOrder.totalAmount || 0);
                  const remainingToPay = Math.max(0, orderTotal - totalPaid);
                  
                  return selectedOrder.paymentType === "DEPOSIT_PAYMENT" ? (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary }}
                        >
                          ประเภทการชำระ
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          มัดจำ
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary }}
                        >
                          ยอดรวมทั้งหมด
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold" }}
                        >
                          ฿{orderTotal.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary }}
                        >
                          ยอดมัดจำ (ที่ต้องจ่ายก่อน)
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold", color: colors.primary.main }}
                        >
                          ฿{(selectedOrder.depositAmount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                          p: 1.5,
                          backgroundColor: totalPaid > 0 ? colors.success + "20" : colors.background.default,
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary, fontWeight: 500 }}
                        >
                          💰 ยอดที่ได้รับแล้ว(มัดจำ)
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontWeight: "bold", 
                            color: totalPaid > 0 ? colors.success : colors.text.secondary 
                          }}
                        >
                          ฿{totalPaid.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                          p: 1.5,
                          backgroundColor: (selectedOrder.status === "DELIVERED" || remainingToPay <= 0) ? colors.success + "20" : colors.warning + "20",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary, fontWeight: 500 }}
                        >
                          {selectedOrder.status === "DELIVERED" ? "✅ ชำระครบแล้วเต็มจำนวน" : remainingToPay > 0 ? "⏳ ยอดคงเหลือ" : "✅ ชำระครบแล้ว"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontWeight: "bold", 
                            color: (selectedOrder.status === "DELIVERED" || remainingToPay <= 0) ? colors.success : colors.warning 
                          }}
                        >
                          {selectedOrder.status === "DELIVERED" ? "ไม่ต้องจ่ายเพิ่ม" : `฿${remainingToPay.toLocaleString()}`}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary }}
                        >
                          ประเภทการชำระ
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          เต็มจำนวน
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary }}
                        >
                          ยอดรวมทั้งหมด
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold" }}
                        >
                          ฿{orderTotal.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                          p: 1.5,
                          backgroundColor: totalPaid > 0 ? colors.success + "20" : colors.background.default,
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary, fontWeight: 500 }}
                        >
                          💰 ยอดที่ได้รับแล้ว
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontWeight: "bold", 
                            color: totalPaid > 0 ? colors.success : colors.text.secondary 
                          }}
                        >
                          ฿{totalPaid.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                          p: 1.5,
                          backgroundColor: (selectedOrder.status === "DELIVERED" || remainingToPay <= 0) ? colors.success + "20" : colors.warning + "20",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.secondary, fontWeight: 500 }}
                        >
                          {selectedOrder.status === "DELIVERED" ? "✅ ชำระครบแล้ว" : remainingToPay > 0 ? "⏳ ยอดคงเหลือ" : "✅ ชำระครบแล้ว"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontWeight: "bold", 
                            color: (selectedOrder.status === "DELIVERED" || remainingToPay <= 0) ? colors.success : colors.warning 
                          }}
                        >
                          {selectedOrder.status === "DELIVERED" ? "ไม่ต้องจ่ายเพิ่ม" : `฿${remainingToPay.toLocaleString()}`}
                        </Typography>
                      </Box>
                    </>
                  );
                })()}

                {/* Shipping Fee */}
                {selectedOrder.shippingFee !== undefined && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary }}
                    >
                      ค่าจัดส่ง
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      ฿{selectedOrder.shippingFee.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {/* Discount */}
                {selectedOrder.discountAmount !== undefined && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary }}
                    >
                      ส่วนลด
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", color: colors.success }}
                    >
                      -฿{selectedOrder.discountAmount.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Customer Info */}
                {selectedOrder.customerName && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary }}
                    >
                      ชื่อผู้สั่ง
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {selectedOrder.customerName}
                    </Typography>
                  </Box>
                )}

                {selectedOrder.customerPhone && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary }}
                    >
                      เบอร์โทร
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {selectedOrder.customerPhone}
                    </Typography>
                  </Box>
                )}

                {selectedOrder.shippingAddress && (
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.text.secondary, mb: 0.5 }}
                    >
                      ที่อยู่จัดส่ง
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", lineHeight: 1.4 }}
                    >
                      {selectedOrder.shippingAddress}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Admin Comment */}
            {selectedOrder.adminComment && (
              <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", mb: 2, color: colors.text.primary }}
                  >
                    💬 ข้อความจากผู้ดูแลระบบ
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 2,
                      borderLeft: `4px solid ${colors.info}`,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: colors.text.primary,
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedOrder.adminComment}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Payment Notifications */}
            {selectedOrder.paymentNotifications && selectedOrder.paymentNotifications.length > 0 && (
              <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", mb: 2, color: colors.text.primary }}
                  >
                    💳 ประวัติการชำระเงิน
                  </Typography>

                  {/* Payment Summary */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: colors.background.default, 
                      borderRadius: 2, 
                      mb: 3 
                    }}
                  >
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                      สรุปการชำระเงิน
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ยอดที่ได้รับทั้งหมด: ฿{selectedOrder.paymentNotifications.reduce((sum, p) => sum + Number(p.transferAmount), 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.success }}>
                        ({selectedOrder.paymentNotifications.length} รายการ)
                      </Typography>
                    </Box>
                  </Box>

                  {selectedOrder.paymentNotifications.map((notification, index) => (
                    <Box key={notification.id} sx={{ mb: index < selectedOrder.paymentNotifications!.length - 1 ? 3 : 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          การชำระเงิน #{index + 1}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            px: 1.5, 
                            py: 0.5, 
                            backgroundColor: colors.success + "20", 
                            color: colors.success, 
                            borderRadius: 1,
                            fontWeight: 500
                          }}
                        >
                          ฿{notification.transferAmount.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          จำนวนเงิน
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          ฿{notification.transferAmount.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          วันที่โอน
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {formatDate(notification.transferDate)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          วันที่แจ้ง
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {formatDate(notification.submittedAt)}
                        </Typography>
                      </Box>

                                                  {/* Payment Slip */}
                            {notification.paymentSlipData && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                                  หลักฐานการโอนเงิน
                                </Typography>
                                <Box
                                  component="img"
                                  src={notification.paymentSlipData?.startsWith('data:') 
                                    ? notification.paymentSlipData 
                                    : notification.paymentSlipData || ''}
                                  alt="Payment Slip"
                                  onError={(e) => {
                                    console.error("Failed to load payment slip image:", notification.paymentSlipData);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  sx={{
                                    width: "100%",
                                    maxWidth: 300,
                                    height: "auto",
                                    borderRadius: 2,
                                    border: `1px solid ${colors.background.default}`,
                                    cursor: "pointer",
                                    "&:hover": {
                                      transform: "scale(1.02)",
                                    },
                                    transition: "transform 0.2s ease",
                                  }}
                                  onClick={() => {
                                    // Open image in new tab for full view
                                    const imageUrl = notification.paymentSlipData?.startsWith('data:') 
                                      ? notification.paymentSlipData 
                                      : notification.paymentSlipData || '';
                                    
                                    const newWindow = window.open();
                                    if (newWindow) {
                                      newWindow.document.write(`
                                        <html>
                                          <head><title>หลักฐานการโอนเงิน</title></head>
                                          <body style="margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                                            <img src="${imageUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.1);" />
                                          </body>
                                        </html>
                                      `);
                                      newWindow.document.close();
                                    }
                                  }}
                                />
                              </Box>
                            )}

                      {index < selectedOrder.paymentNotifications!.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Items List */}
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", mb: 2, color: colors.text.primary }}
            >
              รายการสินค้า ({selectedOrder.items.length} รายการ)
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}
            >
              {selectedOrder.items.map((item, index) => (
                <Card key={item.id} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      {item.product.imageUrl ? (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${getCardBgColor(item.product.id)} 0%, ${getCardBgColor(item.product.id)}DD 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            cursor: "pointer",
                            transition: "transform 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.1)",
                            },
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            component="img"
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            onClick={() => handleProductClick(item.product)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/icon-corgi.png";
                            }}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 2,
                            }}
                          />
                        </Box>
                      ) : (
                        <Box
                          onClick={() => handleProductClick(item.product)}
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${getCardBgColor(item.product.id)} 0%, ${getCardBgColor(item.product.id)}DD 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            flexShrink: 0,
                            cursor: "pointer",
                            transition: "transform 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.1)",
                            },
                          }}
                        >
                          {getCategoryIcon(item.product.category)}
                        </Box>
                      )}

                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          onClick={() => handleProductClick(item.product)}
                          sx={{
                            fontWeight: "bold",
                            mb: 0.5,
                            cursor: "pointer",
                            "&:hover": {
                              color: colors.primary.main,
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {item.product.name}
                          {item.product.breed && ` - ${item.product.breed}`}
                        </Typography>

                        {item.product.gender && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.text.secondary,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            เพศ:{" "}
                            {item.product.gender === "MALE"
                              ? "ผู้ชาย"
                              : item.product.gender === "FEMALE"
                              ? "ผู้หญิง"
                              : "ไม่ระบุ"}
                            {item.product.age && ` • อายุ: ${item.product.age}`}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: colors.text.secondary }}
                          >
                            ฿{item.price.toLocaleString()} x {item.quantity}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: "bold",
                              color: colors.primary.main,
                            }}
                          >
                            ฿{(item.price * item.quantity).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              {(selectedOrder.status === "PENDING" ||
                selectedOrder.status === "PAYMENT_PENDING") &&
                selectedOrder.orderNumber && (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Payment />}
                    onClick={() => {
                      handleOrderDetailClose();
                      handleLiffNavigation(
                        router,
                        `/payment-notification?orderNumber=${selectedOrder.orderNumber}`
                      );
                    }}
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      backgroundColor: colors.primary.main,
                      "&:hover": {
                        backgroundColor: colors.primary.dark,
                      },
                    }}
                  >
                    {(selectedOrder.paymentNotifications && selectedOrder.paymentNotifications.length > 0) 
                      ? "แจ้งชำระอีกครั้ง" 
                      : "แจ้งชำระเงิน"}
                  </Button>
                )}

              <Button
                variant="outlined"
                fullWidth
                startIcon={<Receipt />}
                onClick={handleOrderDetailClose}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  borderColor: colors.primary.main,
                  color: colors.primary.main,
                  "&:hover": {
                    borderColor: colors.primary.dark,
                    backgroundColor: `${colors.primary.main}10`,
                  },
                }}
              >
                ปิด
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* BottomNavigation is rendered globally in RootLayout */}
    </Box>
  );
}
