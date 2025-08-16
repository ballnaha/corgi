"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
} from "@mui/material";
import {
  TrendingUp,
  Inventory,
  People,
  ShoppingCart,
  AttachMoney,
  Add,
  Visibility,
  Edit,
  CheckCircle,
  Schedule,
  Warning,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: {
    pictureUrl?: string;
    displayName?: string;
  };
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from all APIs
      const [userResponse, ordersStatsResponse, ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/admin/users?action=stats"),
        fetch("/api/admin/orders/stats"),
        fetch("/api/admin/orders?limit=5"), // Recent orders
        fetch("/api/admin/products?action=stats")
      ]);

      let dashboardStats = {
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
      };

      // Process user stats
      if (userResponse.ok) {
        const userStats = await userResponse.json();
        dashboardStats.totalUsers = userStats.totalUsers || 0;
      }

      // Process orders stats
      if (ordersStatsResponse.ok) {
        const orderStats = await ordersStatsResponse.json();
        if (orderStats.success && orderStats.stats) {
          dashboardStats.totalOrders = orderStats.stats.totalOrders || 0;
          dashboardStats.totalRevenue = orderStats.stats.totalRevenue || 0;
          dashboardStats.pendingOrders = 
            (orderStats.stats.statusCounts?.pending || 0) +
            (orderStats.stats.statusCounts?.paymentPending || 0) +
            (orderStats.stats.statusCounts?.confirmed || 0);
        }
      }

      // Process products stats  
      if (productsResponse.ok) {
        const productStats = await productsResponse.json();
        if (productStats.success) {
          dashboardStats.totalProducts = productStats.totalProducts || 0;
          dashboardStats.lowStockProducts = productStats.lowStockCount || 0;
        }
      }

      // Process recent orders
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success && ordersData.orders) {
          const formattedOrders = ordersData.orders.slice(0, 5).map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber || `#${order.id.slice(-8)}`,
            customerName: order.user?.displayName || order.customerName || "ลูกค้า",
            amount: Number(order.totalAmount) || 0,
            status: order.status,
            createdAt: order.createdAt,
            user: {
              pictureUrl: order.user?.pictureUrl,
              displayName: order.user?.displayName,
            },
          }));
          setRecentOrders(formattedOrders);
        }
      }

      setStats(dashboardStats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use minimal fallback data
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
      });
      setRecentOrders([]);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "PAYMENT_PENDING":
        return "error";
      case "CONFIRMED":
        return "info";
      case "PROCESSING":
        return "primary";
      case "SHIPPED":
        return "secondary";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "รอการยืนยัน";
      case "PAYMENT_PENDING":
        return "รอการชำระเงิน";
      case "CONFIRMED":
        return "ยืนยันแล้ว";
      case "PROCESSING":
        return "กำลังดำเนินการ";
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

  const quickActions: QuickAction[] = [
    {
      title: "เพิ่มสินค้าใหม่",
      description: "เพิ่มสินค้าเข้าร้านค้า",
      icon: <Add />,
      color: colors.primary.main,
      action: () => handleLiffNavigation(router, "/admin/products/new"),
    },
    {
      title: "จัดการคำสั่งซื้อ",
      description: "ดูและจัดการคำสั่งซื้อ",
      icon: <ShoppingCart />,
      color: colors.info,
      action: () => handleLiffNavigation(router, "/admin/orders"),
    },
    {
      title: "ดูสินค้าทั้งหมด",
      description: "จัดการและดูสินค้าในระบบ",
      icon: <Inventory />,
      color: colors.success,
      action: () => handleLiffNavigation(router, "/admin/products"),
    },
    {
      title: "จัดการผู้ใช้",
      description: "ดูและจัดการผู้ใช้",
      icon: <People />,
      color: colors.warning,
      action: () => handleLiffNavigation(router, "/admin/users"),
    },
  ];

  const StatCard = ({
    title,
    value,
    icon,
    color,
    change,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    change?: string;
  }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
          </Box>
        </Box>
        {change && (
          <Typography variant="caption" color="success.main">
            {change}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Dashboard
        </Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography color="text.secondary">กำลังโหลดข้อมูล...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            ภาพรวมของระบบจัดการร้านค้า
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          รีเฟรช
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <StatCard
          title="จำนวนสินค้า"
          value={stats.totalProducts}
          icon={<Inventory />}
          color={colors.primary.main}
        />
        <StatCard
          title="คำสั่งซื้อทั้งหมด"
          value={stats.totalOrders}
          icon={<ShoppingCart />}
          color={colors.info}
        />
        <StatCard
          title="ผู้ใช้ทั้งหมด"
          value={stats.totalUsers}
          icon={<People />}
          color={colors.success}
        />
        <StatCard
          title="รายได้ทั้งหมด"
          value={`฿${stats.totalRevenue.toLocaleString()}`}
          icon={<AttachMoney />}
          color={colors.warning}
        />
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          การดำเนินการด่วน
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
          {quickActions.map((action, index) => (
            <Card
              key={index}
              sx={{
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
              onClick={action.action}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: `${action.color}15`,
                    color: action.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Recent Orders and Alerts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Recent Orders */}
        <Box>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  คำสั่งซื้อล่าสุด
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleLiffNavigation(router, "/admin/orders")}
                >
                  ดูทั้งหมด
                </Button>
              </Box>
              {recentOrders.length > 0 ? (
                <List>
                  {recentOrders.map((order, index) => (
                    <ListItem
                      key={order.id}
                      divider={index < recentOrders.length - 1}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={order.user?.pictureUrl} 
                          sx={{ 
                            backgroundColor: colors.primary.light,
                            width: 40,
                            height: 40
                          }}
                        >
                          {!order.user?.pictureUrl && <ShoppingCart />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <React.Fragment>
                            <Typography component="span" variant="subtitle2" sx={{ fontWeight: "bold", marginRight: 1 }}>
                              {order.orderNumber}
                            </Typography>
                            <Chip
                              label={getStatusText(order.status)}
                              size="small"
                              color={getStatusColor(order.status) as any}
                            />
                          </React.Fragment>
                        }
                        secondary={
                          <Typography component="span" variant="body2" color="text.secondary">
                            {order.customerName} • ฿{order.amount.toLocaleString()}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleLiffNavigation(router, "/admin/orders")
                          }
                        >
                          <Visibility />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    ยังไม่มีคำสั่งซื้อ
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleLiffNavigation(router, "/admin/orders")}
                    sx={{ mt: 2 }}
                  >
                    ดูรายการคำสั่งซื้อ
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Alerts & Notifications */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                การแจ้งเตือน
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: colors.warning + "20", color: colors.warning }}>
                      <Schedule />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="คำสั่งซื้อรอดำเนินการ"
                    secondary={`${stats.pendingOrders} รายการ`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: colors.error + "20", color: colors.error }}>
                      <Warning />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="สินค้าใกล้หมด"
                    secondary={`${stats.lowStockProducts} รายการ`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: colors.success + "20", color: colors.success }}>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="ระบบทำงานปกติ"
                    secondary="ไม่มีปัญหา"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
