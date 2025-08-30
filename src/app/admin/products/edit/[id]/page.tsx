"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  InputAdornment,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  PhotoCamera,
  Pets,
  AttachMoney,
  Delete,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { calculateVaccinationSchedule, formatThaiDate, getVaccineStatusText } from "@/lib/vaccination-utils";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  discountPercent: string;
  category: string;
  stock: string;
  productType: string;
  animalType: string;
  // สำหรับสัตว์เลี้ยง
  gender: string;
  age: string;
  weight: string;
  breed: string;
  color: string;
  location: string;
  contactInfo: string;
  healthNote: string;
  vaccinated: boolean;
  certified: boolean;
  // วัคซีนสำหรับลูกสุนัขและแมว
  birthDate: Dayjs | null;
  firstVaccineDate: Dayjs | null;
  secondVaccineDate: Dayjs | null;
  vaccineStatus: string;
  vaccineNotes: string;
  // สำหรับสินค้าทั่วไป
  brand: string;
  model: string;
  size: string;
  material: string;
  weightGrams: string;
  dimensions: string;
  isActive: boolean;
}

interface ExistingImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  isMain: boolean;
  order: number;
}

interface UploadedImage {
  size: string;
  filename: string;
  url: string;
  width: number | null;
  height: number | null;
}

const productTypes = [
  { value: "PET", label: "สัตว์เลี้ยง", icon: "🐕" },
  { value: "FOOD", label: "อาหารสัตว์", icon: "🍖" },
  { value: "TOY", label: "ของเล่น", icon: "🎾" },
  { value: "ACCESSORY", label: "อุปกรณ์/เครื่องใช้", icon: "🦴" },
  { value: "MEDICINE", label: "ยา/วิตามิน", icon: "💊" },
  { value: "GROOMING", label: "อุปกรณ์ดูแลขน", icon: "✂️" },
  { value: "HOUSING", label: "บ้าน/กรง", icon: "🏠" },
  { value: "OTHER", label: "อื่นๆ", icon: "📦" },
];

const animalTypes = [
  { value: "DOG", label: "สุนัข", icon: "🐕" },
  { value: "CAT", label: "แมว", icon: "🐱" },
  { value: "BIRD", label: "นก", icon: "🐦" },
  { value: "FISH", label: "ปลา", icon: "🐠" },
  { value: "RABBIT", label: "กระต่าย", icon: "🐰" },
  { value: "HAMSTER", label: "แฮมสเตอร์", icon: "🐹" },
  { value: "REPTILE", label: "สัตว์เลื้อยคลาน", icon: "🦎" },
  { value: "SMALL_PET", label: "สัตว์เลี้ยงตัวเล็ก", icon: "🐾" },
  { value: "GENERAL", label: "ทั่วไป/หลายชนิด", icon: "🌟" },
];

const genderOptions = [
  { value: "MALE", label: "ผู้ (เพศผู้)" },
  { value: "FEMALE", label: "เมีย (เพศเมีย)" },
];

const sizeOptions = [
  { value: "XS", label: "XS (พิเศษเล็ก)" },
  { value: "S", label: "S (เล็ก)" },
  { value: "M", label: "M (กลาง)" },
  { value: "L", label: "L (ใหญ่)" },
  { value: "XL", label: "XL (พิเศษใหญ่)" },
  { value: "XXL", label: "XXL (ใหญ่มาก)" },
  { value: "FREE", label: "Free Size (ไซส์เดียว)" },
];

interface Category {
  id: string;
  key: string;
  name: string;
  icon?: string;
  description?: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    discountPercent: "",
    category: "",
    stock: "",
    productType: "OTHER",
    animalType: "GENERAL",
    gender: "",
    age: "",
    weight: "",
    breed: "",
    color: "",
    location: "",
    contactInfo: "",
    healthNote: "",
    vaccinated: false,
    certified: false,
    // วัคซีนสำหรับลูกสุนัขและแมว
    birthDate: null,
    firstVaccineDate: null,
    secondVaccineDate: null,
    vaccineStatus: "NONE",
    vaccineNotes: "",
    brand: "",
    model: "",
    size: "",
    material: "",
    weightGrams: "",
    dimensions: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [calculatedVaccineSchedule, setCalculatedVaccineSchedule] = useState<any>(null);

  // Load product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const product = await response.json();

          // Populate form data
          setFormData({
            name: product.name || "",
            description: product.description || "",
            price: product.price?.toString() || "",
            salePrice: product.salePrice?.toString() || "",
            discountPercent: product.discountPercent?.toString() || "",
            category: product.category || "",
            stock: product.stock?.toString() || "",
            productType: product.productType || "OTHER",
            animalType: product.animalType || "GENERAL",
            gender: product.gender || "",
            age: product.age || "",
            weight: product.weight || "",
            breed: product.breed || "",
            color: product.color || "",
            location: product.location || "",
            contactInfo: product.contactInfo || "",
            healthNote: product.healthNote || "",
            vaccinated: product.vaccinated || false,
            certified: product.certified || false,
            // วัคซีนสำหรับลูกสุนัขและแมว
            birthDate: product.birthDate ? dayjs(product.birthDate) : null,
            firstVaccineDate: product.firstVaccineDate ? dayjs(product.firstVaccineDate) : null,
            secondVaccineDate: product.secondVaccineDate ? dayjs(product.secondVaccineDate) : null,
            vaccineStatus: product.vaccineStatus || "NONE",
            vaccineNotes: product.vaccineNotes || "",
            brand: product.brand || "",
            model: product.model || "",
            size: product.size || "",
            material: product.material || "",
            weightGrams: product.weight_grams?.toString() || "",
            dimensions: product.dimensions || "",
            isActive: product.isActive ?? true,
          });

          // Set existing images
          setExistingImages(product.images || []);
        } else {
          throw new Error("ไม่พบสินค้า");
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า");
      } finally {
        setLoadingProduct(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Map productType to category keys based on database categories
  const getCategoriesByProductType = (productType: string): Category[] => {
    // Return all categories for now - admin can choose any category for any product type
    // This gives more flexibility than hardcoded mapping
    return categories;
  };

  const handleInputChange =
    (field: keyof ProductFormData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
      const value = event.target.value;
      setFormData((prev) => {
        const newData = {
          ...prev,
          [field]: value,
        };

        // Clear category when product type changes
        if (field === "productType") {
          newData.category = "";
        }

        return newData;
      });
    };

  const handleCheckboxChange =
    (field: keyof ProductFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.checked,
      }));
    };

  // Calculate vaccination schedule when birth date changes
  useEffect(() => {
    if (formData.birthDate && formData.productType === 'PET') {
      try {
        const birthDate = formData.birthDate.toDate();
        const schedule = calculateVaccinationSchedule(birthDate);
        setCalculatedVaccineSchedule(schedule);
        
        // Auto-set calculated dates if not manually set (only for new products)
        if (!formData.firstVaccineDate && schedule.firstVaccineDate) {
          setFormData(prev => ({
            ...prev,
            firstVaccineDate: dayjs(schedule.firstVaccineDate!)
          }));
        }
        if (!formData.secondVaccineDate && schedule.secondVaccineDate) {
          setFormData(prev => ({
            ...prev,
            secondVaccineDate: dayjs(schedule.secondVaccineDate!)
          }));
        }
      } catch (error) {
        console.error('Error calculating vaccination schedule:', error);
      }
    } else {
      setCalculatedVaccineSchedule(null);
    }
  }, [formData.birthDate, formData.productType]);

  const processFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files);

    // Validate each file
    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB");
        return;
      }
    }

    // Add new files to existing selection
    setSelectedImages((prev) => [...prev, ...newFiles]);

    // Create preview URLs
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    processFiles(files);

    // Reset the input
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const uploadImages = async (): Promise<UploadedImage[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedImages: UploadedImage[] = [];

    for (let i = 0; i < selectedImages.length; i++) {
      const file = selectedImages[i];
      const formData = new FormData();
      formData.append("image", file);

      console.log(
        `อัปโหลดรูปภาพ ${i + 1}/${selectedImages.length}: ${file.name}`
      );

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `ไม่สามารถอัปโหลดรูปภาพ "${file.name}": ${errorData.error}`
        );
      }

      const result = await response.json();
      uploadedImages.push(...result.images);
    }

    console.log(`อัปโหลดรูปภาพสำเร็จทั้งหมด ${selectedImages.length} รูป`);
    return uploadedImages;
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "กรุณากรอกชื่อสินค้า";
    if (!formData.price.trim()) return "กรุณากรอกราคา";
    if (!formData.category) return "กรุณาเลือกหมวดหมู่";
    if (!formData.stock.trim()) return "กรุณากรอกจำนวนสต็อก";

    // Validate price format
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) return "กรุณากรอกราคาที่ถูกต้อง";

    // Validate stock format
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) return "กรุณากรอกจำนวนสต็อกที่ถูกต้อง";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload new images if any selected
      let uploadedImages: UploadedImage[] = [];
      if (selectedImages.length > 0) {
        uploadedImages = await uploadImages();
      }

      // Find the selected category to get its ID
      const selectedCategory = categories.find(
        (cat) => cat.key === formData.category
      );

      // Prepare existing images data
      const existingImagesData = existingImages.map((img, index) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText || `${formData.name} - รูปที่ ${index + 1}`,
        isMain: index === 0 && uploadedImages.length === 0, // Keep main if no new images
        order: index,
      }));

      // Prepare new images data
      const newImagesData = uploadedImages
        .filter((img) => img.size === "large")
        .map((img, index) => ({
          imageUrl: img.url,
          altText: `${formData.name} - รูปที่ ${
            existingImages.length + index + 1
          }`,
          isMain: existingImages.length === 0 && index === 0, // First new image is main if no existing images
          order: existingImages.length + index,
        }));

      // Prepare data for API
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        discountPercent: formData.discountPercent
          ? parseFloat(formData.discountPercent)
          : null,
        category: formData.category,
        categoryId: selectedCategory?.id || null,
        stock: parseInt(formData.stock),
        productType: formData.productType,

        // Pet-specific fields
        gender: formData.productType === "PET" ? formData.gender || null : null,
        age:
          formData.productType === "PET" ? formData.age.trim() || null : null,
        weight:
          formData.productType === "PET"
            ? formData.weight.trim() || null
            : null,
        breed:
          formData.productType === "PET" ? formData.breed.trim() || null : null,
        color:
          formData.productType === "PET" ? formData.color.trim() || null : null,
        location:
          formData.productType === "PET"
            ? formData.location.trim() || null
            : null,
        contactInfo:
          formData.productType === "PET"
            ? formData.contactInfo.trim() || null
            : null,
        healthNote:
          formData.productType === "PET"
            ? formData.healthNote.trim() || null
            : null,
        vaccinated: formData.productType === "PET" ? formData.vaccinated : null,
        certified: formData.productType === "PET" ? formData.certified : null,
        
        // Vaccination data (for dogs and cats)
        birthDate: formData.productType === 'PET' && (formData.category === 'dogs' || formData.category === 'cats') && formData.birthDate 
          ? formData.birthDate.toISOString() : null,
        firstVaccineDate: formData.productType === 'PET' && (formData.category === 'dogs' || formData.category === 'cats') && formData.firstVaccineDate 
          ? formData.firstVaccineDate.toISOString() : null,
        secondVaccineDate: formData.productType === 'PET' && (formData.category === 'dogs' || formData.category === 'cats') && formData.secondVaccineDate 
          ? formData.secondVaccineDate.toISOString() : null,
        vaccineStatus: formData.productType === 'PET' && (formData.category === 'dogs' || formData.category === 'cats') 
          ? formData.vaccineStatus || null : null,
        vaccineNotes: formData.productType === 'PET' && (formData.category === 'dogs' || formData.category === 'cats') 
          ? formData.vaccineNotes.trim() || null : null,

        // General product fields
        brand:
          formData.productType !== "PET" ? formData.brand.trim() || null : null,
        model:
          formData.productType !== "PET" ? formData.model.trim() || null : null,
        size: formData.productType !== "PET" ? formData.size || null : null,
        material:
          formData.productType !== "PET"
            ? formData.material.trim() || null
            : null,
        weightGrams:
          formData.productType !== "PET" && formData.weightGrams
            ? parseInt(formData.weightGrams)
            : null,
        dimensions:
          formData.productType !== "PET"
            ? formData.dimensions.trim() || null
            : null,

        isActive: formData.isActive,

        // Images data
        existingImages: existingImagesData,
        newImages: newImagesData,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "เกิดข้อผิดพลาดในการแก้ไขสินค้า");
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        handleLiffNavigation(router, "/admin/products");
      }, 2000);
    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการแก้ไขสินค้า");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    handleLiffNavigation(router, "/admin/products");
  };

  if (loadingProduct) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 400, textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              กำลังโหลดข้อมูลสินค้า...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 400, textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <Pets sx={{ fontSize: 64, color: colors.success, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
              แก้ไขสินค้าสำเร็จ!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              ข้อมูลสินค้าได้ถูกอัปเดตเรียบร้อยแล้ว
            </Typography>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              กำลังนำกลับไปหน้าจัดการสินค้า...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Box sx={{ 
        p: { xs: 1, md: 3 }, 
        maxWidth: { xs: "100%", md: 1200 }, 
        mx: "auto",
        minHeight: "100vh",
        width: "100%"
      }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleCancel}
          sx={{ mb: 2, color: colors.text.secondary }}
        >
          กลับ
        </Button>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: "bold", mb: 1 }}>
          แก้ไขสินค้า
        </Typography>
        <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>
          แก้ไขข้อมูลสินค้าในระบบ
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: { xs: 1, md: 3 },
            width: "100%"
          }}
        >
          {/* Main Form */}
          <Card sx={{ 
            width: "100%",
            order: { xs: 1, md: 1 },
            borderRadius: { xs: 0, md: 1 },
            boxShadow: { xs: 0, md: 1 }
          }}>
            <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                ข้อมูลสินค้า
              </Typography>

              {/* Product Type */}
              <Box sx={{ display: "grid", gap: 3, mb: 4 }}>
                <FormControl required>
                  <InputLabel>ประเภทสินค้า</InputLabel>
                  <Select
                    value={formData.productType}
                    onChange={handleInputChange("productType")}
                    label="ประเภทสินค้า"
                  >
                    {productTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <span style={{ fontSize: "1.2em" }}>{type.icon}</span>
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Basic Info */}
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                ข้อมูลพื้นฐาน
              </Typography>

              <Box sx={{ display: "grid", gap: 3, mb: 4 }}>
                <TextField
                  label="ชื่อสินค้า"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  required
                  fullWidth
                />

                <TextField
                  label="คำอธิบาย"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  multiline
                  rows={4}
                  fullWidth
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="ราคา"
                    value={formData.price}
                    onChange={handleInputChange("price")}
                    required
                    type="number"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">฿</InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="ราคาพิเศษ (ถ้ามี)"
                    value={formData.salePrice}
                    onChange={handleInputChange("salePrice")}
                    type="number"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">฿</InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <FormControl required>
                    <InputLabel>หมวดหมู่</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={handleInputChange("category")}
                      label="หมวดหมู่"
                      disabled={loadingCategories}
                    >
                      {getCategoriesByProductType(formData.productType).map(
                        (category) => (
                          <MenuItem key={category.key} value={category.key}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {category.icon && <span>{category.icon}</span>}
                              {category.name}
                            </Box>
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>

                  <TextField
                    label="จำนวนสต็อก"
                    value={formData.stock}
                    onChange={handleInputChange("stock")}
                    required
                    type="number"
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Conditional Fields Based on Product Type */}
              {formData.productType === "PET" && (
                <>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                    ข้อมูลสัตว์เลี้ยง
                  </Typography>

                  <Box sx={{ display: "grid", gap: 3 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <FormControl>
                        <InputLabel>เพศ</InputLabel>
                        <Select
                          value={formData.gender}
                          onChange={handleInputChange("gender")}
                          label="เพศ"
                        >
                          {genderOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label="อายุ"
                        value={formData.age}
                        onChange={handleInputChange("age")}
                        placeholder="เช่น 2 เดือน, 1 ปี"
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="น้ำหนัก"
                        value={formData.weight}
                        onChange={handleInputChange("weight")}
                        placeholder="เช่น 2.5 กก."
                      />

                      <TextField
                        label="สายพันธุ์"
                        value={formData.breed}
                        onChange={handleInputChange("breed")}
                        placeholder="เช่น คอร์กี้, โกลเด้น รีทรีฟเวอร์"
                      />
                    </Box>

                    <TextField
                      label="สี"
                      value={formData.color}
                      onChange={handleInputChange("color")}
                      placeholder="เช่น สีทอง, สีน้ำตาล"
                    />

                    <TextField
                      label="ที่อยู่/สถานที่"
                      value={formData.location}
                      onChange={handleInputChange("location")}
                      placeholder="เช่น กรุงเทพฯ, เชียงใหม่"
                    />

                    <TextField
                      label="ข้อมูลติดต่อ"
                      value={formData.contactInfo}
                      onChange={handleInputChange("contactInfo")}
                      multiline
                      rows={2}
                      placeholder="เบอร์โทร, ไลน์ ไอดี, หรือข้อมูลการติดต่ออื่นๆ"
                    />

                    <TextField
                      label="หมายเหตุเรื่องสุขภาพ"
                      value={formData.healthNote}
                      onChange={handleInputChange("healthNote")}
                      multiline
                      rows={2}
                      placeholder="ข้อมูลเกี่ยวกับสุขภาพหรือการดูแลเฉพาะ"
                    />

                    {/* Vaccination Section - Only for dogs and cats */}
                    {(formData.category === 'dogs' || formData.category === 'cats') && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                          📋 ข้อมูลการฉีดวัคซีน (สำหรับ{formData.category === 'dogs' ? 'ลูกสุนัข' : 'ลูกแมว'})
                        </Typography>

                        {/* Birth Date */}
                        <DatePicker
                          label="วันเกิด"
                          value={formData.birthDate}
                          onChange={(newValue) => setFormData(prev => ({ ...prev, birthDate: newValue }))}
                          format="DD/MM/YYYY"
                          maxDate={dayjs()}
                          slotProps={{
                            textField: {
                              helperText: "วันเกิดจะใช้คำนวณตารางการฉีดวัคซีนอัตโนมัติ",
                              required: true,
                              fullWidth: true,
                              sx: {
                                mb: 2,
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: colors.background.default,
                                }
                              }
                            }
                          }}
                        />

                        {/* Show calculated schedule */}
                        {calculatedVaccineSchedule && (
                          <Paper sx={{ p: 2, mb: 3, backgroundColor: colors.cardBg.lightTeal }}>
                            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                              📅 ตารางการฉีดวัคซีนที่คำนวณได้:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              • เข็มที่ 1 (8 สัปดาห์): {formatThaiDate(calculatedVaccineSchedule.firstVaccineDate)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              • เข็มที่ 2 (12 สัปดาห์): {formatThaiDate(calculatedVaccineSchedule.secondVaccineDate)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              อายุปัจจุบัน: {calculatedVaccineSchedule.ageInWeeks} สัปดาห์
                            </Typography>
                          </Paper>
                        )}

                        {/* Vaccine Status */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>สถานะการฉีดวัคซีน</InputLabel>
                          <Select
                            value={formData.vaccineStatus}
                            onChange={handleInputChange('vaccineStatus')}
                            label="สถานะการฉีดวัคซีน"
                          >
                            <MenuItem value="NONE">ยังไม่ได้ฉีดวัคซีน</MenuItem>
                            <MenuItem value="FIRST_DONE">ฉีดเข็มที่ 1 แล้ว</MenuItem>
                            <MenuItem value="SECOND_DONE">ฉีดครบ 2 เข็มแล้ว</MenuItem>
                          </Select>
                        </FormControl>

                        {/* Vaccine Dates */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 2 }}>
                          <DatePicker
                            label="วันที่ฉีดเข็มที่ 1 (จริง)"
                            value={formData.firstVaccineDate}
                            onChange={(newValue) => setFormData(prev => ({ ...prev, firstVaccineDate: newValue }))}
                            format="DD/MM/YYYY"
                            slotProps={{
                              textField: {
                                helperText: "วันที่ฉีดจริง (เลือกได้หากฉีดแล้ว)",
                                fullWidth: true,
                                sx: {
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    backgroundColor: colors.background.default,
                                  }
                                }
                              }
                            }}
                          />
                          
                          {/* Show second vaccine date picker only when vaccine status is SECOND_DONE */}
                          {formData.vaccineStatus === 'SECOND_DONE' && (
                            <DatePicker
                              label="วันที่ฉีดเข็มที่ 2 (จริง)"
                              value={formData.secondVaccineDate}
                              onChange={(newValue) => setFormData(prev => ({ ...prev, secondVaccineDate: newValue }))}
                              format="DD/MM/YYYY"
                              slotProps={{
                                textField: {
                                  helperText: "วันที่ฉีดจริง (เลือกได้หากฉีดแล้ว)",
                                  fullWidth: true,
                                  sx: {
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 2,
                                      backgroundColor: colors.background.default,
                                    }
                                  }
                                }
                              }}
                            />
                          )}
                        </Box>

                        {/* Vaccine Notes */}
                        <TextField
                          label="หมายเหตุการฉีดวัคซีน"
                          value={formData.vaccineNotes}
                          onChange={handleInputChange('vaccineNotes')}
                          multiline
                          rows={2}
                          placeholder="เช่น ฉีดที่คลินิก ABC, มีการแพ้ยาเล็กน้อย"
                          fullWidth
                          sx={{ mb: 2 }}
                        />
                      </>
                    )}

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.vaccinated}
                            onChange={handleCheckboxChange("vaccinated")}
                          />
                        }
                        label="ฉีดวัคซีนแล้ว"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.certified}
                            onChange={handleCheckboxChange("certified")}
                          />
                        }
                        label="มีใบรับรอง"
                      />
                    </Box>
                  </Box>
                </>
              )}

              {/* General Product Info - for non-pet products */}
              {formData.productType !== "PET" && (
                <>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                    ข้อมูลสินค้าทั่วไป
                  </Typography>

                  <Box sx={{ display: "grid", gap: 3 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="แบรนด์"
                        value={formData.brand}
                        onChange={handleInputChange("brand")}
                        placeholder="เช่น Royal Canin, Pedigree"
                      />
                      <TextField
                        label="รุ่น/โมเดล"
                        value={formData.model}
                        onChange={handleInputChange("model")}
                        placeholder="เช่น Adult, Puppy, Premium"
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <FormControl>
                        <InputLabel>ขนาด</InputLabel>
                        <Select
                          value={formData.size}
                          onChange={handleInputChange("size")}
                          label="ขนาด"
                        >
                          {sizeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label="วัสดุ"
                        value={formData.material}
                        onChange={handleInputChange("material")}
                        placeholder="เช่น ไนล่อน, ผ้าฝ้าย, พลาสติก"
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="น้ำหนักสินค้า (กรัม)"
                        value={formData.weightGrams}
                        onChange={handleInputChange("weightGrams")}
                        type="number"
                        placeholder="เช่น 500, 1000"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        label="ขนาดโดยรวม"
                        value={formData.dimensions}
                        onChange={handleInputChange("dimensions")}
                        placeholder="เช่น 30x20x15 ซม."
                      />
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <Box sx={{ 
            width: "100%",
            order: { xs: 2, md: 2 }
          }}>
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <Card sx={{ 
                mb: { xs: 1, md: 3 },
                borderRadius: { xs: 0, md: 1 },
                boxShadow: { xs: 0, md: 1 }
              }}>
                <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    รูปภาพปัจจุบัน
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                    }}
                  >
                    {existingImages.map((image, index) => (
                      <Box key={image.id} sx={{ position: "relative" }}>
                        <Box
                          component="img"
                          src={image.imageUrl}
                          alt={image.altText || `รูปที่ ${index + 1}`}
                          sx={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: colors.text.disabled,
                          }}
                        />
                        {image.isMain && (
                          <Chip
                            label="รูปหลัก"
                            size="small"
                            sx={{
                              position: "absolute",
                              bottom: 4,
                              left: 4,
                              backgroundColor: colors.primary.main,
                              color: "white",
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveExistingImage(image.id)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255,255,255,0.8)",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.9)",
                            },
                          }}
                        >
                          <Delete
                            fontSize="small"
                            sx={{ color: colors.error }}
                          />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Image Upload */}
            <Card sx={{ 
              mb: { xs: 1, md: 3 },
              borderRadius: { xs: 0, md: 1 },
              boxShadow: { xs: 0, md: 1 }
            }}>
              <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  เพิ่มรูปภาพใหม่
                </Typography>

                {/* Upload Area */}
                <Box sx={{ mb: 2 }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                    id="image-upload"
                    disabled={loading}
                  />
                  <label htmlFor="image-upload">
                    <Box
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      sx={{
                        border: `2px dashed ${
                          isDragOver
                            ? colors.primary.main
                            : colors.text.disabled
                        }`,
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        cursor: loading ? "not-allowed" : "pointer",
                        backgroundColor: isDragOver
                          ? colors.primary.main + "10"
                          : "transparent",
                        transition: "all 0.2s ease",
                        ...(!loading && {
                          "&:hover": {
                            borderColor: colors.primary.main,
                            backgroundColor: colors.primary.main + "05",
                          },
                        }),
                      }}
                    >
                      <PhotoCamera
                        sx={{
                          fontSize: 48,
                          color: isDragOver
                            ? colors.primary.main
                            : colors.text.disabled,
                          mb: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {isDragOver
                          ? "วางไฟล์รูปภาพที่นี่"
                          : "คลิกหรือลากไฟล์รูปภาพมาวาง"}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        รองรับไฟล์ JPG, PNG (สูงสุด 10MB ต่อรูป)
                      </Typography>
                    </Box>
                  </label>
                </Box>

                {/* New Images Preview */}
                {selectedImages.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: "bold" }}
                    >
                      รูปภาพใหม่ ({selectedImages.length} รูป)
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                      }}
                    >
                      {imagePreviews.map((preview, index) => (
                        <Box key={index} sx={{ position: "relative" }}>
                          <Box
                            component="img"
                            src={preview}
                            alt={`รูปภาพใหม่ ${index + 1}`}
                            sx={{
                              width: "100%",
                              height: "100px",
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: colors.text.disabled,
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNewImage(index)}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "rgba(255,255,255,0.8)",
                              "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.9)",
                              },
                            }}
                          >
                            <Delete
                              fontSize="small"
                              sx={{ color: colors.error }}
                            />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card sx={{ 
              mb: { xs: 1, md: 3 },
              borderRadius: { xs: 0, md: 1 },
              boxShadow: { xs: 0, md: 1 }
            }}>
              <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  การตั้งค่า
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isActive}
                      onChange={handleCheckboxChange("isActive")}
                    />
                  }
                  label="เปิดขายทันที"
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card sx={{
              borderRadius: { xs: 0, md: 1 },
              boxShadow: { xs: 0, md: 1 }
            }}>
              <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={!isMobile && (loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Save />
                      ))}
                    disabled={loading}
                    fullWidth
                    size={isMobile ? "large" : "medium"}
                    sx={{
                      backgroundColor: colors.primary.main,
                      "&:hover": { backgroundColor: colors.primary.dark },
                      minHeight: { xs: 48, md: "auto" },
                    }}
                  >
                    {loading
                      ? selectedImages.length > 0
                        ? isMobile ? "กำลังอัปโหลดรูปภาพ..." : "กำลังอัปโหลดรูปภาพและบันทึกสินค้า..."
                        : "กำลังบันทึกสินค้า..."
                      : "บันทึกการแก้ไข"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    fullWidth
                    size={isMobile ? "large" : "medium"}
                    sx={{
                      minHeight: { xs: 48, md: "auto" },
                    }}
                  >
                    ยกเลิก
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </form>
      </Box>
    </LocalizationProvider>
  );
}
