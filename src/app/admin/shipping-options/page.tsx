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
  Chip,
  CircularProgress,
  InputAdornment,
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

interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedDays?: number | string;
  method?: string;
  forPetsOnly?: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function ShippingOptionsPage() {
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingMethods, setShippingMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);
  
  // Form states
  interface FormState {
    name: string;
    description: string;
    price: number;
    estimatedDays: string | number;
    isActive: boolean;
    sortOrder: number;
    method?: string;
    forPetsOnly?: boolean;
  }
  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    price: 0,
    estimatedDays: 0,
    isActive: true,
    sortOrder: 0,
    method: "",
    forPetsOnly: false,
  });

  const fetchShippingOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/shipping-options?includeInactive=true");
      if (response.ok) {
        const data = await response.json();
        setShippingOptions(data);
      } else {
        showSnackbar("ไม่สามารถโหลดข้อมูลค่าจัดส่งได้", "error");
      }
    } catch (error) {
      console.error("Error fetching shipping options:", error);
      showSnackbar("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingOptions();
    (async () => {
      try {
        const res = await fetch('/api/shipping-options?meta=methods');
        if (res.ok) {
          const methods = await res.json();
          if (Array.isArray(methods)) setShippingMethods(methods);
        }
      } catch {}
    })();
  }, []);

  const handleOpenDialog = (option?: ShippingOption) => {
    if (option) {
      setEditingOption(option);
      setFormData({
        name: option.name,
        description: option.description || "",
        price: option.price,
        estimatedDays: (typeof option.estimatedDays === 'string' ? option.estimatedDays : (option.estimatedDays || 0)) as any,
        method: option.method || "",
        forPetsOnly: !!option.forPetsOnly,
        isActive: option.isActive,
        sortOrder: option.sortOrder,
      });
    } else {
      setEditingOption(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        estimatedDays: 0,
        method: shippingMethods[0] || "delivery",
        forPetsOnly: false,
        isActive: true,
        sortOrder: shippingOptions.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOption(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || formData.price < 0) {
        showSnackbar("กรุณากรอกชื่อและราคาที่ถูกต้อง", "error");
        return;
      }

      const method = editingOption ? "PUT" : "POST";
      const body = editingOption 
        ? { id: editingOption.id, ...formData }
        : formData;

      const response = await fetch("/api/shipping-options", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showSnackbar(editingOption ? "อัพเดทสำเร็จ" : "เพิ่มค่าจัดส่งสำเร็จ", "success");
        await fetchShippingOptions();
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error saving shipping option:", error);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteOptionId) return;

    try {
      const response = await fetch(`/api/shipping-options?id=${deleteOptionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSnackbar("ลบค่าจัดส่งสำเร็จ", "success");
        await fetchShippingOptions();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาดในการลบ", "error");
      }
    } catch (error) {
      console.error("Error deleting shipping option:", error);
      showSnackbar("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteOptionId(null);
    }
  };

  const handleToggleActive = async (option: ShippingOption) => {
    try {
      const response = await fetch("/api/shipping-options", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: option.id,
          isActive: !option.isActive,
        }),
      });

      if (response.ok) {
        showSnackbar(`${!option.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}สำเร็จ`, "success");
        await fetchShippingOptions();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error toggling shipping option:", error);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const paginatedOptions = shippingOptions.slice(
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
            จัดการค่าจัดส่ง
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
              mt: 0.5
            }}
          >
            เพิ่ม แก้ไข และจัดการค่าจัดส่ง
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
          เพิ่มค่าจัดส่ง
        </Button>
      </Box>

      {/* Desktop Table View */}
      <Card sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: colors.background.paper }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ชื่อ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>คำอธิบาย</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>วิธีจัดส่ง</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>สำหรับสัตว์เลี้ยง</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ราคา</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ระยะเวลาจัดส่ง (วัน)</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>สถานะ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ลำดับ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>การจัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOptions.map((option) => (
                <TableRow key={option.id} hover>
                  <TableCell sx={{ fontWeight: "medium" }}>{option.name}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {option.description || "-"}
                  </TableCell>
                  <TableCell>{option.method || '-'}</TableCell>
                  <TableCell>
                    <Chip label={option.forPetsOnly ? 'สัตว์เลี้ยง' : 'ทั่วไป'} size="small" color={option.forPetsOnly ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "medium", color: colors.primary.main }}>
                    {formatPrice(option.price)}
                  </TableCell>
                  <TableCell>
                    {option.estimatedDays ? `${option.estimatedDays} วัน` : "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={option.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      color={option.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{option.sortOrder}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(option)}
                      sx={{ mr: 1 }}
                    >
                      {option.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(option)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteOptionId(option.id);
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
          count={shippingOptions.length}
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
        {paginatedOptions.map((option) => (
          <Card key={option.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                    {option.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                    {option.method && (
                      <Chip label={option.method} size="small" variant="outlined" />
                    )}
                    <Chip 
                      label={option.forPetsOnly ? 'สัตว์เลี้ยง' : 'ทั่วไป'} 
                      size="small" 
                      color={option.forPetsOnly ? 'warning' : 'default'}
                    />
                  </Box>
                </Box>
                <Chip
                  label={option.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  color={option.isActive ? "success" : "default"}
                  size="small"
                />
              </Box>
              
              {option.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {option.description}
                </Typography>
              )}
              
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">ราคา</Typography>
                  <Typography variant="h6" sx={{ color: colors.primary.main, fontWeight: "bold" }}>
                    {formatPrice(option.price)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ระยะเวลาจัดส่ง</Typography>
                  <Typography variant="body2">
                    {option.estimatedDays ? `${option.estimatedDays} วัน` : "-"}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">วิธีจัดส่ง</Typography>
                  <Typography variant="body2">{option.method || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ลำดับ</Typography>
                  <Typography variant="body2">{option.sortOrder}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleActive(option)}
                  color={option.isActive ? "warning" : "success"}
                >
                  {option.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(option)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setDeleteOptionId(option.id);
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
            count={shippingOptions.length}
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
          {editingOption ? "แก้ไขค่าจัดส่ง" : "เพิ่มค่าจัดส่ง"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="ชื่อ *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="เช่น จัดส่งปกติ, จัดส่งด่วน"
            />

            <TextField
              label="คำอธิบาย"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการจัดส่ง"
            />

            <TextField
              label="ราคา *"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              label="ระยะเวลาจัดส่ง (วัน)"
              value={formData.estimatedDays}
              onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
              fullWidth
              placeholder="เช่น 3-5 วัน หรือ 5"
            />

            <TextField
              label="ลำดับการแสดง"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              fullWidth
              inputProps={{ min: 0 }}
            />

            <TextField
              label="วิธีการจัดส่ง"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              fullWidth
              placeholder={shippingMethods.length ? `เลือกจาก: ${shippingMethods.join(', ')}` : 'เช่น delivery/self_pickup'}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!formData.forPetsOnly}
                  onChange={(e) => setFormData({ ...formData, forPetsOnly: e.target.checked })}
                />
              }
              label="สำหรับสัตว์เลี้ยงเท่านั้น"
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
            {editingOption ? "อัพเดท" : "เพิ่ม"}
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
          <Typography>คุณแน่ใจหรือไม่ที่จะลบค่าจัดส่งนี้?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <SnackbarComponent />
    </Box>
  );
}