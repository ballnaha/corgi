"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,

  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Save,
  Preview,
  ArrowBack,
  Image,
  Add,
  Close,
  Publish,
  CloudUpload,
  PhotoCamera,
  Crop
} from '@mui/icons-material';
import ImageCropModal from '@/components/admin/ImageCropModal';

import { useRouter } from 'next/navigation';
import { colors } from '@/theme/colors';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  categoryId: string;
  author: string;
  isPublished: boolean;

  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

export default function NewBlogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [actionType, setActionType] = useState<'draft' | 'publish' | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    categoryId: '',
    author: 'แอดมิน',
    isPublished: false,
    tags: [],
    seoTitle: '',
    seoDescription: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.filter((cat: BlogCategory) => cat.isActive));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('ไม่สามารถโหลดหมวดหมู่ได้');
    }
  };

  const generateSlug = (title: string) => {
    // Keep Unicode letters (L), marks (M) for combining accents, and numbers (N)
    // Replace other chars with '-'; trim leading/trailing '-'
    const base = title
      .toLowerCase()
      .normalize('NFC')
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 100);
    return base;
  };

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from title
    if (field === 'title' && value) {
      const autoSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: autoSlug
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 10MB for cropping)
    if (file.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    // Open crop modal instead of direct upload
    setSelectedFileForCrop(file);
    setCropModalOpen(true);
    setError(null);

    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    // Store the cropped file for later upload
    setPendingImageFile(croppedFile);
    
    // Create preview URL for the cropped image
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(newPreviewUrl);
    
    // Display filename in the text field
    handleInputChange('imageUrl', `[รูปที่ปรับขนาดแล้ว: ${croppedFile.name}]`);

    setSuccess('ปรับขนาดรูปภาพเรียบร้อย (จะอัปโหลดเมื่อบันทึกบทความ)');
    setCropModalOpen(false);
    setSelectedFileForCrop(null);
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setSelectedFileForCrop(null);
  };

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      // Send old image URL for deletion if exists
      if (formData.imageUrl && formData.imageUrl.startsWith('/uploads/')) {
        uploadFormData.append('oldImageUrl', formData.imageUrl);
      }

      const response = await fetch('/api/upload/blog', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();

      if (data.success) {
        return data.url;
      } else {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } catch (error) {
      console.error('Error uploading blog image:', error);
      throw error;
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('กรุณากรอกชื่อบทความ');
      return false;
    }
    if (!formData.content.trim()) {
      setError('กรุณากรอกเนื้อหาบทความ');
      return false;
    }
    if (!formData.categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      return false;
    }
    return true;
  };

  const handleSubmit = async (isPublish: boolean = false) => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setActionType(isPublish ? 'publish' : 'draft');

      let finalImageUrl = formData.imageUrl;

      // Upload image if there's a pending file
      if (pendingImageFile) {
        setUploading(true);
        try {
          const uploadedUrl = await uploadImageFile(pendingImageFile);
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
          }
          setPendingImageFile(null); // Clear pending file
        } catch (uploadError) {
          setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
          return;
        } finally {
          setUploading(false);
        }
      }

      const submitData = {
        ...formData,
        imageUrl: finalImageUrl,
        isPublished: isPublish,
        publishedAt: isPublish ? new Date().toISOString() : null
      };

      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isPublish ? 'เผยแพร่บทความเรียบร้อยแล้ว' : 'บันทึกฉบับร่างเรียบร้อยแล้ว');
        setTimeout(() => {
          router.push('/admin/blog');
        }, 1500);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      setError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => router.back()}
          sx={{ mr: 2, color: colors.text.secondary }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: colors.text.primary, mb: 1 }}>
            เขียนบทความใหม่
          </Typography>
          <Typography variant="body1" sx={{ color: colors.text.secondary }}>
            สร้างบทความใหม่สำหรับเว็บไซต์
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => handleSubmit(false)}
            disabled={loading || uploading}
            startIcon={(loading || uploading) && actionType === 'draft' ? <CircularProgress size={20} /> : <Save />}
          >
            {(loading || uploading) && actionType === 'draft' 
              ? (uploading ? 'กำลังอัปโหลดรูป...' : 'กำลังบันทึก...') 
              : 'บันทึกฉบับร่าง'
            }
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubmit(true)}
            disabled={loading || uploading}
            startIcon={(loading || uploading) && actionType === 'publish' ? <CircularProgress size={20} /> : <Publish />}
            sx={{
              backgroundColor: colors.primary.main,
              '&:hover': { backgroundColor: colors.primary.dark }
            }}
          >
            {(loading || uploading) && actionType === 'publish' 
              ? (uploading ? 'กำลังอัปโหลดรูป...' : 'กำลังเผยแพร่...') 
              : 'เผยแพร่'
            }
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            {/* Title & Slug */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="ชื่อบทความ *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Slug (URL)"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                helperText="URL ของบทความ เช่น my-awesome-post"
              />
            </Box>

            {/* Excerpt */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="บทนำ / คำอธิบายสั้น"
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                multiline
                rows={3}
                helperText="คำอธิบายสั้นๆ ของบทความ จะแสดงในหน้ารายการบทความ"
              />
            </Box>

            {/* Featured Image */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                รูปภาพหลัก *
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="URL รูปภาพ"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  InputProps={{
                    startAdornment: <Image sx={{ mr: 1, color: colors.text.secondary }} />
                  }}
                  placeholder="https://example.com/image.jpg"
                />
                
                <Button
                  variant="outlined"
                  component="label"
                  disabled={loading || uploading}
                  startIcon={<Crop />}
                  sx={{ minWidth: 140 }}
                >
                  เลือกรูป & ปรับขนาด
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                ระบบจะช่วยปรับขนาดให้เป็น 16:9 อัตโนมัติ ขนาดไฟล์ไม่เกิน 10MB
              </Typography>

              {(formData.imageUrl || pendingImageFile) && (
                <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <img
                      src={previewUrl || (pendingImageFile ? URL.createObjectURL(pendingImageFile) : formData.imageUrl)}
                      alt="Preview"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 1, backgroundColor: '#f9f9f9', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {pendingImageFile ? `ไฟล์ที่เลือก: ${pendingImageFile.name}` : 'ตัวอย่างการแสดงผล'} (อัตราส่วน 16:9)
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Content */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                เนื้อหาบทความ *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="เขียนเนื้อหาบทความของคุณที่นี่..."
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                รองรับ Markdown syntax สำหรับการจัดรูปแบบข้อความ
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', md: '350px' }, flexShrink: 0 }}>
          {/* Publishing Options */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ตัวเลือกการเผยแพร่
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="หมวดหมู่ *"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: category.color || colors.secondary.main
                          }}
                        />
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="ผู้เขียน"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                />
              </Box>


            </CardContent>
          </Card>

          {/* Tags */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                แท็ก
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="เพิ่มแท็ก..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ flexGrow: 1 }}
                />
                <IconButton
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  sx={{ color: colors.primary.main }}
                >
                  <Add />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    deleteIcon={<Close />}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                SEO
              </Typography>
              
              <TextField
                fullWidth
                label="SEO Title"
                value={formData.seoTitle}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                sx={{ mb: 2 }}
                helperText="หัวข้อสำหรับ Search Engine (ถ้าไม่กรอกจะใช้ชื่อบทความ)"
              />
              
              <TextField
                fullWidth
                label="SEO Description"
                value={formData.seoDescription}
                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                multiline
                rows={3}
                helperText="คำอธิบายสำหรับ Search Engine"
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

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

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={handleCropCancel}
        onCrop={handleCropComplete}
        file={selectedFileForCrop}
        aspectRatio={16 / 9}
        title="ปรับขนาดรูปภาพบล็อก"
      />
    </Box>
  );
}
