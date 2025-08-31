"use client";

import React, { useState, useEffect } from 'react';
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
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowBack,
  Save,
  Palette,
  Category as CategoryIcon,
  DragIndicator
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { colors } from '@/theme/colors';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    posts: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultColors = [
  '#4CAF50', '#2196F3', '#FF9800', '#F44336', 
  '#9C27B0', '#607D8B', '#795548', '#E91E63',
  '#3F51B5', '#009688', '#FFC107', '#8BC34A'
];

export default function AdminBlogCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    category: BlogCategory | null;
  }>({ open: false, mode: 'create', category: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: BlogCategory | null;
  }>({ open: false, category: null });

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    color: defaultColors[0],
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || 'ไม่สามารถโหลดหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9ก-ฮ\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name' && value) {
      const autoSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: autoSlug
      }));
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit', category?: BlogCategory) => {
    if (mode === 'edit' && category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || defaultColors[0],
        isActive: category.isActive,
        sortOrder: category.sortOrder
      });
    } else {
      // Find next sort order
      const maxSortOrder = Math.max(...categories.map(c => c.sortOrder), 0);
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: defaultColors[0],
        isActive: true,
        sortOrder: maxSortOrder + 1
      });
    }

    setDialog({ open: true, mode, category: category || null });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: 'create', category: null });
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: defaultColors[0],
      isActive: true,
      sortOrder: 0
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่');
      return false;
    }
    if (!formData.slug.trim()) {
      setError('กรุณากรอก Slug');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const url = dialog.mode === 'create' 
        ? '/api/admin/blog/categories'
        : `/api/admin/blog/categories/${dialog.category?.id}`;
      
      const method = dialog.mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(dialog.mode === 'create' ? 'สร้างหมวดหมู่เรียบร้อยแล้ว' : 'อัปเดตหมวดหมู่เรียบร้อยแล้ว');
        fetchCategories();
        handleCloseDialog();
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setError('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      const response = await fetch(`/api/admin/blog/categories/${deleteDialog.category.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('ลบหมวดหมู่เรียบร้อยแล้ว');
        fetchCategories();
      } else {
        setError(data.error || 'ไม่สามารถลบหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('เกิดข้อผิดพลาดในการลบหมวดหมู่');
    } finally {
      setDeleteDialog({ open: false, category: null });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => router.push('/admin/blog')}
          sx={{ mr: 2, color: colors.text.secondary }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: colors.text.primary, mb: 1 }}>
            จัดการหมวดหมู่บทความ
          </Typography>
          <Typography variant="body1" sx={{ color: colors.text.secondary }}>
            เพิ่ม แก้ไข และจัดการหมวดหมู่บทความ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create')}
          sx={{ 
            backgroundColor: colors.primary.main,
            '&:hover': { backgroundColor: colors.primary.dark }
          }}
        >
          เพิ่มหมวดหมู่ใหม่
        </Button>
      </Box>

      {/* Categories Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: colors.background.paper }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ลำดับ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ชื่อหมวดหมู่</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>สี</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>จำนวนบทความ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>สถานะ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>วันที่สร้าง</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>กำลังโหลด...</Typography>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">ไม่พบหมวดหมู่</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DragIndicator sx={{ color: colors.text.secondary, cursor: 'grab' }} />
                        <Typography variant="body2">{category.sortOrder}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {category.name}
                      </Typography>
                      {category.description && (
                        <Typography variant="caption" color="text.secondary">
                          {category.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: category.color || '#ccc',
                            border: '1px solid #ddd'
                          }}
                        />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {category.color}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${category._count?.posts || 0} บทความ`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        color={category.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(category.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', category)}
                          sx={{ color: colors.warning }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, category })}
                          sx={{ color: colors.error }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialog.mode === 'create' ? 'เพิ่มหมวดหมู่ใหม่' : 'แก้ไขหมวดหมู่'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, mt: 2 }}>
            {/* Form Fields */}
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="ชื่อหมวดหมู่ *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Slug *"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                sx={{ mb: 2 }}
                helperText="URL ของหมวดหมู่ เช่น general-tips"
              />

              <TextField
                fullWidth
                label="คำอธิบาย"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="ลำดับการแสดง"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="เปิดใช้งาน"
              />
            </Box>

            {/* Color Picker */}
            <Box sx={{ width: { xs: '100%', md: '250px' } }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                สีหมวดหมู่
              </Typography>

              <TextField
                fullWidth
                label="รหัสสี"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: formData.color,
                          border: '1px solid #ddd'
                        }}
                      />
                    </InputAdornment>
                  )
                }}
              />

              <Typography variant="body2" sx={{ mb: 1, color: colors.text.secondary }}>
                สีที่แนะนำ:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {defaultColors.map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '1px solid #ddd',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                    onClick={() => handleInputChange('color', color)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
            {dialog.mode === 'create' ? 'สร้าง' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
      >
        <DialogTitle>ยืนยันการลบหมวดหมู่</DialogTitle>
        <DialogContent>
          <Typography>
            คุณแน่ใจหรือว่าต้องการลบหมวดหมู่ "{deleteDialog.category?.name}"
            {deleteDialog.category?._count?.posts && deleteDialog.category._count.posts > 0 && (
              <><br />หมวดหมู่นี้มีบทความ {deleteDialog.category._count.posts} บทความ</>
            )}
            <br />การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, category: null })}>
            ยกเลิก
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
