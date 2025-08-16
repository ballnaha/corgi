"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Tooltip,
  Divider,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  MoreVert,
  Visibility,
  Edit,
  LocalShipping,
  Payment,
  Cancel,
  CheckCircle,
  Search,
  FilterList,
  Refresh,
  Download,
  Person,
  Phone,
  Email,
  LocationOn,
  MonetizationOn,
  Inventory,
  ShoppingCart,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { ORDER_STATUS_INFO } from "@/lib/order-status";

// ประเภทข้อมูล
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    category: string;
    breed?: string;
    gender?: string;
    age?: string;
    images?: Array<{
      id: string;
      imageUrl: string;
      altText?: string;
      isMain: boolean;
    }>;
    categoryRef?: {
      id: string;
      name: string;
      key: string;
    };
  };
}

interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  status: string;
  totalAmount: number;
  discountAmount?: number;
  discountCode?: string;
  paymentType: string;
  depositAmount?: number;
  remainingAmount?: number;
  shippingFee?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  hasPets: boolean;
  requiresDeposit: boolean;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  shippingOption?: {
    id: string;
    name: string;
    method: string;
  };
  user: {
    id: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
  };
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminOrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuOrderId, setMenuOrderId] = useState<string | null>(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // โหลดข้อมูลคำสั่งซื้อ
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });
      
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (dateFilter) params.append("date", dateFilter);

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setTotalCount(data.pagination.totalCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตสถานะคำสั่งซื้อ
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setSnackbar({
        open: true,
        message: "อัปเดตสถานะคำสั่งซื้อสำเร็จ",
        severity: "success",
      });

      // รีเฟรชข้อมูล
      fetchOrders();
      setStatusDialogOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
        severity: "error",
      });
    }
  };

  // Event handlers
  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, statusFilter, searchQuery, dateFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setMenuAnchor(event.currentTarget);
    setMenuOrderId(orderId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuOrderId(null);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusChange = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("th-TH");
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUS_INFO[status as keyof typeof ORDER_STATUS_INFO] || {
      label: status,
      color: "#757575",
      icon: "❓",
    };
  };

  const getProductImage = (item: OrderItem) => {
    const mainImage = item.product.images?.find(img => img.isMain);
    return mainImage?.imageUrl || item.product.images?.[0]?.imageUrl || "/images/placeholder.png";
  };

  // ส่วนแสดงผลสำหรับมือถือ
  const renderMobileOrderCard = (order: Order) => (
    <Card 
      key={order.id} 
      sx={{ 
        mb: 2, 
        cursor: "pointer",
        "&:hover": { 
          boxShadow: 3,
          transform: "translateY(-1px)",
          transition: "all 0.2s"
        }
      }}
      onClick={() => handleViewOrder(order)}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {order.orderNumber || `#${order.id.slice(-8)}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(order.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={getStatusInfo(order.status).label}
              size="small"
              sx={{
                backgroundColor: `${getStatusInfo(order.status).color}20`,
                color: getStatusInfo(order.status).color,
                fontWeight: 600,
                fontSize: "0.7rem"
              }}
              icon={<span style={{ fontSize: "0.8rem" }}>{getStatusInfo(order.status).icon}</span>}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, order.id);
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Customer Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Avatar 
            src={order.user.pictureUrl || undefined}
            sx={{ width: 24, height: 24 }}
          >
            {!order.user.pictureUrl && <Person fontSize="small" />}
          </Avatar>
          <Typography variant="body2">
            {order.user.displayName || order.customerName}
          </Typography>
          {order.customerPhone && (
            <>
              <Typography variant="body2" color="text.secondary">•</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.customerPhone}
              </Typography>
            </>
          )}
        </Box>

        {/* Amount & Items */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {formatCurrency(order.totalAmount)}
            </Typography>
            {order.discountAmount && order.discountAmount > 0 && (
              <Typography variant="caption" color="success.main">
                ส่วนลด: {formatCurrency(order.discountAmount)}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2">
              {order.orderItems.length} รายการ
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.hasPets ? "🐕 มีสัตว์เลี้ยง" : "🎁 สินค้าทั่วไป"}
            </Typography>
          </Box>
        </Box>

        {/* Shipping */}
        {(order.shippingOption?.name || order.shippingMethod) && (
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1, 
            mt: 1,
            p: 1, 
            backgroundColor: "background.default", 
            borderRadius: 1 
          }}>
            <LocalShipping fontSize="small" color="action" />
            <Typography variant="caption">
              {order.shippingOption?.name || order.shippingMethod}
            </Typography>
            {order.shippingFee && (
              <>
                <Typography variant="caption" color="text.secondary">•</Typography>
                <Typography variant="caption" color="text.secondary">
                  ค่าส่ง: {formatCurrency(order.shippingFee)}
                </Typography>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // ส่วนแสดงผลสำหรับเดสก์ท็อป
  const renderOrderRow = (order: Order) => (
    <TableRow key={order.id} hover>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {order.orderNumber || `#${order.id.slice(-8)}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(order.createdAt)}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar 
            src={order.user.pictureUrl || undefined}
            sx={{ width: 32, height: 32 }}
          >
            {!order.user.pictureUrl && <Person fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="body2">
              {order.user.displayName || order.customerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.customerPhone}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {formatCurrency(order.totalAmount)}
          </Typography>
          {order.discountAmount && order.discountAmount > 0 && (
            <Typography variant="caption" color="success.main">
              ส่วนลด: {formatCurrency(order.discountAmount)}
            </Typography>
          )}
        </Box>
      </TableCell>

      <TableCell>
        <Chip
          label={getStatusInfo(order.status).label}
          size="small"
          sx={{
            backgroundColor: `${getStatusInfo(order.status).color}20`,
            color: getStatusInfo(order.status).color,
            fontWeight: 600,
          }}
          icon={<span>{getStatusInfo(order.status).icon}</span>}
        />
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {order.shippingOption?.name || order.shippingMethod || "-"}
        </Typography>
        {order.shippingFee && (
          <Typography variant="caption" color="text.secondary">
            ค่าส่ง: {formatCurrency(order.shippingFee)}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {order.orderItems.length} รายการ
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {order.hasPets ? "มีสัตว์เลี้ยง" : "ไม่มีสัตว์เลี้ยง"}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, order.id)}
        >
          <MoreVert />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          จัดการคำสั่งซื้อ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ดูและจัดการคำสั่งซื้อทั้งหมดในระบบ
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: { xs: "stretch", md: "center" },
          flexWrap: "wrap"
        }}>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 300px" } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาคำสั่งซื้อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Box>
          
          <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 180px" } }}>
            <FormControl fullWidth size="small">
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {Object.entries(ORDER_STATUS_INFO).map(([key, info]) => (
                  <MenuItem key={key} value={key}>
                    {info.icon} {info.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 160px" } }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="วันที่"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 120px" } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => fetchOrders()}
              disabled={loading}
            >
              รีเฟรช
            </Button>
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 140px" } }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Download />}
              sx={{
                backgroundColor: colors.primary.main,
                "&:hover": { backgroundColor: colors.primary.dark },
              }}
            >
              ส่งออกข้อมูล
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ข้อมูลคำสั่งซื้อ */}
      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={fetchOrders}>
            ลองใหม่
          </Button>
        </Box>
      ) : (
        <>
          {/* Desktop View */}
          <Paper sx={{ display: { xs: "none", md: "block" } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>คำสั่งซื้อ</TableCell>
                    <TableCell>ลูกค้า</TableCell>
                    <TableCell>ยอดรวม</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>การจัดส่ง</TableCell>
                    <TableCell>รายการ</TableCell>
                    <TableCell align="right">การจัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map(renderOrderRow)}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          ไม่พบข้อมูลคำสั่งซื้อ
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Mobile View */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {orders.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  ไม่พบข้อมูลคำสั่งซื้อ
                </Typography>
              </Paper>
            ) : (
              <Box>
                {orders.map(renderMobileOrderCard)}
              </Box>
            )}
          </Box>

          {/* Pagination */}
          {orders.length > 0 && (
            <Paper sx={{ mt: { xs: 2, md: 0 } }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                labelRowsPerPage="แถวต่อหน้า:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
                }
                sx={{
                  "& .MuiTablePagination-toolbar": {
                    paddingLeft: { xs: 1, sm: 2 },
                    paddingRight: { xs: 1, sm: 2 },
                  },
                  "& .MuiTablePagination-selectLabel": {
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  },
                  "& .MuiTablePagination-displayedRows": {
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  },
                }}
              />
            </Paper>
          )}
        </>
      )}

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MenuItem onClick={() => {
          const order = orders.find(o => o.id === menuOrderId);
          if (order) handleViewOrder(order);
        }}>
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          ดูรายละเอียด
        </MenuItem>
        <MenuItem onClick={() => {
          const order = orders.find(o => o.id === menuOrderId);
          if (order) handleStatusChange(order);
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          เปลี่ยนสถานะ
        </MenuItem>
      </Menu>

      {/* View Order Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            maxHeight: { xs: "100vh", sm: "90vh" },
            width: { xs: "100vw", sm: "100vw" },
            margin: { xs: 0, sm: "32px" },
            maxWidth: { xs: "100vw", sm: "lg" },
          }
        }}
        sx={{
          "& .MuiDialog-container": {
            alignItems: { xs: "stretch", sm: "center" },
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            background: `linear-gradient(135deg, ${colors.primary.main}15, ${colors.secondary.main}15)`,
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: colors.primary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}
              >
                <ShoppingCart />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  รายละเอียดคำสั่งซื้อ
                </Typography>
                {selectedOrder && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedOrder.orderNumber || `#${selectedOrder.id.slice(-8)}`}
                  </Typography>
                )}
              </Box>
            </Box>
            {selectedOrder && (
              <Chip
                label={getStatusInfo(selectedOrder.status).label}
                size="medium"
                sx={{
                  backgroundColor: `${getStatusInfo(selectedOrder.status).color}20`,
                  color: getStatusInfo(selectedOrder.status).color,
                  fontWeight: 600,
                  "& .MuiChip-icon": {
                    fontSize: "1rem"
                  }
                }}
                icon={<span>{getStatusInfo(selectedOrder.status).icon}</span>}
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent 
          sx={{ 
            p: { xs: 1, sm: 3 },
            overflowX: "hidden",
            width: "100%",
            mt: 2,
          }}
        >
          {selectedOrder && (
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: { xs: 2, sm: 3 },
              width: "100%",
              maxWidth: "100%",
            }}>
              {/* แถวแรก - ข้อมูลคำสั่งซื้อและลูกค้า */}
              <Box sx={{ 
                display: "flex", 
                flexDirection: { xs: "column", md: "row" },
                gap: { xs: 2, sm: 3 },
                width: "100%",
              }}>
                {/* ข้อมูลคำสั่งซื้อ */}
                <Box sx={{ flex: 1, width: "100%" }}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${colors.primary.main}30`,
                      "&:hover": { 
                        boxShadow: 2,
                        borderColor: `${colors.primary.main}50`
                      },
                      width: "100%",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <MonetizationOn color="primary" />
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          ข้อมูลคำสั่งซื้อ
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                            หมายเลข:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedOrder.orderNumber || `#${selectedOrder.id.slice(-8)}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                            วันที่สั่ง:
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(selectedOrder.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                            ยอดรวม:
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {formatCurrency(selectedOrder.totalAmount)}
                          </Typography>
                        </Box>
                        {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                              ส่วนลด:
                            </Typography>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              -{formatCurrency(selectedOrder.discountAmount)}
                              {selectedOrder.discountCode && ` (${selectedOrder.discountCode})`}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                            การชำระ:
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrder.paymentType}
                          </Typography>
                        </Box>
                        {selectedOrder.requiresDeposit && (
                          <>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                มัดจำ:
                              </Typography>
                              <Typography variant="body2" color="warning.main">
                                {formatCurrency(selectedOrder.depositAmount || 0)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                ค้างชำระ:
                              </Typography>
                              <Typography variant="body2" color="error.main">
                                {formatCurrency(selectedOrder.remainingAmount || 0)}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* ข้อมูลลูกค้า */}
                <Box sx={{ flex: 1, width: "100%" }}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${colors.secondary.main}30`,
                      "&:hover": { 
                        boxShadow: 2,
                        borderColor: `${colors.secondary.main}50`
                      },
                      width: "100%",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Person color="action" />
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          ข้อมูลลูกค้า
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar 
                            src={selectedOrder.user.pictureUrl || undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            {!selectedOrder.user.pictureUrl && <Person fontSize="small" />}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedOrder.user.displayName || selectedOrder.customerName}
                          </Typography>
                        </Box>
                        {selectedOrder.customerPhone && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2">{selectedOrder.customerPhone}</Typography>
                          </Box>
                        )}
                        {(selectedOrder.user.email || selectedOrder.customerEmail) && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="body2">
                              {selectedOrder.user.email || selectedOrder.customerEmail}
                            </Typography>
                          </Box>
                        )}
                        {selectedOrder.shippingAddress && (
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <LocationOn fontSize="small" color="action" sx={{ mt: 0.5 }} />
                            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                              {selectedOrder.shippingAddress}
                            </Typography>
                          </Box>
                        )}
                        {(selectedOrder.shippingOption?.name || selectedOrder.shippingMethod) && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <LocalShipping fontSize="small" color="action" />
                            <Typography variant="body2">
                              {selectedOrder.shippingOption?.name || selectedOrder.shippingMethod}
                              {selectedOrder.shippingFee && ` (${formatCurrency(selectedOrder.shippingFee)})`}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* รายการสินค้า */}
              <Box sx={{ width: "100%" }}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.1)",
                    width: "100%",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                      <Inventory color="action" />
                      <Typography variant="h6" fontWeight="bold">
                        รายการสินค้า ({selectedOrder.orderItems.length} รายการ)
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {selectedOrder.orderItems.map((item, index) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 2, sm: 3 },
                            p: { xs: 1.5, sm: 2.5 },
                            borderRadius: 2,
                            backgroundColor: index % 2 === 0 ? "background.default" : "transparent",
                            border: "1px solid",
                            borderColor: "divider",
                            "&:hover": {
                              backgroundColor: `${colors.primary.main}05`,
                              borderColor: `${colors.primary.main}30`
                            },
                            flexDirection: { xs: "row", sm: "row" },
                            width: "100%",
                          }}
                        >
                          <Avatar
                            src={getProductImage(item)}
                            sx={{ 
                              width: { xs: 50, sm: 70 }, 
                              height: { xs: 50, sm: 70 },
                              borderRadius: 2,
                              border: "2px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                            }}
                            variant="rounded"
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="body1" 
                              fontWeight="bold" 
                              sx={{ 
                                mb: 0.5,
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                lineHeight: 1.3,
                              }}
                            >
                              {item.product.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 0.5,
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                lineHeight: 1.3,
                              }}
                            >
                              {item.product.categoryRef?.name || item.product.category}
                              {item.product.breed && ` • ${item.product.breed}`}
                              {item.product.gender && ` • ${item.product.gender}`}
                              {item.product.age && ` • ${item.product.age}`}
                            </Typography>
                            <Box sx={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 1,
                              flexWrap: { xs: "wrap", sm: "nowrap" },
                            }}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                              >
                                จำนวน: 
                              </Typography>
                              <Chip 
                                label={`${item.quantity} ชิ้น`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                              />
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                              >
                                • ราคา: {formatCurrency(item.price)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ 
                            textAlign: "right",
                            flexShrink: 0,
                            ml: { xs: 1, sm: 2 },
                          }}>
                            <Typography 
                              variant="h6" 
                              color="primary.main" 
                              fontWeight="bold"
                              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                            >
                              {formatCurrency(item.price * item.quantity)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            background: `linear-gradient(135deg, ${colors.background.default}, ${colors.secondary.main}10)`,
            borderTop: "1px solid",
            borderColor: "divider",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            "& > :not(:first-of-type)": {
              ml: { xs: 0, sm: 1 },
            },
          }}
        >
          <Button 
            onClick={() => setViewDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              minWidth: { xs: "auto", sm: 100 },
              order: { xs: 2, sm: 1 },
            }}
          >
            ปิด
          </Button>
          {selectedOrder && (
            <Button
              variant="contained"
              onClick={() => handleStatusChange(selectedOrder)}
              startIcon={<Edit />}
              fullWidth={isMobile}
              sx={{
                backgroundColor: colors.primary.main,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                minWidth: { xs: "auto", sm: 140 },
                boxShadow: 2,
                order: { xs: 1, sm: 2 },
                "&:hover": {
                  boxShadow: 4,
                  backgroundColor: colors.primary.dark,
                }
              }}
            >
              เปลี่ยนสถานะ
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>เปลี่ยนสถานะคำสั่งซื้อ</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>สถานะใหม่</InputLabel>
              <Select
                value={newStatus}
                label="สถานะใหม่"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.entries(ORDER_STATUS_INFO).map(([key, info]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, newStatus)}
            disabled={!newStatus || newStatus === selectedOrder?.status}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
            }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
