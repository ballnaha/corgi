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
  Checkbox,
  FormControlLabel,
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
  Delete,
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

interface PaymentNotification {
  id: string;
  transferAmount: number;
  transferDate: string;
  paymentSlipData?: string | null;
  paymentSlipMimeType?: string | null;
  paymentSlipFileName?: string | null;
  submittedAt: string;
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
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  paymentNotifications?: PaymentNotification[];
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
  const [adminComment, setAdminComment] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Manual Payment Dialog states
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState({
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentTime: new Date().toTimeString().slice(0, 5),
    note: "",
    autoComplete: true,
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  
  // Delete Order Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  
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

  // บันทึกการชำระเงินแบบ Manual
  const recordManualPayment = async () => {
    if (isRecordingPayment) return;
    
    if (!selectedOrder) {
      setSnackbar({
        open: true,
        message: "ไม่พบข้อมูลออเดอร์",
        severity: "error",
      });
      return;
    }
    
    if (!manualPaymentData.amount || Number(manualPaymentData.amount) <= 0) {
      setSnackbar({
        open: true,
        message: "กรุณากรอกจำนวนเงินที่ถูกต้อง",
        severity: "error",
      });
      return;
    }
    
    setIsRecordingPayment(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/manual-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(manualPaymentData),
      });

      if (!response.ok) {
        throw new Error("Failed to record manual payment");
      }

      const result = await response.json();
      
      // Debug information
      if (result.debug) {
        console.log('Manual Payment Result:', result);
      }
      
      setSnackbar({
        open: true,
        message: result.isFullyPaid 
          ? `🎉 บันทึกการชำระเงินสำเร็จ และออเดอร์เสร็จสิ้นแล้ว! (ยอดคงเหลือ: ฿${result.remainingAmount})`
          : `✅ บันทึกการชำระเงินสำเร็จ ยอดคงเหลือ: ฿${result.remainingAmount}`,
        severity: "success",
      });

      // รีเฟรชข้อมูล
      fetchOrders();
      
    } catch (err) {
      console.error("Error in recordManualPayment:", err);
      setSnackbar({
        open: true,
        message: "❌ เกิดข้อผิดพลาดในการบันทึกการชำระเงิน",
        severity: "error",
      });
    } finally {
      // ปิด modal และรีเซ็ต state เสมอ (ไม่ว่าจะสำเร็จหรือไม่)
      setIsRecordingPayment(false);
      setManualPaymentDialogOpen(false);
      setSelectedOrder(null);
      setManualPaymentData({
        amount: "",
        paymentMethod: "CASH",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().slice(0, 5),
        note: "",
        autoComplete: true,
      });
    }
  };

  // อัปเดตสถานะคำสั่งซื้อ
  const updateOrderStatus = async (orderId: string, status: string) => {
    if (isUpdatingStatus) return; // ป้องกันการกดซ้ำ
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status,
          adminComment: adminComment.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setSnackbar({
        open: true,
        message: "🎉 อัปเดตสถานะคำสั่งซื้อสำเร็จแล้ว!",
        severity: "success",
      });

      // รีเฟรชข้อมูล
      fetchOrders();
      
    } catch (err) {
      console.error("Error in updateOrderStatus:", err);
      setSnackbar({
        open: true,
        message: "❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง",
        severity: "error",
      });
    } finally {
      // ปิด modal และรีเซ็ต state เสมอ (ไม่ว่าจะสำเร็จหรือไม่)
      setIsUpdatingStatus(false);
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      setAdminComment(""); // รีเซ็ต comment
      setNewStatus(""); // รีเซ็ต status
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
    setAdminComment(""); // รีเซ็ต comment เมื่อเปิด dialog
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleManualPayment = (order: Order) => {
    setSelectedOrder(order);
    
    // ใช้ฟังก์ชันช่วยคำนวณยอดคงเหลือ
    const { orderTotal, totalPaid, actualRemaining, paymentStatus } = calculateRemainingAmount(order);
    
    console.log('Payment Calculation Debug:', {
      orderTotal,
      totalPaid,
      actualRemaining,
      paymentStatus,
      paymentNotifications: order.paymentNotifications?.map(p => ({
        amount: p.transferAmount,
        type: typeof p.transferAmount
      }))
    });
    
    setManualPaymentData({
      ...manualPaymentData,
      amount: actualRemaining > 0 ? actualRemaining.toFixed(2) : "0",
    });
    setManualPaymentDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const deleteOrder = async () => {
    if (!selectedOrder) return;

    setIsDeletingOrder(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      const result = await response.json();

      setSnackbar({
        open: true,
        message: `🗑️ ลบออเดอร์สำเร็จ และคืน stock แล้ว (${result.restoredItems} รายการ)`,
        severity: "success",
      });

      // รีเฟรชข้อมูล
      fetchOrders();
      
    } catch (error) {
      console.error("Error deleting order:", error);
      setSnackbar({
        open: true,
        message: "❌ เกิดข้อผิดพลาดในการลบออเดอร์",
        severity: "error",
      });
    } finally {
      // ปิด modal และรีเซ็ต state เสมอ (ไม่ว่าจะสำเร็จหรือไม่)
      setIsDeletingOrder(false);
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    }
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

  // ฟังก์ชันช่วยคำนวณยอดคงเหลือ (ปรับปรุง: totalAmount ตอนนี้เป็นราคาจริงที่ลูกค้าจ่าย)
  const calculateRemainingAmount = (order: Order) => {
    // ข้อมูลจากออเดอร์
    const depositAmount = order.depositAmount 
      ? (typeof order.depositAmount === 'string' ? parseFloat(order.depositAmount) : Number(order.depositAmount))
      : 0;
    
    const remainingAmount = order.remainingAmount 
      ? (typeof order.remainingAmount === 'string' ? parseFloat(order.remainingAmount) : Number(order.remainingAmount))
      : 0;
    
    // ราคาสินค้า = totalAmount (ตอนนี้เป็นราคาจริงที่ลูกค้าจ่ายหลังหักส่วนลดแล้ว)
    const orderTotal = typeof order.totalAmount === 'string' 
      ? parseFloat(order.totalAmount) 
      : Number(order.totalAmount);
    
    // ตรวจสอบความสอดคล้องของข้อมูล: totalAmount ควรเท่ากับ deposit + remaining
    const calculatedFromParts = depositAmount + remainingAmount;
    const priceMatchesCalculation = Math.abs(orderTotal - calculatedFromParts) < 0.01;
    const finalPrice = orderTotal; // ใช้ totalAmount เป็นหลัก
    
    // คำนวณยอดที่ชำระจริงจาก payment notifications
    const totalPaid = order.paymentNotifications?.reduce(
      (sum, payment) => {
        const amount = typeof payment.transferAmount === 'string' 
          ? parseFloat(payment.transferAmount) 
          : Number(payment.transferAmount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0
    ) || 0;
    
    // ตรวจสอบสถานะการชำระ
    const isDepositComplete = depositAmount > 0 ? totalPaid >= depositAmount : true;
    const isFullyPaid = totalPaid >= finalPrice;
    
    // คำนวณยอดคงเหลือ
    let actualRemaining;
    if (order.status === 'DELIVERED') {
      // ถ้าสถานะ DELIVERED แปลว่าได้รับเงินครบแล้ว
      actualRemaining = 0;
    } else {
      // คำนวณจากยอดที่ชำระจริง
      actualRemaining = Math.max(0, finalPrice - totalPaid);
    }
    
    // สถานะต่างๆ
    let paymentStatus = '';
    if (order.status === 'DELIVERED') {
      paymentStatus = 'delivered'; // ส่งมอบแล้ว = ได้เงินครบ
    } else if (isFullyPaid) {
      paymentStatus = 'fully_paid'; // ชำระครบแล้ว
    } else if (isDepositComplete && depositAmount > 0) {
      paymentStatus = 'deposit_complete'; // มัดจำครบ
    } else if (totalPaid > 0 && depositAmount > 0) {
      paymentStatus = 'partial_deposit'; // มัดจำไม่ครบ
    } else if (totalPaid > 0) {
      paymentStatus = 'partial_payment'; // ชำระบางส่วน
    } else {
      paymentStatus = 'unpaid'; // ยังไม่ชำระ
    }
    
    return {
      // ข้อมูลพื้นฐาน
      orderTotal: finalPrice,
      totalPaid,
      actualRemaining,
      depositAmount,
      remainingAmount,
      calculatedPrice: calculatedFromParts, // คำนวณจาก deposit + remaining
      priceMatchesCalculation,
      
      // สถานะการชำระ
      isDepositComplete,
      isFullyPaid,
      paymentStatus,
      
      // สำหรับการแสดงผล
      displayInfo: {
        price: finalPrice,
        deposit: depositAmount,
        remaining: actualRemaining,
        paidAmount: totalPaid,
        expectedRemaining: remainingAmount // ยอดคงเหลือที่คาดหวังตาม order
      }
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
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
            {/* Payment Notification Alert for Mobile */}
            {order.paymentNotifications && order.paymentNotifications.length > 0 && (
              <Chip
                label="💳"
                size="small"
                sx={{
                  backgroundColor: "#ff9800",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.6rem",
                  height: 18,
                  minWidth: 30,
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.7 },
                    "100%": { opacity: 1 },
                  },
                }}
              />
            )}
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
            {/* แสดงข้อมูลการชำระเงินใน Mobile */}
            {(() => {
              const { 
                orderTotal,
                totalPaid,
                actualRemaining,
                depositAmount,
                remainingAmount,
                isDepositComplete,
                isFullyPaid,
                paymentStatus,
                priceMatchesCalculation,
                displayInfo
              } = calculateRemainingAmount(order);
              
              return (
                <Box>
                  {/* แสดงสูตรการคำนวณ */}
                  <Typography variant="caption" color="text.secondary" display="block">
                    (฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + ฿{remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </Typography>
                  
                  {/* แสดงมัดจำ */}
                  {depositAmount > 0 && (
                    <Typography variant="caption" color="info.main" display="block">
                      มัดจำ: ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {paymentStatus === 'delivered' ? ' (ครบ)' : 
                       paymentStatus === 'deposit_complete' ? ' (ครบ)' : 
                       paymentStatus === 'partial_deposit' ? ` (ได้ ฿${totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : 
                       ' (ยังไม่ได้)'}
                    </Typography>
                  )}
                  
                  {/* แสดงยอดคงเหลือ */}
                  <Typography 
                    variant="caption" 
                    color={paymentStatus === 'delivered' || paymentStatus === 'fully_paid' ? "success.main" : "error.main"}
                    display="block"
                    fontWeight="bold"
                  >
                    คงเหลือ: {
                      paymentStatus === 'delivered' ? 'ครบแล้ว ✅' : 
                      paymentStatus === 'fully_paid' ? 'ครบแล้ว ✅' :
                      `฿${actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </Typography>
                  
                  {/* แสดงสถานะพิเศษ */}
                  {paymentStatus === 'partial_deposit' && (
                    <Typography variant="caption" color="warning.main" display="block">
                      💰 มัดจำยังไม่ครบ
                    </Typography>
                  )}
                  
                  {paymentStatus === 'deposit_complete' && actualRemaining > 0 && (
                    <Typography variant="caption" color="info.main" display="block">
                      ✅ มัดจำครบ คงเหลือ ฿{actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  )}
                  
                  {/* เตือนหากข้อมูลไม่ตรงกัน */}
                  {!priceMatchesCalculation && (
                    <Typography variant="caption" color="error.main" display="block">
                      ⚠️ ข้อมูลไม่ถูกต้อง
                    </Typography>
                  )}
                </Box>
              );
            })()}
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
        <Box>
          {(() => {
            const { 
              orderTotal,
              totalPaid,
              actualRemaining,
              depositAmount,
              remainingAmount,
              isDepositComplete,
              isFullyPaid,
              paymentStatus,
              priceMatchesCalculation,
              displayInfo
            } = calculateRemainingAmount(order);
            
            return (
              <Box>
                {/* แสดงราคาสินค้า = มัดจำ + คงเหลือ */}
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  ราคา: ฿{displayInfo.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  (฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + ฿{remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </Typography>
                
                {/* แสดงมัดจำ */}
                {depositAmount > 0 && (
                  <Typography variant="caption" color="info.main" display="block">
                    มัดจำ: ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {paymentStatus === 'delivered' ? ' (ครบ)' : 
                     paymentStatus === 'deposit_complete' ? ' (ครบ)' : 
                     paymentStatus === 'partial_deposit' ? ` (ได้ ฿${totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : 
                     ' (ยังไม่ได้)'}
                  </Typography>
                )}
                
                {/* แสดงยอดคงเหลือ */}
                <Typography 
                  variant="caption" 
                  color={paymentStatus === 'delivered' || paymentStatus === 'fully_paid' ? "success.main" : "error.main"}
                  display="block"
                  fontWeight="bold"
                >
                  คงเหลือ: {
                    paymentStatus === 'delivered' ? 'ครบแล้ว ✅' : 
                    paymentStatus === 'fully_paid' ? 'ครบแล้ว ✅' :
                    `฿${actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </Typography>
                
                {/* แสดงสถานะพิเศษ */}
                {paymentStatus === 'partial_deposit' && (
                  <Typography variant="caption" color="warning.main" display="block">
                    💰 มัดจำยังไม่ครบ
                  </Typography>
                )}
                
                {paymentStatus === 'deposit_complete' && actualRemaining > 0 && (
                  <Typography variant="caption" color="info.main" display="block">
                    ✅ มัดจำครบ คงเหลือ ฿{actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
                
                {/* เตือนหากข้อมูลไม่ตรงกัน */}
                {!priceMatchesCalculation && (
                  <Typography variant="caption" color="error.main" display="block">
                    ⚠️ ข้อมูลไม่ถูกต้อง
                  </Typography>
                )}
              </Box>
            );
          })()}
        </Box>
      </TableCell>

      {/* สถานะการชำระเงิน */}
      <TableCell>
        <Box>
          {(() => {
            const { 
              orderTotal,
              totalPaid,
              actualRemaining,
              isFullyPaid,
              paymentStatus
            } = calculateRemainingAmount(order);
            
            // กำหนดสี และข้อความสำหรับสถานะการชำระ
            let statusColor = "error.main";
            let statusText = "ยังไม่ชำระ";
            let statusIcon = "❌";
            let statusBgColor = "#ffebee";
            
            // ใช้ paymentStatus ที่คำนวณแล้วจาก calculateRemainingAmount
            switch (paymentStatus) {
              case 'delivered':
                statusColor = "success.main";
                statusText = "ชำระครบแล้ว";
                statusIcon = "✅";
                statusBgColor = "#e8f5e8";
                break;
              case 'fully_paid':
                statusColor = "success.main";
                statusText = "ชำระครบแล้ว";
                statusIcon = "✅";
                statusBgColor = "#e8f5e8";
                break;
              case 'deposit_complete':
                statusColor = "info.main";
                statusText = "ชำระมัดจำครบ";
                statusIcon = "💰";
                statusBgColor = "#e3f2fd";
                break;
              case 'partial_deposit':
                statusColor = "warning.main";
                statusText = "มัดจำไม่ครบ";
                statusIcon = "⏳";
                statusBgColor = "#fff3cd";
                break;
              case 'partial_payment':
                statusColor = "warning.main";
                statusText = "ชำระบางส่วน";
                statusIcon = "⏳";
                statusBgColor = "#fff3cd";
                break;
              case 'unpaid':
              default:
                statusColor = "error.main";
                statusText = "ยังไม่ชำระ";
                statusIcon = "❌";
                statusBgColor = "#ffebee";
                break;
            }
            
            const paymentPercentage = orderTotal > 0 ? (totalPaid / orderTotal) * 100 : 0;
            
            // สำหรับ DELIVERED แสดงยอดเต็มที่ได้รับ
            const displayPaidAmount = paymentStatus === 'delivered' ? orderTotal : totalPaid;
            
            return (
              <Box>
                <Chip
                  label={`${statusIcon} ${statusText}`}
                  size="small"
                  sx={{
                    backgroundColor: statusBgColor,
                    color: statusColor,
                    fontWeight: 600,
                    mb: 0.5
                  }}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  ได้รับ: ฿{displayPaidAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  จาก: ฿{orderTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                
                {/* แสดงข้อมูลเพิ่มเติมสำหรับ deposit_complete */}
                {paymentStatus === 'deposit_complete' && (
                  <Typography variant="caption" color="info.main" display="block">
                    มัดจำ: ฿{(order.depositAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
                
                {/* แสดงเปอร์เซ็นต์สำหรับสถานะที่ยังไม่ครบ (ไม่แสดงสำหรับ delivered และ deposit_complete) */}
                {paymentPercentage > 0 && paymentPercentage < 100 && 
                 paymentStatus !== 'deposit_complete' && 
                 paymentStatus !== 'delivered' && 
                 paymentStatus !== 'fully_paid' && (
                  <Typography variant="caption" color="info.main" display="block">
                    ({paymentPercentage.toFixed(1)}%)
                  </Typography>
                )}
                
                {/* แสดงยอดคงเหลือสำหรับ deposit_complete */}
                {paymentStatus === 'deposit_complete' && actualRemaining > 0 && (
                  <Typography variant="caption" color="warning.main" display="block">
                    คงเหลือ: ฿{actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
                
                {/* แสดงข้อมูลพิเศษสำหรับ delivered */}
                {paymentStatus === 'delivered' && totalPaid !== orderTotal && (
                  <Typography variant="caption" color="info.main" display="block">
                    แจ้งชำระ: ฿{totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
              </Box>
            );
          })()}
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
          {/* Payment Notification Alert */}
          {order.paymentNotifications && order.paymentNotifications.length > 0 && (
            <Chip
              label="💳 มีแจ้งชำระ"
              size="medium"
              variant="outlined"
              sx={{
                backgroundColor: "#ff9800",
                color: "white",
                fontWeight: "normal",
                fontSize: "0.75rem",
                height: 25,

              }}
            />
          )}
        </Box>
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
                    <TableCell>ราคาสินค้า</TableCell>
                    <TableCell>คงเหลือ</TableCell>
                    <TableCell>สถานะการชำระ</TableCell>
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
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
        <MenuItem onClick={() => {
          const order = orders.find(o => o.id === menuOrderId);
          if (order) handleManualPayment(order);
        }}>
          <MonetizationOn sx={{ mr: 1 }} fontSize="small" />
          บันทึกการชำระเงิน
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            const order = orders.find(o => o.id === menuOrderId);
            if (order) handleDeleteOrder(order);
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1, color: 'error.main' }} fontSize="small" />
          ลบออเดอร์
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

                        {/* เพิ่มส่วนแสดงการคำนวณที่ถูกต้อง */}
                        {(() => {
                          const { 
                            orderTotal,
                            totalPaid,
                            actualRemaining,
                            depositAmount,
                            remainingAmount,
                            isDepositComplete,
                            isFullyPaid,
                            paymentStatus,
                            priceMatchesCalculation,
                            calculatedPrice
                          } = calculateRemainingAmount(selectedOrder);
                          
                          return (
                            <>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 1 }}>
                                รายละเอียดการชำระเงิน
                              </Typography>
                              
                              {/* แสดงสูตรการคำนวณ */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                  สูตรคำนวณ:
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} + ฿{remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} = ฿{calculatedPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                              
                              {/* แสดงมัดจำ */}
                              {depositAmount > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                    มัดจำ:
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" fontWeight="bold" color="info.main">
                                      ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </Typography>
                                    <Chip
                                      label={
                                        paymentStatus === 'delivered' ? 'ชำระครบแล้ว' : 
                                        paymentStatus === 'deposit_complete' ? 'มัดจำครบ' : 
                                        paymentStatus === 'partial_deposit' ? `ได้รับ ฿${totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : 
                                        'ยังไม่ได้รับ'
                                      }
                                      size="small"
                                      color={
                                        paymentStatus === 'delivered' || paymentStatus === 'deposit_complete' ? 'success' :
                                        paymentStatus === 'partial_deposit' ? 'warning' : 'error'
                                      }
                                    />
                                  </Box>
                                </Box>
                              )}
                              
                              {/* แสดงยอดที่ได้รับแล้ว */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                  ได้รับแล้ว:
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  ฿{totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                              
                              {/* แสดงยอดคงเหลือ */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                  คงเหลือ:
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography 
                                    variant="h6" 
                                    fontWeight="bold" 
                                    color={paymentStatus === 'delivered' || paymentStatus === 'fully_paid' ? "success.main" : "error.main"}
                                  >
                                    {paymentStatus === 'delivered' || paymentStatus === 'fully_paid' ? 
                                      'ชำระครบแล้ว ✅' : 
                                      `฿${actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                                    }
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* แสดงสถานะพิเศษ */}
                              {paymentStatus === 'partial_deposit' && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    💰 <strong>มัดจำไม่ครบ:</strong> ได้รับ ฿{totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })} จากมัดจำที่ต้องจ่าย ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </Typography>
                                </Alert>
                              )}
                              
                              {paymentStatus === 'deposit_complete' && actualRemaining > 0 && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    ✅ <strong>มัดจำครบแล้ว:</strong> ยังคงเหลือที่ต้องชำระอีก ฿{actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </Typography>
                                </Alert>
                              )}
                              
                              {paymentStatus === 'delivered' && (
                                <Alert severity="success" sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    🚚 <strong>ส่งมอบแล้ว:</strong> หมายความว่าได้รับเงินครบ ฿{orderTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} แล้ว
                                  </Typography>
                                </Alert>
                              )}
                              
                              {/* เตือนหากข้อมูลไม่ตรงกัน */}
                              {!priceMatchesCalculation && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    ⚠️ <strong>ข้อมูลไม่สอดคล้อง:</strong> ยอดรวมในระบบ (฿{orderTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}) ไม่เท่ากับมัดจำ + ส่วนที่เหลือ (฿{calculatedPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}) กรุณาตรวจสอบข้อมูล
                                  </Typography>
                                </Alert>
                              )}
                            </>
                          );
                        })()}

                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                            ประเภทการชำระ:
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

                {/* Admin Comment */}
                {selectedOrder.adminComment && (
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: 1,
                      width: "100%",
                      mb: 2,
                      mt: 2,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Edit color="action" />
                        <Typography variant="h6" fontWeight="bold">
                          💬 ข้อความจากผู้ดูแลระบบ
                        </Typography>
                      </Box>
                      
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
                            whiteSpace: "pre-wrap", // Preserve line breaks
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
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: 1,
                      width: "100%",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                        <Payment color="action" />
                        <Typography variant="h6" fontWeight="bold">
                          การแจ้งชำระเงิน ({selectedOrder.paymentNotifications.length} รายการ)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {selectedOrder.paymentNotifications.map((notification, index) => (
                          <Box
                            key={notification.id}
                            sx={{
                              p: { xs: 2, sm: 3 },
                              borderRadius: 2,
                              backgroundColor: index % 2 === 0 ? "background.default" : "transparent",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                การแจ้งชำระ #{index + 1}
                              </Typography>

                            </Box>

                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  จำนวนเงิน
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  ฿{notification.transferAmount.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  วันที่โอน
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formatDate(notification.transferDate)}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  วันที่แจ้ง
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formatDate(notification.submittedAt)}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Payment Slip */}
                            {notification.paymentSlipData && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                                    border: "1px solid",
                                    borderColor: "divider",
                                    cursor: "pointer",
                                    "&:hover": {
                                      transform: "scale(1.02)",
                                      boxShadow: 2,
                                    },
                                    transition: "all 0.2s ease",
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
                                          <head><title>หลักฐานการโอนเงิน - ${selectedOrder.orderNumber}</title></head>
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
                      </Box>
                    </CardContent>
                  </Card>
                )}
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
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
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

            <TextField
              fullWidth
              multiline
              rows={3}
              label="ข้อความถึงลูกค้า (ไม่บังคับ)"
              placeholder="เช่น เหตุผลการยกเลิก, ข้อมูลการจัดส่ง, หรือข้อความอื่นๆ"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              variant="outlined"
              helperText=""
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            disabled={isUpdatingStatus}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, newStatus)}
            disabled={!newStatus || newStatus === selectedOrder?.status || isUpdatingStatus}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
              minWidth: 100, // ป้องกันการเปลี่ยนขนาดปุ่ม
            }}
            startIcon={isUpdatingStatus ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isUpdatingStatus ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Payment Dialog */}
      <Dialog
        open={manualPaymentDialogOpen}
        onClose={() => setManualPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MonetizationOn color="primary" />
            <Box>
              <Typography variant="h6">บันทึกการชำระเงิน</Typography>
              <Typography variant="caption" color="text.secondary">
                ออเดอร์ #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(-8)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 1 }}>
              {/* Order Summary */}
              <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                  สรุปออเดอร์
                </Typography>
                
                {(() => {
                  const { 
                    orderTotal,
                    totalPaid,
                    actualRemaining,
                    depositAmount,
                    remainingAmount,
                    isDepositComplete,
                    isFullyPaid,
                    paymentStatus,
                    priceMatchesCalculation,
                    displayInfo
                  } = calculateRemainingAmount(selectedOrder);
                  
                  return (
                    <>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2">ราคาสินค้า:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "primary.main" }}>
                          ฿{orderTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                        (มัดจำ ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + คงเหลือ ฿{remainingAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </Typography>
                      
                      {/* แสดงรายละเอียดมัดจำ */}
                      {depositAmount > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2" color="info.main">มัดจำ:</Typography>
                          <Typography variant="body2" color="info.main" sx={{ fontWeight: "bold" }}>
                            ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {paymentStatus === 'delivered' ? ' (ครบ)' : 
                             paymentStatus === 'deposit_complete' ? ' (ครบ)' : 
                             paymentStatus === 'partial_deposit' ? ` (ได้ ฿${totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : 
                             ' (ยังไม่ได้)'}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2">ยอดที่ได้รับแล้ว:</Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: "bold" }}>
                          ฿{totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>คงเหลือ:</Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: "bold", 
                          color: paymentStatus === 'delivered' || paymentStatus === 'fully_paid' ? "success.main" : "error.main" 
                        }}>
                          {paymentStatus === 'delivered' ? "ครบแล้ว ✅" : 
                           paymentStatus === 'fully_paid' ? "ครบแล้ว ✅" :
                           `฿${actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Typography>
                      </Box>
                      
                      {/* แสดงสถานะพิเศษ */}
                      {paymentStatus === 'partial_deposit' && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          💰 มัดจำไม่ครบ: ได้รับ ฿{totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} จากมัดจำ ฿{depositAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Alert>
                      )}
                      
                      {/* เตือนหากข้อมูลไม่ตรงกัน */}
                      {!priceMatchesCalculation && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          ⚠️ ข้อมูลไม่สมบูรณ์: totalAmount ≠ depositAmount + remainingAmount
                        </Alert>
                      )}
                      
                      {paymentStatus === 'deposit_complete' && actualRemaining > 0 && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          ✅ มัดจำครบแล้ว ยังขาดอีก ฿{actualRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Alert>
                      )}
                      
                      {paymentStatus === 'delivered' && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          🚚 สถานะ "ส่งมอบแล้ว" = ได้รับเงินครบ ฿{orderTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} แล้ว
                        </Alert>
                      )}
                    </>
                  );
                })()}
              </Card>

              {/* Payment Form */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="จำนวนเงินที่ได้รับ (บาท)"
                  type="number"
                  value={manualPaymentData.amount}
                  onChange={(e) => setManualPaymentData({
                    ...manualPaymentData,
                    amount: e.target.value
                  })}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
                
                <FormControl fullWidth required>
                  <InputLabel>วิธีการชำระเงิน</InputLabel>
                  <Select
                    value={manualPaymentData.paymentMethod}
                    onChange={(e) => setManualPaymentData({
                      ...manualPaymentData,
                      paymentMethod: e.target.value
                    })}
                    label="วิธีการชำระเงิน"
                  >
                    <MenuItem value="CASH">เงินสด</MenuItem>
                    <MenuItem value="TRANSFER">โอนเงิน</MenuItem>
                    <MenuItem value="CREDIT_CARD">บัตรเครดิต</MenuItem>
                    <MenuItem value="QR_CODE">QR Code</MenuItem>
                    <MenuItem value="OTHER">อื่นๆ</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="วันที่ได้รับเงิน"
                    type="date"
                    value={manualPaymentData.paymentDate}
                    onChange={(e) => setManualPaymentData({
                      ...manualPaymentData,
                      paymentDate: e.target.value
                    })}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="เวลา"
                    type="time"
                    value={manualPaymentData.paymentTime}
                    onChange={(e) => setManualPaymentData({
                      ...manualPaymentData,
                      paymentTime: e.target.value
                    })}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                
                <TextField
                  label="หมายเหตุ (ถ้ามี)"
                  value={manualPaymentData.note}
                  onChange={(e) => setManualPaymentData({
                    ...manualPaymentData,
                    note: e.target.value
                  })}
                  multiline
                  rows={2}
                  fullWidth
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={manualPaymentData.autoComplete}
                      onChange={(e) => setManualPaymentData({
                        ...manualPaymentData,
                        autoComplete: e.target.checked
                      })}
                    />
                  }
                  label="เปลี่ยนสถานะเป็น 'ส่งมอบแล้ว' อัตโนมัติเมื่อชำระครบ"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setManualPaymentDialogOpen(false)}
            disabled={isRecordingPayment}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={recordManualPayment}
            variant="contained"
            disabled={isRecordingPayment || !manualPaymentData.amount}
            startIcon={isRecordingPayment ? <CircularProgress size={16} /> : <MonetizationOn />}
          >
            {isRecordingPayment ? "กำลังบันทึก..." : "บันทึกการชำระเงิน"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Order Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Delete color="error" />
            <Box>
              <Typography variant="h6" color="error">
                ยืนยันการลบออเดอร์
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ออเดอร์ #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(-8)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้
            </Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            คุณต้องการลบออเดอร์นี้หรือไม่? ระบบจะดำเนินการดังนี้:
          </Typography>
          
          <Box sx={{ ml: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • 🗑️ ลบออเดอร์และข้อมูลที่เกี่ยวข้อง
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • 📦 คืน stock ของสินค้าทั้งหมดในออเดอร์
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • 💳 ลบประวัติการชำระเงิน
            </Typography>
          </Box>

          {selectedOrder && (
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                รายละเอียดออเดอร์
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">ลูกค้า:</Typography>
                <Typography variant="body2">{selectedOrder.user.displayName}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">ยอดรวม:</Typography>
                <Typography variant="body2">฿{selectedOrder.totalAmount.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">จำนวนสินค้า:</Typography>
                <Typography variant="body2">{selectedOrder.orderItems.length} รายการ</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">สถานะ:</Typography>
                <Chip
                  label={getStatusInfo(selectedOrder.status).label}
                  color={getStatusInfo(selectedOrder.status).color as any}
                  size="small"
                />
              </Box>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            disabled={isDeletingOrder}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={deleteOrder}
            variant="contained"
            color="error"
            disabled={isDeletingOrder}
            startIcon={isDeletingOrder ? <CircularProgress size={16} /> : <Delete />}
            sx={{ ml: 1 }}
          >
            {isDeletingOrder ? "กำลังลบ..." : "ลบออเดอร์"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Beautiful Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 3,
            minWidth: 300,
          }
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{
            borderRadius: 3,
            fontWeight: 500,
            fontSize: "0.95rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            backdropFilter: "blur(8px)",
            "& .MuiAlert-icon": {
              fontSize: "1.2rem",
            },
            "& .MuiAlert-message": {
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
            ...(snackbar.severity === 'success' && {
              background: `linear-gradient(135deg, ${colors.success}, #43A047)`,
              "& .MuiAlert-icon": {
                color: "white",
              },
            }),
            ...(snackbar.severity === 'error' && {
              background: `linear-gradient(135deg, ${colors.error}, #D32F2F)`,
              "& .MuiAlert-icon": {
                color: "white",
              },
            }),
            ...(snackbar.severity === 'warning' && {
              background: `linear-gradient(135deg, ${colors.warning}, #F57C00)`,
              "& .MuiAlert-icon": {
                color: "white",
              },
            }),
            ...(snackbar.severity === 'info' && {
              background: `linear-gradient(135deg, ${colors.info}, #1976D2)`,
              "& .MuiAlert-icon": {
                color: "white",
              },
            }),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            <span>{snackbar.message}</span>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}
