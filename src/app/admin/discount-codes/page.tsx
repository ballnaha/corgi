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
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { th } from 'date-fns/locale';
import { colors } from "@/theme/colors";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  minAmount?: number;
  description: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const discountTypeOptionsDefault = [
  { value: "PERCENTAGE", label: "เปอร์เซ็นต์ (%)" },
  { value: "FIXED_AMOUNT", label: "จำนวนเงินคงที่ (บาท)" },
];

export default function DiscountCodesPage() {
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [discountTypeOptions, setDiscountTypeOptions] = useState(discountTypeOptionsDefault);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: 0,
    minAmount: 0,
    description: "",
    isActive: true,
    validFrom: null as Date | null,
    validUntil: null as Date | null,
    usageLimit: null as number | null,
  });

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/discount-codes?includeInactive=true");
      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data);
      } else {
        showSnackbar("ไม่สามารถโหลดข้อมูลส่วนลดได้", "error");
      }
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      showSnackbar("เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
    (async () => {
      try {
        const res = await fetch('/api/discount-codes?meta=types');
        if (res.ok) {
          const types = await res.json();
          if (Array.isArray(types)) {
            setDiscountTypeOptions(types);
          }
        }
      } catch {}
    })();
  }, []);

  const handleOpenDialog = (code?: DiscountCode) => {
    if (code) {
      setEditingCode(code);
      setFormData({
        code: code.code,
        type: code.type,
        value: code.value,
        minAmount: code.minAmount || 0,
        description: code.description,
        isActive: code.isActive,
        validFrom: code.validFrom ? new Date(code.validFrom) : null,
        validUntil: code.validUntil ? new Date(code.validUntil) : null,
        usageLimit: code.usageLimit || null,
      });
    } else {
      setEditingCode(null);
      setFormData({
        code: "",
        type: "PERCENTAGE",
        value: 0,
        minAmount: 0,
        description: "",
        isActive: true,
        validFrom: null,
        validUntil: null,
        usageLimit: null,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCode(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || formData.value <= 0) {
        showSnackbar("กรุณากรอกรหัสส่วนลดและค่าส่วนลดที่ถูกต้อง", "error");
        return;
      }

      const method = editingCode ? "PUT" : "POST";
      const body = editingCode 
        ? { id: editingCode.id, ...formData }
        : formData;
      
      console.log("Sending data to API:", JSON.stringify(body, null, 2)); // Debug log

      const response = await fetch("/api/discount-codes", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showSnackbar(editingCode ? "อัพเดทสำเร็จ" : "เพิ่มรหัสส่วนลดสำเร็จ", "success");
        await fetchDiscountCodes();
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        console.log("API Error Response:", errorData); // Debug log
        showSnackbar(errorData.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error saving discount code:", error);
      showSnackbar("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteCodeId) return;

    try {
      const response = await fetch(`/api/discount-codes?id=${deleteCodeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showSnackbar("ลบรหัสส่วนลดสำเร็จ", "success");
        await fetchDiscountCodes();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาดในการลบ", "error");
      }
    } catch (error) {
      console.error("Error deleting discount code:", error);
      showSnackbar("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteCodeId(null);
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const response = await fetch("/api/discount-codes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: code.id,
          isActive: !code.isActive,
        }),
      });

      if (response.ok) {
        showSnackbar(`${!code.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}สำเร็จ`, "success");
        await fetchDiscountCodes();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Error toggling discount code:", error);
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSnackbar("คัดลอกรหัสส่วนลดแล้ว", "success");
  };

  const formatValue = (code: DiscountCode) => {
    if (code.type === "PERCENTAGE") {
      return `${code.value}%`;
    } else {
      return `฿${code.value.toLocaleString()}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, code: `SAVE${randomCode}` });
  };

  const paginatedCodes = discountCodes.slice(
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
            จัดการรหัสส่วนลด
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", md: "1rem" },
              mt: 0.5
            }}
          >
            เพิ่ม แก้ไข และจัดการรหัสส่วนลด
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
          เพิ่มรหัสส่วนลด
        </Button>
      </Box>

      {/* Desktop Table View */}
      <Card sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: colors.background.paper }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>รหัส</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ประเภท</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ค่าส่วนลด</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ยอดขั้นต่ำ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>คำอธิบาย</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>สถานะ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>การใช้งาน</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>วันหมดอายุ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>การจัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCodes.map((code) => (
                <TableRow key={code.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: "medium", fontFamily: "monospace" }}>
                        {code.code}
                      </Typography>
                      <IconButton size="small" onClick={() => handleCopyCode(code.code)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={discountTypeOptions.find(opt => opt.value === code.type)?.label || code.type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "medium", color: colors.primary.main }}>
                    {formatValue(code)}
                  </TableCell>
                  <TableCell>
                    {code.minAmount ? `฿${code.minAmount.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {code.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={code.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      color={code.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {code.usageCount}
                      {code.usageLimit ? `/${code.usageLimit}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(code.validUntil)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(code)}
                      sx={{ mr: 1 }}
                    >
                      {code.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(code)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteCodeId(code.id);
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
          count={discountCodes.length}
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
        {paginatedCodes.map((code) => (
          <Card key={code.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                      {code.code}
                    </Typography>
                    <IconButton size="small" onClick={() => handleCopyCode(code.code)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={discountTypeOptions.find(opt => opt.value === code.type)?.label || code.type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Chip
                  label={code.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  color={code.isActive ? "success" : "default"}
                  size="small"
                />
              </Box>
              
              {code.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {code.description}
                </Typography>
              )}
              
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">ค่าส่วนลด</Typography>
                  <Typography variant="h6" sx={{ color: colors.primary.main, fontWeight: "bold" }}>
                    {formatValue(code)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ยอดขั้นต่ำ</Typography>
                  <Typography variant="body2">
                    {code.minAmount ? `฿${code.minAmount.toLocaleString()}` : "-"}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">การใช้งาน</Typography>
                  <Typography variant="body2">
                    {code.usageCount}{code.usageLimit ? `/${code.usageLimit}` : ""}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">วันหมดอายุ</Typography>
                  <Typography variant="body2">{formatDate(code.validUntil)}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleActive(code)}
                  color={code.isActive ? "warning" : "success"}
                >
                  {code.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(code)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setDeleteCodeId(code.id);
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
            count={discountCodes.length}
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
          {editingCode ? "แก้ไขรหัสส่วนลด" : "เพิ่มรหัสส่วนลด"}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="รหัสส่วนลด *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  sx={{ flex: 1 }}
                  placeholder="SAVE10"
                />
                <Button variant="outlined" onClick={generateCode}>
                  สุ่มรหัส
                </Button>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>ประเภทส่วนลด *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="ประเภทส่วนลด *"
                >
                  {discountTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label={formData.type === "PERCENTAGE" ? "ส่วนลด (%) *" : "ส่วนลด (บาท) *"}
                type="number"
                value={formData.value}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseFloat(value);
                  setFormData({ ...formData, value: isNaN(numValue) ? 0 : numValue });
                }}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">
                    {formData.type === "PERCENTAGE" ? "%" : "฿"}
                  </InputAdornment>,
                }}
                inputProps={{ min: 0, step: formData.type === "PERCENTAGE" ? 1 : 0.01 }}
              />

              <TextField
                label="ยอดซื้อขั้นต่ำ"
                type="number"
                value={formData.minAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseFloat(value);
                  setFormData({ ...formData, minAmount: isNaN(numValue) ? 0 : numValue });
                }}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />

              <TextField
                label="คำอธิบาย"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="รายละเอียดส่วนลด"
              />

              <TextField
                label="จำนวนครั้งที่ใช้ได้"
                type="number"
                value={formData.usageLimit || ""}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                fullWidth
                placeholder="ไม่จำกัด"
                inputProps={{ min: 1 }}
              />

              <DateTimePicker
                label="วันที่เริ่มใช้"
                value={formData.validFrom}
                onChange={(newValue) => setFormData({ ...formData, validFrom: newValue as Date | null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />

              <DateTimePicker
                label="วันที่หมดอายุ"
                value={formData.validUntil}
                onChange={(newValue) => setFormData({ ...formData, validUntil: newValue as Date | null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                  },
                }}
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
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">
            {editingCode ? "อัพเดท" : "เพิ่ม"}
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
          <Typography>คุณแน่ใจหรือไม่ที่จะลบรหัสส่วนลดนี้?</Typography>
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