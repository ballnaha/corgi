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
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  DragIndicator,
} from "@mui/icons-material";
import Image from "next/image";
import { colors } from "@/theme/colors";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string;
  background: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  background: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export default function BannersAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    subtitle: "",
    imageUrl: "",
    imageAlt: "",
    background: "linear-gradient(135deg, #FFE0B2 0%, #FFF3E0 50%, #FFCC80 100%)",
    linkUrl: "",
    isActive: true,
    sortOrder: 0,
  });

  // Image upload states
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

// Predefined gradient options (with blue & orange tones)
const gradientOptions = [
  {
    name: "Orange Vibrant",
    value: "linear-gradient(135deg, #FFB74D 0%, #FB8C00 50%, #F57C00 100%)",
  },
  {
    name: "Blue Vibrant",
    value: "linear-gradient(135deg, #64B5F6 0%, #42A5F5 50%, #1E88E5 100%)",
  },
  {
    name: "Pink Pastel",
    value: "linear-gradient(135deg, #F8BBD9 0%, #F3E5F5 50%, #FCE4EC 100%)",
  },
  {
    name: "Green Pastel",
    value: "linear-gradient(135deg, #B2DFDB 0%, #E0F2F1 50%, #A5D6A7 100%)",
  },
  {
    name: "Purple Pastel",
    value: "linear-gradient(135deg, #E1BEE7 0%, #F3E5F5 50%, #CE93D8 100%)",
  },
];


  // Load banners
  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/banners");
      
      if (!response.ok) {
        throw new Error("Failed to load banners");
      }

      const data = await response.json();
      setBanners(data);
    } catch (error: any) {
      console.error("Error loading banners:", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Handle file selection (not upload yet)
  const handleFileSelection = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Store the file for later upload
    setSelectedFile(file);
    
    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Clear the imageUrl since we have a new file
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  // Upload the selected file
  const uploadSelectedFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', selectedFile);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถอัปโหลดรูปภาพได้');
      }

      const result = await response.json();
      return result.images[0]?.url || null;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!formData.title.trim() || !formData.imageAlt.trim()) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    // Check if we have either a file to upload or an existing URL
    if (!selectedFile && !formData.imageUrl.trim()) {
      setError("กรุณาเลือกรูปภาพหรือใส่ URL รูปภาพ");
      return;
    }

    try {
      setUploading(true);

      let finalImageUrl = formData.imageUrl;

      // Upload file if selected
      if (selectedFile) {
        try {
          const uploadedUrl = await uploadSelectedFile();
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
          } else {
            throw new Error("ไม่สามารถอัปโหลดรูปภาพได้");
          }
        } catch (uploadError: any) {
          throw new Error(uploadError.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
        }
      }

      // Prepare final form data
      const finalFormData = {
        ...formData,
        imageUrl: finalImageUrl,
      };

      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : "/api/admin/banners";
      
      const method = editingBanner ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save banner");
      }

      setSuccess(
        editingBanner
          ? "แก้ไข banner สำเร็จ"
          : "สร้าง banner สำเร็จ"
      );
      
      setOpenDialog(false);
      resetForm();
      loadBanners();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (bannerId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ banner นี้?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete banner");
      }

      setSuccess("ลบ banner สำเร็จ");
      loadBanners();
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !banner.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update banner status");
      }

      loadBanners();
    } catch (error: any) {
      console.error("Error updating banner status:", error);
      setError("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "",
      imageAlt: "",
      background: "linear-gradient(135deg, #FFE0B2 0%, #FFF3E0 50%, #FFCC80 100%)",
      linkUrl: "",
      isActive: true,
      sortOrder: 0,
    });
    setEditingBanner(null);
    setSelectedFile(null);
    
    // Clean up preview URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  // Open edit dialog
  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      imageAlt: banner.imageAlt,
      background: banner.background,
      linkUrl: banner.linkUrl || "",
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setSelectedFile(null); // No file selected when editing existing banner
    setImagePreview(banner.imageUrl); // Show existing image
    setOpenDialog(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>กำลังโหลด...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 0 },
          mb: 3,
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: "bold",
            fontSize: { sm: "1.5rem" },
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          จัดการ Banner
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
          sx={{
            backgroundColor: colors.primary.main,
            display: { xs: "flex", sm: "inline-flex" },
            "&:hover": {
              backgroundColor: colors.primary.dark,
            },
          }}
        >
          เพิ่ม Banner
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>รูปภาพ</TableCell>
                <TableCell>ชื่อ</TableCell>
                <TableCell>คำบรรยาย</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>ลำดับ</TableCell>
                <TableCell>การจัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 40,
                        borderRadius: 2,
                        background: banner.background,
                      }}
                    >
                      <Image
                        src={banner.imageUrl}
                        alt={banner.imageAlt}
                        width={40}
                        height={40}
                        style={{ objectFit: "contain" }}
                      />
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      {banner.title}
                    </Typography>
                    {banner.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {banner.subtitle}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{banner.imageAlt}</TableCell>
                  <TableCell>
                    <Chip
                      label={banner.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      color={banner.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DragIndicator fontSize="small" color="disabled" />
                      {banner.sortOrder}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(banner)}
                        color={banner.isActive ? "warning" : "success"}
                      >
                        {banner.isActive ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(banner)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(banner.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      ยังไม่มี banner
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {banners.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              ยังไม่มี banner
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {banners.map((banner) => (
              <Paper key={banner.id} sx={{ p: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {/* Banner Preview */}
                  <Box
                    sx={{
                      minWidth: 80,
                      height: 60,
                      borderRadius: 2,
                      background: banner.background,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={banner.imageUrl}
                      alt={banner.imageAlt}
                      width={50}
                      height={50}
                      style={{ objectFit: "contain" }}
                    />
                  </Box>

                  {/* Banner Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: "bold",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {banner.title}
                        </Typography>
                        {banner.subtitle && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {banner.subtitle}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={banner.isActive ? "เปิด" : "ปิด"}
                        color={banner.isActive ? "success" : "default"}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <DragIndicator fontSize="small" color="disabled" />
                        <Typography variant="caption" color="text.secondary">
                          ลำดับ: {banner.sortOrder}
                        </Typography>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(banner)}
                          color={banner.isActive ? "warning" : "success"}
                        >
                          {banner.isActive ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(banner)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(banner.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={false}
        sx={{
          "& .MuiDialog-paper": {
            margin: { xs: 1, sm: 2 },
            width: { xs: "calc(100% - 16px)", sm: "90%", md: "85%", lg: "80%" },
            maxWidth: { xs: "none", sm: "none", md: "900px", lg: "1000px" },
            maxHeight: { xs: "calc(100% - 16px)", sm: "90vh" },
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingBanner ? "แก้ไข Banner" : "เพิ่ม Banner"}
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 2, sm: 3, md: 4 },
              pt: 1 
            }}>
              {/* Left Column - Basic Info */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: colors.text.primary }}>
                  ข้อมูลพื้นฐาน
                </Typography>
                
                <TextField
                  label="ชื่อ Banner"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  fullWidth
                />
                
                <TextField
                  label="คำบรรยาย (ไม่บังคับ)"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />

                {/* Image Upload Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    รูปภาพ Banner
                  </Typography>
                  
                  {/* Image Preview */}
                  {(imagePreview || formData.imageUrl) && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: 120,
                          border: "2px dashed #ccc",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          overflow: "hidden",
                          background: formData.background,
                        }}
                      >
                        <Image
                          src={imagePreview || formData.imageUrl}
                          alt="Preview"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Upload Area */}
                  <Box
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "border-color 0.3s",
                      "&:hover": {
                        borderColor: colors.primary.main,
                      },
                      backgroundColor: uploading ? "#f5f5f5" : "transparent",
                    }}
                    onClick={() => document.getElementById('banner-image-input')?.click()}
                  >
                    <input
                      id="banner-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      style={{ display: "none" }}
                      disabled={uploading}
                    />
                    
                    {selectedFile ? (
                      <Box>
                        <Typography color="primary" sx={{ mb: 1 }}>
                          ✓ เลือกไฟล์แล้ว: {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          รูปภาพจะถูกอัปโหลดเมื่อกดบันทึก
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 10MB)
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Manual URL Input (Alternative) */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      หรือใส่ URL รูปภาพ:
                    </Typography>
                    <TextField
                      label="URL รูปภาพ"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      fullWidth
                      size="small"
                      placeholder="https://example.com/image.jpg"
                    />
                  </Box>
                </Box>

                <TextField
                  label="Alt Text สำหรับรูปภาพ"
                  value={formData.imageAlt}
                  onChange={(e) =>
                    setFormData({ ...formData, imageAlt: e.target.value })
                  }
                  required
                  fullWidth
                  helperText="ข้อความอธิบายรูปภาพสำหรับผู้ที่มีความบกพร่องทางการมองเห็น"
                />

                <TextField
                  label="Link URL (ไม่บังคับ)"
                  value={formData.linkUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkUrl: e.target.value })
                  }
                  fullWidth
                  placeholder="https://example.com"
                />
              </Box>

              {/* Right Column - Design & Settings */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: colors.text.primary }}>
                  การออกแบบและการตั้งค่า
                </Typography>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    เลือกสีพื้นหลัง
                  </Typography>
                  <Box sx={{ 
                    display: "grid", 
                    gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
                    gap: 1
                  }}>
                    {gradientOptions.map((option, index) => (
                      <Box
                        key={index}
                        onClick={() =>
                          setFormData({ ...formData, background: option.value })
                        }
                        sx={{
                          width: "100%",
                          height: { xs: 50, sm: 40, md: 50 },
                          borderRadius: 1,
                          background: option.value,
                          cursor: "pointer",
                          border:
                            formData.background === option.value
                              ? `3px solid ${colors.primary.main}`
                              : "2px solid transparent",
                          "&:hover": {
                            border: `2px solid ${colors.primary.light}`,
                          },
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={option.name}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: { xs: "none", sm: "none", md: "block" },
                            color: "rgba(0,0,0,0.6)",
                            fontSize: "0.6rem",
                            textAlign: "center",
                            px: 0.5
                          }}
                        >
                          {option.name.split(' ')[0]}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="ลำดับการแสดงผล"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    sx={{ flex: 1 }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", minWidth: 150 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({ ...formData, isActive: e.target.checked })
                          }
                          color="primary"
                        />
                      }
                      label="เปิดใช้งาน"
                    />
                  </Box>
                </Box>

                {/* Live Preview */}
                {formData.title && (imagePreview || formData.imageUrl) && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      ตัวอย่าง Banner
                    </Typography>
                    <Box
                      sx={{
                        background: formData.background,
                        borderRadius: 2,
                        p: 2,
                        position: "relative",
                        minHeight: { xs: 80, md: 100 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        overflow: "visible",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ 
                            fontWeight: "bold", 
                            color: "black",
                            fontSize: { xs: "1rem", md: "1.2rem" }
                          }}
                        >
                          {formData.title}
                        </Typography>
                        {formData.subtitle && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: "black",
                              opacity: 0.8,
                              fontSize: { xs: "0.8rem", md: "0.9rem" }
                            }}
                          >
                            {formData.subtitle}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ 
                        width: { xs: 60, md: 80 }, 
                        height: { xs: 80, md: 100 }, 
                        position: "relative",
                        ml: 2,
                        transform: "translateY(-10px)", // 3D effect like real banner
                      }}>
                        <Image
                          src={imagePreview || formData.imageUrl}
                          alt={formData.imageAlt || "Preview"}
                          fill
                          style={{ 
                            objectFit: "contain",
                            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))"
                          }}
                        />
                      </Box>
                    </Box>
                    
                    {uploading && (
                      <Box sx={{ mt: 1, textAlign: "center" }}>
                        <Typography variant="caption" color="primary">
                          กำลังอัปโหลดรูปภาพและบันทึกข้อมูล...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 }, 
            pb: { xs: 2, sm: 2 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 0 }
          }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              fullWidth={true}
              sx={{ display: { xs: "block", sm: "inline-block" } }}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading}
              fullWidth={true}
              sx={{
                backgroundColor: colors.primary.main,
                display: { xs: "block", sm: "inline-block" },
                "&:hover": {
                  backgroundColor: colors.primary.dark,
                },
              }}
            >
              {uploading 
                ? "กำลังบันทึก..." 
                : editingBanner 
                  ? "แก้ไข" 
                  : "เพิ่ม"
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
