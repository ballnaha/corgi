"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  TablePagination,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const paymentTypeOptions = [
  { value: "credit_card", label: "บัตรเครดิต" },
  { value: "bank_transfer", label: "โอนเงิน" },
  { value: "e_wallet", label: "กระเป๋าเงินอิเล็กทรอนิกส์" },
  { value: "cash_on_delivery", label: "เก็บเงินปลายทาง" },
];

export default function PaymentMethodsPage() {
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    icon: "",
    isActive: true,
    sortOrder: 0,
  });

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else {
        showSnackbar("ไม่สามารถโหลดข้อมูลช่องทางการชำระเงินได้", "error");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      showSnackbar("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        description: method.description || "",
        icon: method.icon || "",
        isActive: method.isActive,
        sortOrder: method.sortOrder,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: "",
        type: "",
        description: "",
        icon: "",
        isActive: true,
        sortOrder: paymentMethods.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.type) {
        showSnackbar("กรุณากรอกชื่อและประเภทการชำระเงิน", "error");
        return;
      }

      const method = editingMethod ? "PUT" : "POST";
      const body = editingMethod 
        ? { id: editingMethod.id, ...formData }
        : formData;

      const response = await fetch("/api/payment-methods", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showSnackbar(editingMethod ? "อัพเดทสำเร็จ" : "เพิ่มช่องทางการชำระเงินสำเร็จ", "success");
        await fetchPaymentMethods();
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteMethodId) return;

    try {
      const response = await fetch(`/api/payment-methods?id=${deleteMethodId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSnackbar("ลบช่องทางการชำระเงินสำเร็จ", "success");
        await fetchPaymentMethods();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาดในการลบ", "error");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      showSnackbar("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteMethodId(null);
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const response = await fetch("/api/payment-methods", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: method.id,
          isActive: !method.isActive,
        }),
      });

      if (response.ok) {
        showSnackbar(`${!method.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}สำเร็จ`, "success");
        await fetchPaymentMethods();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error toggling payment method:", error);
      showSnackbar("เกิดข้อผิดพลาดในการอัพเดทสถานะ", "error");
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTypeLabel = (type: string) => {
    const option = paymentTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  const paginatedMethods = paymentMethods.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 2, sm: 0 },
        mb: 3
      }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: colors.text.primary,
              fontWeight: "bold",
              fontSize: { xs: "1.5rem", md: "2.125rem" }
            }}
          >
            จัดการช่องทางการชำระเงิน
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
              mt: 0.5
            }}
          >
            เพิ่ม แก้ไข และจัดการช่องทางการชำระเงิน
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: colors.primary.main,
            "&:hover": { backgroundColor: colors.primary.dark },
            minWidth: { xs: "100%", sm: "auto" }
          }}
        >
          เพิ่มช่องทางการชำระเงิน
        </Button>
      </Box>

      {/* Desktop Table View */}
      <Card sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: colors.background.paper }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ชื่อ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ประเภท</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>คำอธิบาย</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ไอคอน</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>สถานะ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ลำดับ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>การจัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMethods.map((method) => (
                <TableRow key={method.id} hover>
                  <TableCell sx={{ fontWeight: "medium" }}>{method.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeLabel(method.type)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {method.description || "-"}
                  </TableCell>
                  <TableCell>{method.icon || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={method.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      color={method.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{method.sortOrder}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(method)}
                      sx={{ mr: 1 }}
                    >
                      {method.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(method)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteMethodId(method.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={paymentMethods.length}
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

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {paginatedMethods.map((method) => (
          <Card key={method.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {method.name}
                    </Typography>
                    {method.icon && (
                      <Typography variant="h6">{method.icon}</Typography>
                    )}
                  </Box>
                  <Chip
                    label={getTypeLabel(method.type)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Box>
                <Chip
                  label={method.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  color={method.isActive ? "success" : "default"}
                  size="small"
                />
              </Box>
              
              {method.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {method.description}
                </Typography>
              )}
              
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">ไอคอน</Typography>
                  <Typography variant="body2">{method.icon || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ลำดับ</Typography>
                  <Typography variant="body2">{method.sortOrder}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleActive(method)}
                  color={method.isActive ? "warning" : "success"}
                >
                  {method.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(method)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setDeleteMethodId(method.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
        
        {/* Mobile Pagination */}
        <Card>
          <TablePagination
            component="div"
            count={paymentMethods.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="รายการต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
            sx={{ borderTop: "none" }}
          />
        </Card>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingMethod ? "แก้ไขช่องทางการชำระเงิน" : "เพิ่มช่องทางการชำระเงิน"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="ชื่อ *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>ประเภท *</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="ประเภท *"
              >
                {paymentTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="คำอธิบาย"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="ไอคอน"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              fullWidth
              placeholder="💳, 🏦, 📱, etc."
            />

            <TextField
              label="ลำดับการแสดง"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="เปิดใช้งาน"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">
            {editingMethod ? "อัพเดท" : "เพิ่ม"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>คุณแน่ใจหรือไม่ที่จะลบช่องทางการชำระเงินนี้?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarComponent />
    </Box>
  );
}