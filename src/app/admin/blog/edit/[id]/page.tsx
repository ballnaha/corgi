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
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Image,
  Add,
  Close,
  Publish,
  Unpublished,
  CloudUpload,
  Crop
} from '@mui/icons-material';
import ImageCropModal from '@/components/admin/ImageCropModal';
import { useRouter, useParams } from 'next/navigation';
import { colors } from '@/theme/colors';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  categoryId: string;
  category: BlogCategory;
  author: string;
  authorId?: string;
  publishedAt?: string;
  isPublished: boolean;


  tags?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
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

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [actionType, setActionType] = useState<'save' | 'publish' | 'unpublish' | null>(null);
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
    author: '',
    isPublished: false,
    tags: [],
    seoTitle: '',
    seoDescription: ''
  });

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchCategories();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/${postId}`);
      const data = await response.json();

      if (data.success) {
        const postData = data.data;
        setPost(postData);
        
        // Parse tags from JSON string
        let tags: string[] = [];
        if (postData.tags) {
          try {
            tags = JSON.parse(postData.tags);
          } catch {
            tags = [];
          }
        }

        setFormData({
          title: postData.title || '',
          slug: postData.slug || '',
          excerpt: postData.excerpt || '',
          content: postData.content || '',
          imageUrl: postData.imageUrl || '',
          categoryId: postData.categoryId || '',
          author: postData.author || '',
          isPublished: postData.isPublished || false,
          tags: tags,
          seoTitle: postData.seoTitle || '',
          seoDescription: postData.seoDescription || ''
        });
      } else {
        setError(data.error || 'ไม่พบบทความ');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.filter((cat: BlogCategory) => cat.isActive));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    // Keep original URL in the field for edit page
    // The preview will show the new cropped image
    
    setSuccess(`ปรับขนาดรูปใหม่: ${croppedFile.name} (จะอัปโหลดเมื่อบันทึกบทความ)`);
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

  const uploadImageFile = async (file: File, oldImageUrl?: string): Promise<string | null> => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      // Send old image URL for deletion if exists
      if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
        uploadFormData.append('oldImageUrl', oldImageUrl);
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

  const handleSubmit = async (isPublish?: boolean) => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      setActionType(
        isPublish === true ? 'publish' : 
        isPublish === false ? 'unpublish' : 
        'save'
      );

      let finalImageUrl = formData.imageUrl;

      // Upload image if there's a pending file
      if (pendingImageFile) {
        setUploading(true);
        try {
          // Pass the current image URL for deletion
          const oldImageUrl = post?.imageUrl;
          const uploadedUrl = await uploadImageFile(pendingImageFile, oldImageUrl);
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
        ...(isPublish !== undefined && { isPublished: isPublish })
      };

      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('อัปเดตบทความเรียบร้อยแล้ว');
        // Refresh post data
        await fetchPost();
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setSaving(false);
      setActionType(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          ไม่พบบทความที่ต้องการแก้ไข
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/admin/blog')}
          sx={{ mt: 2 }}
        >
          กลับไปหน้ารายการ
        </Button>
      </Box>
    );
  }

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
            แก้ไขบทความ
          </Typography>
          <Typography variant="body1" sx={{ color: colors.text.secondary }}>
            แก้ไขบทความ: {post.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => handleSubmit()}
            disabled={saving || uploading}
            startIcon={(saving || uploading) && actionType === 'save' ? <CircularProgress size={20} /> : <Save />}
          >
            {(saving || uploading) && actionType === 'save' 
              ? (uploading ? 'กำลังอัปโหลดรูป...' : 'กำลังบันทึก...') 
              : 'บันทึก'
            }
          </Button>
          {!formData.isPublished ? (
            <Button
              variant="contained"
              onClick={() => handleSubmit(true)}
              disabled={saving || uploading}
              startIcon={(saving || uploading) && actionType === 'publish' ? <CircularProgress size={20} /> : <Publish />}
              sx={{
                backgroundColor: colors.primary.main,
                '&:hover': { backgroundColor: colors.primary.dark }
              }}
            >
              {(saving || uploading) && actionType === 'publish' 
                ? (uploading ? 'กำลังอัปโหลดรูป...' : 'กำลังเผยแพร่...') 
                : 'เผยแพร่'
              }
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => handleSubmit(false)}
              disabled={saving || uploading}
              startIcon={(saving || uploading) && actionType === 'unpublish' ? <CircularProgress size={20} /> : <Unpublished />}
              color="warning"
            >
              {(saving || uploading) && actionType === 'unpublish' 
                ? (uploading ? 'กำลังอัปโหลดรูป...' : 'กำลังบันทึก...') 
                : 'ยกเลิกการเผยแพร่'
              }
            </Button>
          )}
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
                  disabled={saving || uploading}
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
          {/* Post Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ข้อมูลบทความ
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                สร้างเมื่อ: {new Date(post.createdAt).toLocaleDateString('th-TH')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                แก้ไขล่าสุด: {new Date(post.updatedAt).toLocaleDateString('th-TH')}
              </Typography>
            </CardContent>
          </Card>

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

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                  />
                }
                label="เผยแพร่"
                sx={{ mb: 1 }}
              />


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
