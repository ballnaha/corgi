"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
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
      
      // Fetch real data from APIs
      const [userResponse, ordersResponse] = await Promise.all([
        fetch("/api/admin/users?action=stats"),
        fetch("/api/orders") // Will create this API later
      ]);

      if (userResponse.ok) {
        const userStats = await userResponse.json();
        
        // Update stats with real user data and mock data for others
        setStats(prev => ({
          ...prev,
          totalUsers: userStats.totalUsers || 0,
          // Mock data for other stats until we create their APIs
          totalProducts: 45,
          totalOrders: 127,
          totalRevenue: 85600,
          pendingOrders: 8,
          lowStockProducts: 3,
        }));
      }

      // Mock orders data for now
      setRecentOrders([
        {
          id: "1",
          orderNumber: "ORD-001",
          customerName: "คุณสมชาย",
          amount: 2500,
          status: "PENDING",
          createdAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "2", 
          orderNumber: "ORD-002",
          customerName: "คุณสมหญิง",
          amount: 3200,
          status: "CONFIRMED",
          createdAt: "2024-01-15T09:15:00Z",
        },
        {
          id: "3",
          orderNumber: "ORD-003", 
          customerName: "คุณสมศรี",
          amount: 1800,
          status: "SHIPPED",
          createdAt: "2024-01-14T16:45:00Z",
        },
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use mock data as fallback
      setStats({
        totalProducts: 45,
        totalOrders: 127,
        totalUsers: 1, // At least test admin
        totalRevenue: 85600,
        pendingOrders: 8,
        lowStockProducts: 3,
      });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "info";
      case "SHIPPED":
        return "primary";
      case "DELIVERED":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "รอชำระ";
      case "CONFIRMED":
        return "ยืนยันแล้ว";
      case "SHIPPED":
        return "จัดส่งแล้ว";
      case "DELIVERED":
        return "ส่งถึงแล้ว";
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
      title: "รายงานยอดขาย",
      description: "ดูสถิติและรายงาน",
      icon: <TrendingUp />,
      color: colors.success,
      action: () => handleLiffNavigation(router, "/admin/reports"),
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          ภาพรวมของระบบจัดการร้านค้า
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="จำนวนสินค้า"
            value={stats.totalProducts}
            icon={<Inventory />}
            color={colors.primary.main}
            change="+5 จากเดือนที่แล้ว"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="คำสั่งซื้อทั้งหมด"
            value={stats.totalOrders}
            icon={<ShoppingCart />}
            color={colors.info}
            change="+12% จากเดือนที่แล้ว"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            icon={<People />}
            color={colors.success}
            change="+8% จากเดือนที่แล้ว"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="รายได้ทั้งหมด"
            value={`฿${stats.totalRevenue.toLocaleString()}`}
            icon={<AttachMoney />}
            color={colors.warning}
            change="+15% จากเดือนที่แล้ว"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            การดำเนินการด่วน
          </Typography>
        </Grid>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
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
          </Grid>
        ))}
      </Grid>

      {/* Recent Orders and Alerts */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={8}>
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
              <List>
                {recentOrders.map((order, index) => (
                  <ListItem
                    key={order.id}
                    divider={index < recentOrders.length - 1}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: colors.primary.light }}>
                        <ShoppingCart />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                            {order.orderNumber}
                          </Typography>
                          <Chip
                            label={getStatusText(order.status)}
                            size="small"
                            color={getStatusColor(order.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {order.customerName} • ฿{order.amount.toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleLiffNavigation(router, `/admin/orders/${order.id}`)
                        }
                      >
                        <Visibility />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts & Notifications */}
        <Grid item xs={12} md={4}>
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
        </Grid>
      </Grid>
    </Box>
  );
}
