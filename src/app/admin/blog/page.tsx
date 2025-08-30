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
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Article,
  Category,
  FilterList
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { colors } from '@/theme/colors';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  imageUrl?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color?: string;
  };
  author: string;
  authorId?: string;
  publishedAt?: string;
  isPublished: boolean;


  tags?: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft

  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    post: BlogPost | null;
  }>({ open: false, post: null });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [page, searchTerm, selectedCategory, statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(statusFilter !== 'all' && { published: statusFilter === 'published' ? 'true' : 'false' })
      });

      const response = await fetch(`/api/admin/blog?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setTotalPages(Math.ceil(data.data.total / itemsPerPage));
      } else {
        setError(data.error || 'ไม่สามารถโหลดบทความได้');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.post) return;

    try {
      const response = await fetch(`/api/admin/blog/${deleteDialog.post.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('ลบบทความเรียบร้อยแล้ว');
        fetchPosts();
      } else {
        setError(data.error || 'ไม่สามารถลบบทความได้');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('เกิดข้อผิดพลาดในการลบบทความ');
    } finally {
      setDeleteDialog({ open: false, post: null });
    }
  };

  const handleTogglePublished = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${!post.isPublished ? 'เผยแพร่' : 'ยกเลิกการเผยแพร่'}บทความเรียบร้อยแล้ว`);
        fetchPosts();
      } else {
        setError(data.error || 'ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดต');
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

  const getStatusColor = (post: BlogPost) => {
    if (!post.isPublished) return 'default';
    return 'primary';
  };

  const getStatusText = (post: BlogPost) => {
    if (!post.isPublished) return 'ฉบับร่าง';
    return 'เผยแพร่';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: colors.text.primary, mb: 1 }}>
            จัดการบทความ
          </Typography>
          <Typography variant="body1" sx={{ color: colors.text.secondary }}>
            เขียน แก้ไข และจัดการบทความในเว็บไซต์
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Category />}
            onClick={() => router.push('/admin/blog/categories')}
            sx={{ borderColor: colors.primary.main, color: colors.primary.main }}
          >
            จัดการหมวดหมู่
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/admin/blog/new')}
            sx={{ 
              backgroundColor: colors.primary.main,
              '&:hover': { backgroundColor: colors.primary.dark }
            }}
          >
            เขียนบทความใหม่
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="ค้นหาบทความ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.text.secondary }} />
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            select
            label="หมวดหมู่"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="สถานะ"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="all">ทั้งหมด</MenuItem>
            <MenuItem value="published">เผยแพร่</MenuItem>
            <MenuItem value="draft">ฉบับร่าง</MenuItem>
          </TextField>


        </Box>
      </Paper>

      {/* Posts Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: colors.background.paper }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ชื่อบทความ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>หมวดหมู่</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ผู้เขียน</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>สถานะ</TableCell>

                <TableCell sx={{ fontWeight: 'bold' }}>วันที่สร้าง</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>กำลังโหลด...</Typography>
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">ไม่พบบทความ</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium" noWrap sx={{ maxWidth: 200 }}>
                          {post.title}
                        </Typography>
                        {post.excerpt && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                            {post.excerpt}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={post.category.name}
                        size="small"
                        sx={{
                          backgroundColor: post.category.color || colors.secondary.main,
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{post.author}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(post)}
                        color={getStatusColor(post)}
                        size="small"
                        icon={<Article />}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(post.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/blog/${post.slug}`)}
                          sx={{ color: colors.primary.main }}
                        >
                          <Article />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                          sx={{ color: '#ff9800' }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, post })}
                          sx={{ color: '#f44336' }}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, post: null })}
      >
        <DialogTitle>ยืนยันการลบบทความ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณแน่ใจหรือว่าต้องการลบบทความ "{deleteDialog.post?.title}" 
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, post: null })}>
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
