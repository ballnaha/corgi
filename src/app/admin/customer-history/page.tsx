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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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
  InputAdornment,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Visibility,
  Search,
  Refresh,
  Person,
  ShoppingCart,
  LocalShipping,
  MonetizationOn,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  FilterList,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { ORDER_STATUS_INFO, type OrderStatus } from "@/lib/order-status";
import { generateSlug } from "@/lib/products";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { useRouter } from "next/navigation";

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
  };
}

interface CustomerOrder {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount?: number;
  discountCode?: string;
  paymentType: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  user: {
    id: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
  };
}

interface CustomerHistory {
  userId: string;
  user: {
    id: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
  };
  orders: CustomerOrder[];
  totalOrders: number;
  totalSpent: number;
}

export default function CustomerHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  
  // State management
  const [customerHistories, setCustomerHistories] = useState<CustomerHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  
  // Dialog states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHistory | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Expand states for mobile
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // โหลดข้อมูลประวัติการซื้อ
  const fetchCustomerHistories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });
      
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/admin/customer-history?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch customer histories");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCustomerHistories(data.customers);
        setTotalCount(data.totalCount);
      } else {
        throw new Error(data.error || "Failed to fetch data");
      }
    } catch (err: any) {
      console.error("Error fetching customer histories:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setCustomerHistories([]);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  useEffect(() => {
    fetchCustomerHistories();
  }, [page, rowsPerPage, searchQuery, statusFilter]);

  const handleViewCustomer = (customer: CustomerHistory) => {
    setSelectedCustomer(customer);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleToggleExpand = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const handleProductClick = (product: { id: string; name: string }) => {
    const slug = generateSlug(product.name, product.id);
    handleLiffNavigation(router, `/product/${slug}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && customerHistories.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography color="text.secondary">กำลังโหลดข้อมูลประวัติการซื้อ...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mb: 1,
                fontSize: { xs: "1.5rem", md: "1.5rem" },
              }}
            >
              ประวัติการซื้อของลูกค้า
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.875rem", md: "1rem" },
              }}
            >
              แสดงประวัติการซื้อของลูกค้าทุกสถานะ พร้อมระบบกรองแบบละเอียด
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCustomerHistories}
            disabled={loading}
            size="small"
          >
            รีเฟรช
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { xs: "stretch", md: "flex-end" },
            }}
          >
            <TextField
              placeholder="ค้นหาลูกค้า (ชื่อ, อีเมล, เบอร์โทร)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>สถานะออเดอร์</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
                label="สถานะออเดอร์"
                startAdornment={<FilterList sx={{ mr: 1, color: colors.text.secondary }} />}
              >
                <MenuItem value="">
                  <em>ทุกสถานะ</em>
                </MenuItem>
                {Object.entries(ORDER_STATUS_INFO).map(([status, info]) => (
                  <MenuItem key={status} value={status}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: info.color,
                        }}
                      />
                      {info.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {(searchQuery || statusFilter) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                  setPage(0);
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ลูกค้า</TableCell>
                <TableCell align="center">จำนวนออเดอร์</TableCell>
                <TableCell align="right">ยอดซื้อรวม</TableCell>
                <TableCell align="center">การกระทำ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customerHistories.map((customer) => (
                <TableRow key={customer.userId} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={customer.user.pictureUrl}
                        alt={customer.user.displayName || "Customer"}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(customer.user.displayName || "C").charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {customer.user.displayName || "ไม่ระบุชื่อ"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.user.email || customer.user.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${customer.totalOrders} ออเดอร์`}
                      variant="outlined"
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: colors.primary.main }}>
                      {formatCurrency(customer.totalSpent)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="ดูประวัติการซื้อ">
                      <IconButton
                        size="small"
                        onClick={() => handleViewCustomer(customer)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="รายการต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
        />
      </Card>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {customerHistories.map((customer) => (
          <Card key={customer.userId} sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Avatar
                  src={customer.user.pictureUrl}
                  alt={customer.user.displayName || "Customer"}
                  sx={{ width: 50, height: 50 }}
                >
                  {(customer.user.displayName || "C").charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {customer.user.displayName || "ไม่ระบุชื่อ"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {customer.user.email || customer.user.id}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(customer.userId)}
                >
                  {expandedCustomer === customer.userId ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    จำนวนออเดอร์
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {customer.totalOrders} ออเดอร์
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ยอดซื้อรวม
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", color: colors.primary.main }}
                  >
                    {formatCurrency(customer.totalSpent)}
                  </Typography>
                </Box>
              </Box>

              <Collapse in={expandedCustomer === customer.userId}>
                <Divider sx={{ mb: 2 }} />
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                ออเดอร์ล่าสุด:
              </Typography>
              {customer.orders.slice(0, 3).map((order) => {
                const statusInfo = ORDER_STATUS_INFO[order.status];
                return (
                  <Box key={order.id} sx={{ mb: 1, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {order.orderNumber || order.id.slice(-8)}
                      </Typography>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: statusInfo.color,
                          borderColor: statusInfo.color,
                          backgroundColor: `${statusInfo.color}15`,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(order.updatedAt)}
                    </Typography>
                  </Box>
                );
              })}
                {customer.orders.length > 3 && (
                  <Button
                    size="small"
                    onClick={() => handleViewCustomer(customer)}
                    sx={{ mt: 1 }}
                  >
                    ดูทั้งหมด ({customer.orders.length} ออเดอร์)
                  </Button>
                )}
              </Collapse>
            </CardContent>
          </Card>
        ))}

        {/* Mobile Pagination */}
        <Card>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="รายการต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
          />
        </Card>
      </Box>

      {/* Customer Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={selectedCustomer?.user.pictureUrl}
              alt={selectedCustomer?.user.displayName || "Customer"}
              sx={{ width: 40, height: 40 }}
            >
              {(selectedCustomer?.user.displayName || "C").charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                ประวัติการซื้อของ {selectedCustomer?.user.displayName || "ลูกค้า"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedCustomer?.user.email || selectedCustomer?.user.id}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedCustomer && (
            <Box>
              {/* Summary */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center" }}>
                    <ShoppingCart sx={{ fontSize: 40, color: colors.primary.main, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {selectedCustomer.totalOrders}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ออเดอร์ทั้งหมด
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: "center" }}>
                    <MonetizationOn sx={{ fontSize: 40, color: "#4CAF50", mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ยอดซื้อรวม
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Orders List */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                รายการออเดอร์ทั้งหมด
                {statusFilter && (
                  <Chip
                    label={`กรองตาม: ${ORDER_STATUS_INFO[statusFilter as OrderStatus]?.label}`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              
              {selectedCustomer.orders.map((order) => {
                const statusInfo = ORDER_STATUS_INFO[order.status];
                return (
                  <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            ออเดอร์ #{order.orderNumber || order.id.slice(-8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                        <Chip
                          label={statusInfo.label}
                          sx={{
                            color: statusInfo.color,
                            backgroundColor: `${statusInfo.color}15`,
                            borderColor: statusInfo.color,
                            fontWeight: "bold",
                          }}
                          variant="outlined"
                        />
                      </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
                        สินค้าที่ซื้อ:
                      </Typography>
                      {order.orderItems.map((item) => {
                        const productImage = item.product.images?.[0]?.imageUrl || '/images/placeholder.png';
                        return (
                          <Card key={item.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                              {/* Product Image */}
                              <Box
                                onClick={() => handleProductClick(item.product)}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  "&:hover": {
                                    transform: "scale(1.05)",
                                  },
                                }}
                              >
                                <img
                                  src={productImage}
                                  alt={item.product.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </Box>
                              
                              {/* Product Info */}
                              <Box sx={{ flex: 1 }}>
                                <Box
                                  onClick={() => handleProductClick(item.product)}
                                  sx={{
                                    cursor: "pointer",
                                    "&:hover .product-name": {
                                      color: colors.primary.main,
                                      textDecoration: "underline",
                                    },
                                  }}
                                >
                                  <Typography 
                                    variant="subtitle2" 
                                    className="product-name"
                                    sx={{ 
                                      fontWeight: "bold",
                                      mb: 0.5,
                                      transition: "color 0.2s",
                                    }}
                                  >
                                    {item.product.name}
                                  </Typography>
                                </Box>
                                
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                  Product ID: {item.product.id}
                                </Typography>
                                
                                {/* Product Details */}
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                                  <Chip
                                    label={item.product.category}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: "0.7rem" }}
                                  />
                                  {item.product.breed && (
                                    <Chip
                                      label={item.product.breed}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                  )}
                                  {item.product.gender && (
                                    <Chip
                                      label={item.product.gender}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                  )}
                                  {item.product.age && (
                                    <Chip
                                      label={item.product.age}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.7rem" }}
                                    />
                                  )}
                                </Box>
                                
                                {/* Quantity and Price */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Typography variant="body2">
                                    จำนวน: {item.quantity} ชิ้น
                                  </Typography>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography variant="body2" color="text.secondary">
                                      ราคาต่อชิ้น: {formatCurrency(item.price)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: "bold", color: colors.primary.main }}>
                                      รวม: {formatCurrency(item.price * item.quantity)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </Card>
                        );
                      })}
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2">
                        ยอดรวม:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: colors.primary.main }}>
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                );
              })}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Empty State */}
      {customerHistories.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Person sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            ไม่พบประวัติการซื้อ
          </Typography>
          <Typography color="text.secondary">
            {searchQuery || statusFilter
              ? "ไม่พบลูกค้าที่ตรงกับเงื่อนไขการค้นหาหรือการกรอง"
              : "ยังไม่มีลูกค้าที่มีประวัติการซื้อ"}
          </Typography>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
