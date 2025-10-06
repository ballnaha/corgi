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
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string;
  background: string;
  linkUrl: string | null;
  bannerUrl: string | null; // Full-size banner URL
  bannerType: 'custom' | 'fullsize'; // Type of banner
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
  bannerUrl: string; // Full-size banner URL
  bannerType: 'custom' | 'fullsize'; // Type of banner
  isActive: boolean;
  sortOrder: number;
}

export default function BannersAdminPage() {
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  // Delete confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    bannerId: string | null;
    bannerTitle: string;
  }>({
    open: false,
    bannerId: null,
    bannerTitle: ''
  });

  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    subtitle: "",
    imageUrl: "",
    imageAlt: "",
    background: "linear-gradient(135deg, #FF8A80 0%, #FF7043 30%, #FFAB91 100%)",
    linkUrl: "",
    bannerUrl: "",
    bannerType: "custom",
    isActive: true,
    sortOrder: 0,
  });

  // Image upload states
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Banner upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

// Predefined gradient options (based on attached images)
const gradientOptions = [
  {
    name: "Pink Coral",
    value: "linear-gradient(135deg, #FF8A80 0%, #FF7043 30%, #FFAB91 100%)",
    pattern: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 3px, transparent 3px)",
  },
  {
    name: "Turquoise Green", 
    value: "linear-gradient(135deg, #4DB6AC 0%, #26A69A 30%, #80CBC4 100%)",
    pattern: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 3px, transparent 3px)",
  },
  {
    name: "Orange Peach",
    value: "linear-gradient(135deg, #FFAB40 0%, #FF9800 30%, #FFCC80 100%)",
    pattern: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 3px, transparent 3px)",
  },
  {
    name: "Purple Lavender",
    value: "linear-gradient(135deg, #CE93D8 0%, #BA68C8 30%, #E1BEE7 100%)",
    pattern: "radial-gradient(circle at 15% 35%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 85% 65%, rgba(255,255,255,0.2) 3px, transparent 3px)",
  },
  {
    name: "Blue Sky",
    value: "linear-gradient(135deg, #64B5F6 0%, #42A5F5 30%, #90CAF9 100%)",
    pattern: "radial-gradient(circle at 40% 20%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 60% 80%, rgba(255,255,255,0.2) 3px, transparent 3px)",
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
      showSnackbar("เกิดข้อผิดพลาดในการโหลดข้อมูล banner", "error");
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
      showSnackbar('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showSnackbar('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB', 'error');
      return;
    }

    // File validation passed

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

  // Handle banner file selection (full size banner)
  const handleBannerFileSelection = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }

    // Validate file size (max 20MB for banner)
    if (file.size > 20 * 1024 * 1024) {
      showSnackbar('ไฟล์ banner ต้องมีขนาดไม่เกิน 20MB', 'error');
      return;
    }

    // Store the file for later upload
    setSelectedBannerFile(file);
    
    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setBannerPreview(previewUrl);
  };

  // Upload the selected banner file
  const uploadSelectedBannerFile = async (): Promise<string | null> => {
    if (!selectedBannerFile) return null;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', selectedBannerFile);
      uploadFormData.append('type', 'banner'); // Specify banner type for sizing

      const response = await fetch('/api/upload/banner', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถอัปโหลด banner ได้');
      }

      const result = await response.json();
      return result.bannerUrl || null;
    } catch (error: any) {
      console.error('Error uploading banner:', error);
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

  // Handle banner file input change
  const handleBannerFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBannerFileSelection(file);
    }
  };

  // Handle banner drag and drop
  const handleBannerDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleBannerFileSelection(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim() || !formData.imageAlt.trim()) {
      showSnackbar("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
      return;
    }

    // Check if we have either a file to upload or an existing URL
    if (!selectedFile && !formData.imageUrl.trim()) {
      showSnackbar("กรุณาเลือกรูปภาพหรือใส่ URL รูปภาพ", "error");
      return;
    }

    try {
      setUploading(true);

      let finalImageUrl = formData.imageUrl;
      let finalBannerUrl = formData.bannerUrl || '';

      // Upload product image file if selected
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

      // Upload banner file if selected
      if (selectedBannerFile) {
        try {
          setUploadingBanner(true);
          const uploadedBannerUrl = await uploadSelectedBannerFile();
          if (uploadedBannerUrl) {
            finalBannerUrl = uploadedBannerUrl;
          } else {
            throw new Error("ไม่สามารถอัปโหลด banner ได้");
          }
        } catch (uploadError: any) {
          throw new Error(uploadError.message || "เกิดข้อผิดพลาดในการอัปโหลด banner");
        } finally {
          setUploadingBanner(false);
        }
      }

      // Prepare final form data
      const finalFormData = {
        ...formData,
        imageUrl: finalImageUrl,
        bannerUrl: finalBannerUrl,
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

      showSnackbar(
        editingBanner
          ? "แก้ไข banner สำเร็จ"
          : "สร้าง banner สำเร็จ",
        "success"
      );
      
      setOpenDialog(false);
      resetForm();
      loadBanners();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      showSnackbar(error.message || "เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteRequest = (banner: Banner) => {
    setDeleteConfirm({
      open: true,
      bannerId: banner.id,
      bannerTitle: banner.title
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.bannerId) return;

    try {
      const response = await fetch(`/api/admin/banners/${deleteConfirm.bannerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete banner");
      }

      showSnackbar("ลบ banner สำเร็จ", "success");
      loadBanners();
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      showSnackbar(error.message || "เกิดข้อผิดพลาดในการลบ", "error");
    } finally {
      setDeleteConfirm({
        open: false,
        bannerId: null,
        bannerTitle: ''
      });
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      open: false,
      bannerId: null,
      bannerTitle: ''
    });
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
      showSnackbar("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "",
      imageAlt: "",
      background: "linear-gradient(135deg, #FF8A80 0%, #FF7043 30%, #FFAB91 100%)",
      linkUrl: "",
      bannerUrl: "",
      bannerType: "custom",
      isActive: true,
      sortOrder: 0,
    });
    setEditingBanner(null);
    setSelectedFile(null);
    
    // Clean up preview URLs
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    if (bannerPreview && bannerPreview.startsWith('blob:')) {
      URL.revokeObjectURL(bannerPreview);
    }
    setImagePreview(null);
    setSelectedBannerFile(null);
    setBannerPreview(null);
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
      bannerUrl: banner.bannerUrl || "",
      bannerType: banner.bannerType || "custom",
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setSelectedFile(null); // No file selected when editing existing banner
    setSelectedBannerFile(null); // No banner file selected when editing existing banner
    setImagePreview(banner.imageUrl); // Show existing image
    setBannerPreview(banner.bannerUrl); // Show existing banner
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
                        onClick={() => handleDeleteRequest(banner)}
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
                          onClick={() => handleDeleteRequest(banner)}
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

                {/* Banner Type Selection */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    ประเภท Banner
                  </Typography>
                  <Box sx={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    mb: 2
                  }}>
                    {/* Custom Banner Option */}
                    <Box
                      onClick={() => setFormData({ ...formData, bannerType: 'custom' })}
                      sx={{
                        p: 2,
                        border: formData.bannerType === 'custom' 
                          ? `2px solid ${colors.primary.main}` 
                          : "2px solid #e0e0e0",
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        backgroundColor: formData.bannerType === 'custom' 
                          ? `${colors.primary.main}10` 
                          : "transparent",
                        "&:hover": {
                          borderColor: colors.primary.main,
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        🎨 Banner แบบกำหนดเอง
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ใช้พื้นหลัง gradient + รูปภาพ + ข้อความ
                      </Typography>
                    </Box>

                    {/* Full-size Banner Option */}
                    <Box
                      onClick={() => setFormData({ ...formData, bannerType: 'fullsize' })}
                      sx={{
                        p: 2,
                        border: formData.bannerType === 'fullsize' 
                          ? `2px solid ${colors.primary.main}` 
                          : "2px solid #e0e0e0",
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        backgroundColor: formData.bannerType === 'fullsize' 
                          ? `${colors.primary.main}10` 
                          : "transparent",
                        "&:hover": {
                          borderColor: colors.primary.main,
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        🖼️ Banner เต็มรูป
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ใช้รูปภาพเต็มขนาด 1200x400px
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Conditional Content based on Banner Type */}
                {formData.bannerType === 'custom' ? (
                  <>
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

                {/* Banner Upload Section (Full Size) */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Banner เต็มขนาด (ไม่บังคับ)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                    อัปโหลด banner เต็มขนาดแทนการใช้พื้นหลังและรูปภาพแยก (แนะนำขนาด: 1200x400 พิกเซล)
                  </Typography>
                  
                  {/* Banner Preview */}
                  {(bannerPreview || formData.bannerUrl) && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: "100%",
                          height: 150,
                          border: "2px dashed #ccc",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          overflow: "hidden",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <Image
                          src={bannerPreview || formData.bannerUrl}
                          alt="Banner Preview"
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Banner Upload Area */}
                  <Box
                    onDrop={handleBannerDrop}
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
                      backgroundColor: uploadingBanner ? "#f5f5f5" : "transparent",
                    }}
                    onClick={() => document.getElementById('banner-file-input')?.click()}
                  >
                    <input
                      id="banner-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileInputChange}
                      style={{ display: "none" }}
                      disabled={uploadingBanner}
                    />
                    
                    {selectedBannerFile ? (
                      <Box>
                        <Typography color="primary" sx={{ mb: 1 }}>
                          ✓ เลือก Banner แล้ว: {selectedBannerFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Banner จะถูกอัปโหลดเมื่อกดบันทึก
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          คลิกเพื่อเลือก Banner หรือลากไฟล์มาวางที่นี่
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 20MB) | แนะนำขนาด: 1200x400px
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Banner URL Input (Alternative) */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      หรือใส่ URL Banner:
                    </Typography>
                    <TextField
                      label="URL Banner เต็มขนาด"
                      value={formData.bannerUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, bannerUrl: e.target.value });
                        setBannerPreview(e.target.value);
                      }}
                      fullWidth
                      size="small"
                      placeholder="https://example.com/banner.jpg"
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
                </>
                ) : (
                  <>
                    {/* Banner Upload Section (Full Size) */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Banner เต็มขนาด
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                        อัปโหลด banner เต็มขนาด (แนะนำขนาด: 1200x400 พิกเซล)
                      </Typography>
                      
                      {/* Banner Preview */}
                      {(bannerPreview || formData.bannerUrl) && (
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              width: "100%",
                              height: 150,
                              border: "2px dashed #ccc",
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              overflow: "hidden",
                              backgroundColor: "#f5f5f5",
                            }}
                          >
                            <Image
                              src={bannerPreview || formData.bannerUrl}
                              alt="Banner Preview"
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </Box>
                        </Box>
                      )}

                      {/* Banner Upload Area */}
                      <Box
                        onDrop={handleBannerDrop}
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
                          backgroundColor: uploadingBanner ? "#f5f5f5" : "transparent",
                        }}
                        onClick={() => document.getElementById('banner-file-input')?.click()}
                      >
                        <input
                          id="banner-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileInputChange}
                          style={{ display: "none" }}
                          disabled={uploadingBanner}
                        />
                        
                        {selectedBannerFile ? (
                          <Box>
                            <Typography color="primary" sx={{ mb: 1 }}>
                              ✓ เลือก Banner แล้ว: {selectedBannerFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Banner จะถูกอัปโหลดเมื่อกดบันทึก
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              คลิกเพื่อเลือก Banner หรือลากไฟล์มาวางที่นี่
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 20MB) | แนะนำขนาด: 1200x400px
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Banner URL Input (Alternative) */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                          หรือใส่ URL Banner:
                        </Typography>
                        <TextField
                          label="URL Banner เต็มขนาด"
                          value={formData.bannerUrl}
                          onChange={(e) => {
                            setFormData({ ...formData, bannerUrl: e.target.value });
                            setBannerPreview(e.target.value);
                          }}
                          fullWidth
                          size="small"
                          placeholder="https://example.com/banner.jpg"
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
                  </>
                )}

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
                    {gradientOptions.map((option, index) => {
                      const selectedGradient = gradientOptions.find(g => g.value === formData.background);
                      const isSelected = formData.background === option.value;
                      
                      return (
                        <Box
                          key={index}
                          onClick={() =>
                            setFormData({ ...formData, background: option.value })
                          }
                          sx={{
                            width: "100%",
                            height: { xs: 60, sm: 50, md: 60 },
                            borderRadius: 2,
                            background: option.value,
                            backgroundImage: option.pattern,
                            backgroundSize: "20px 20px, 30px 30px",
                            cursor: "pointer",
                            border: isSelected
                              ? `3px solid ${colors.primary.main}`
                              : "2px solid rgba(255,255,255,0.3)",
                            boxShadow: isSelected 
                              ? "0 4px 12px rgba(0,0,0,0.2)" 
                              : "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              border: `2px solid ${colors.primary.light}`,
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            },
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          title={option.name}
                        >
                          {/* Pattern overlay for visual effect */}
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: option.pattern,
                              backgroundSize: "15px 15px, 25px 25px",
                              opacity: 0.6,
                            }}
                          />
                          
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: { xs: "none", sm: "block" },
                              color: "rgba(255,255,255,0.9)",
                              fontSize: "0.65rem",
                              textAlign: "center",
                              px: 0.5,
                              py: 0.5,
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderRadius: 1,
                              fontWeight: 600,
                              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              zIndex: 1,
                              position: "relative",
                            }}
                          >
                            {option.name.split(' ')[0]}
                          </Typography>
                        </Box>
                      );
                    })}
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
                {(() => {
                  const selectedGradient = gradientOptions.find(g => g.value === formData.background);
                  
                  return (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        ตัวอย่าง Banner
                      </Typography>

                      {formData.bannerType === "custom" ? (
                        // Custom Banner Preview (Current implementation)
                        <Box
                          sx={{
                            background: formData.background,
                            backgroundImage: selectedGradient?.pattern || "none",
                            backgroundSize: "20px 20px, 30px 30px",
                            borderRadius: 4,
                            p: { xs: 2, md: 3 },
                            position: "relative",
                            minHeight: { xs: 120, md: 140 },
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                            overflow: "hidden",
                            border: "3px solid rgba(255,255,255,0.3)",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: selectedGradient?.pattern || "none",
                              backgroundSize: "15px 15px, 25px 25px",
                              opacity: 0.4,
                              zIndex: 0,
                            },
                          }}
                        >
                          {/* Content */}
                          <Box sx={{ flex: 1, zIndex: 1, position: "relative" }}>
                            <Typography
                              variant="h5"
                              sx={{ 
                                fontWeight: 800, 
                                color: "white",
                                fontSize: { xs: "1.2rem", md: "1.5rem" },
                                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                mb: 0.5,
                                letterSpacing: "0.02em"
                              }}
                            >
                              {formData.title || "ชื่อ Banner"}
                            </Typography>
                            {(formData.subtitle || !formData.title) && (
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  color: "rgba(255,255,255,0.95)",
                                  fontSize: { xs: "0.85rem", md: "1rem" },
                                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  letterSpacing: "0.01em"
                                }}
                              >
                                {formData.subtitle || "คำอธิบายย่อย"}
                              </Typography>
                            )}
                            
                            {/* Decorative hearts */}
                            <Box sx={{ 
                              position: "absolute", 
                              top: -10, 
                              right: 20,
                              fontSize: "1.2rem",
                              opacity: 0.7,
                              color: "white",
                              textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                            }}>♥</Box>
                            <Box sx={{ 
                              position: "absolute", 
                              bottom: -5, 
                              right: 40,
                              fontSize: "0.8rem",
                              opacity: 0.5,
                              color: "white",
                              textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                            }}>♥</Box>
                          </Box>
                          
                          {/* Cat Image with enhanced styling */}
                          <Box sx={{ 
                            width: { xs: 80, md: 100 }, 
                            height: { xs: 100, md: 120 }, 
                            position: "relative",
                            ml: 2,
                            transform: "translateY(-10px)",
                            zIndex: 2,
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "120%",
                              height: "120%",
                              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
                              borderRadius: "50%",
                              zIndex: -1,
                            }
                          }}>
                            {(imagePreview || formData.imageUrl) ? (
                              <Image
                                src={imagePreview || formData.imageUrl}
                                alt={formData.imageAlt || "Preview"}
                                fill
                                style={{ 
                                  objectFit: "contain",
                                  filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))"
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "2px dashed rgba(255,255,255,0.5)",
                                  borderRadius: 2,
                                  color: "rgba(255,255,255,0.7)",
                                  fontSize: "0.8rem",
                                  textAlign: "center",
                                  p: 1
                                }}
                              >
                                รูปภาพ
                              </Box>
                            )}
                          </Box>
                          
                          {/* Info icon in top left */}
                          <Box sx={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            color: "white",
                            zIndex: 3
                          }}>
                            ℹ
                          </Box>
                        </Box>
                      ) : (
                        // Full Size Banner Preview
                        <Box
                          sx={{
                            width: "100%",
                            minHeight: { xs: 120, md: 140 },
                            borderRadius: 4,
                            overflow: "hidden",
                            position: "relative",
                            backgroundColor: "#f5f5f5",
                            border: "2px dashed #ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                          }}
                        >
                          {(bannerPreview || formData.bannerUrl) ? (
                            <Image
                              src={bannerPreview || formData.bannerUrl}
                              alt="Banner Preview"
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                ตัวอย่าง Banner เต็มขนาด
                              </Typography>
                              <Typography variant="caption">
                                อัปโหลด Banner เพื่อดูตัวอย่าง
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })()}

                {(uploading || uploadingBanner) && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                      {uploadingBanner ? 'กำลังอัปโหลด banner...' : 'กำลังอัปโหลดรูปภาพและบันทึกข้อมูล...'}
                    </Typography>
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
              disabled={uploading || uploadingBanner}
              fullWidth={true}
              sx={{
                backgroundColor: colors.primary.main,
                display: { xs: "block", sm: "inline-block" },
                "&:hover": {
                  backgroundColor: colors.primary.dark,
                },
              }}
            >
              {(uploading || uploadingBanner)
                ? uploadingBanner
                  ? "กำลังอัปโหลด banner..."
                  : "กำลังบันทึก..." 
                : editingBanner 
                  ? "แก้ไข" 
                  : "เพิ่ม"
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#d32f2f' }}>
          ยืนยันการลบ Banner
        </DialogTitle>
        <DialogContent>
          <Typography>
            คุณแน่ใจหรือไม่ที่จะลบ banner ชื่อ{' '}
            <strong>"{deleteConfirm.bannerTitle}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            การลบนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleDeleteCancel} color="inherit">
            ยกเลิก
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Themed Snackbar Component */}
      <SnackbarComponent />
    </Box>
  );
}
