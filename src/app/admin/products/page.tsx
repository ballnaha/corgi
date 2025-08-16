"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem as MenuItemMui,
  Alert,
  CircularProgress,
  InputAdornment,
  TablePagination,
  Drawer,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  Stack,
  Collapse,
} from "@mui/material";
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Close,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  discountPercent: number | null;
  category: string;
  stock: number;
  isActive: boolean;
  gender: string | null;
  age: string | null;
  weight: string | null;
  breed: string | null;
  color: string | null;
  location: string | null;
  vaccinated: boolean;
  certified: boolean;
  createdAt: string;
  updatedAt: string;
  images: Array<{
    id: string;
    imageUrl: string;
    altText: string | null;
    isMain: boolean;
  }>;
}

interface FilterState {
  search: string;
  category: string;
  status: string;
  minPrice: string;
  maxPrice: string;
}

const initialFilter: FilterState = {
  search: "",
  category: "",
  status: "",
  minPrice: "",
  maxPrice: "",
};

interface Category {
  id: string;
  key: string;
  name: string;
  icon?: string;
  description?: string;
}

const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "active", label: "เปิดขาย" },
  { value: "inactive", label: "ปิดขาย" },
];

export default function ProductsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Helper function to get category name from key
  const getCategoryName = (categoryKey: string): string => {
    const category = categories.find(cat => cat.key === categoryKey);
    return category ? category.name : categoryKey;
  };

  useEffect(() => {
    applyFilters();
  }, [products, filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // โหลดสินค้าทั้งหมดโดยใช้ limit ที่ใหญ่พอ
      const response = await fetch("/api/admin/products?limit=1000");
      
      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้");
      }

      const data = await response.json();
      
      if (data.success && data.products) {
        console.log(`📦 Loaded ${data.products.length} products from API`);
        console.log(`📊 Total count from API: ${data.pagination?.totalCount || 'N/A'}`);
        setProducts(data.products);
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        console.log(`📦 Loaded ${data.length} products (direct array)`);
        setProducts(data);
      } else {
        throw new Error("Invalid response format from products API");
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const applyFilters = () => {
    if (!products || !Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }
    
    let filtered = [...products];

    // Search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.breed?.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filter.category) {
      filtered = filtered.filter(product => product.category === filter.category);
    }

    // Status filter
    if (filter.status) {
      const isActive = filter.status === "active";
      filtered = filtered.filter(product => product.isActive === isActive);
    }

    // Price range filter
    if (filter.minPrice) {
      const minPrice = parseFloat(filter.minPrice);
      filtered = filtered.filter(product => product.price >= minPrice);
    }
    if (filter.maxPrice) {
      const maxPrice = parseFloat(filter.maxPrice);
      filtered = filtered.filter(product => product.price <= maxPrice);
    }

    setFilteredProducts(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleFilterChange = (field: keyof FilterState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFilter(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const clearFilters = () => {
    setFilter(initialFilter);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleEditProduct = () => {
    if (selectedProduct) {
      handleLiffNavigation(router, `/admin/products/edit/${selectedProduct.id}`);
    }
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !selectedProduct.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถเปลี่ยนสถานะสินค้าได้");
      }

      // Refresh products
      await fetchProducts();
    } catch (err: any) {
      console.error("Error toggling product status:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
    handleMenuClose();
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;

    setConfirmDialog({
      open: true,
      title: "ยืนยันการลบสินค้า",
      message: `คุณต้องการลบสินค้า "${selectedProduct.name}" หรือไม่?\n\nการดำเนินการนี้จะลบสินค้าและรูปภาพทั้งหมดอย่างถาวร และไม่สามารถกู้คืนได้`,
      onConfirm: confirmDeleteProduct,
    });
    handleMenuClose();
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถลบสินค้าได้");
      }

      // Close dialog and refresh products
      setConfirmDialog({ ...confirmDialog, open: false });
      await fetchProducts();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการลบสินค้า");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getMainImage = (product: Product) => {
    const mainImage = product.images.find(img => img.isMain);
    return mainImage?.imageUrl || product.images[0]?.imageUrl || "/images/icon-corgi.png";
  };

  const getEffectivePrice = (product: Product) => {
    if (product.salePrice) return product.salePrice;
    if (product.discountPercent) {
      return product.price * (1 - product.discountPercent / 100);
    }
    return product.price;
  };

  const hasDiscount = (product: Product) => {
    return product.salePrice || product.discountPercent;
  };

  const getDiscountPercent = (product: Product) => {
    if (product.discountPercent != null && product.discountPercent > 0) {
      return product.discountPercent;
    }
    if (product.salePrice != null && product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  // Pagination
  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography color="text.secondary">กำลังโหลดข้อมูลสินค้า...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between", 
          alignItems: { xs: "flex-start", sm: "center" }, 
          gap: { xs: 2, sm: 0 },
          mb: 2 
        }}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: "bold", mb: 1 }}>
              จัดการสินค้า
            </Typography>
            <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>
              ดูและจัดการสินค้าทั้งหมดในระบบ
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={!isMobile && <Add />}
            onClick={() => handleLiffNavigation(router, "/admin/products/new")}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
              minHeight: { xs: 48, sm: "auto" },
            }}
          >
            {isMobile ? "เพิ่มสินค้า" : "เพิ่มสินค้าใหม่"}
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, 
          gap: { xs: 1.5, sm: 2 }, 
          mb: 3 
        }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: { xs: 1.5, sm: 2 } }}>
              <Typography variant={isMobile ? "h6" : "h6"} sx={{ fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                {products.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                สินค้าทั้งหมด
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: "center", py: { xs: 1.5, sm: 2 } }}>
              <Typography variant={isMobile ? "h6" : "h6"} sx={{ 
                fontWeight: "bold", 
                color: colors.success,
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}>
                {(products || []).filter(p => p.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                เปิดขาย
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: "center", py: { xs: 1.5, sm: 2 } }}>
              <Typography variant={isMobile ? "h6" : "h6"} sx={{ 
                fontWeight: "bold", 
                color: colors.error,
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}>
                {(products || []).filter(p => !p.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                ปิดขาย
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: "center", py: { xs: 1.5, sm: 2 } }}>
              <Typography variant={isMobile ? "h6" : "h6"} sx={{ 
                fontWeight: "bold", 
                color: colors.warning,
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}>
                {(products || []).filter(p => p.stock < 5).length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                สต็อกน้อย
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" }, 
            gap: 2, 
            mb: showFilters && !isMobile ? 2 : 0 
          }}>
            <TextField
              placeholder="ค้นหาสินค้า..."
              value={filter.search}
              onChange={handleFilterChange('search')}
              size={isMobile ? "medium" : "small"}
              fullWidth={isMobile}
              sx={{ 
                minWidth: { xs: "auto", sm: 250 },
                flex: { xs: "none", sm: 1 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ 
              display: "flex", 
              gap: 1,
              width: { xs: "100%", sm: "auto" }
            }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
                onClick={() => isMobile ? setMobileFilterOpen(true) : setShowFilters(!showFilters)}
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  flex: { xs: 1, sm: "none" },
                  minHeight: { xs: 48, sm: "auto" }
                }}
            >
              ตัวกรอง
            </Button>
            {(filter.category || filter.status || filter.minPrice || filter.maxPrice) && (
                <Button 
                  size={isMobile ? "medium" : "small"} 
                  onClick={clearFilters}
                  sx={{ 
                    minHeight: { xs: 48, sm: "auto" },
                    whiteSpace: "nowrap"
                  }}
                >
                  ล้าง
              </Button>
            )}
            </Box>
          </Box>

          {/* Desktop Filters */}
          {showFilters && !isMobile && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl size="small">
                <InputLabel>หมวดหมู่</InputLabel>
                <Select
                  value={filter.category}
                  onChange={handleFilterChange('category')}
                  label="หมวดหมู่"
                  disabled={loadingCategories}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.key} value={category.key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={filter.status}
                  onChange={handleFilterChange('status')}
                  label="สถานะ"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="ราคาต่ำสุด"
                value={filter.minPrice}
                onChange={handleFilterChange('minPrice')}
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                }}
              />

              <TextField
                label="ราคาสูงสุด"
                value={filter.maxPrice}
                onChange={handleFilterChange('maxPrice')}
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px 16px 0 0",
            maxHeight: "80vh",
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              ตัวกรองสินค้า
            </Typography>
            <IconButton onClick={() => setMobileFilterOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>หมวดหมู่</InputLabel>
              <Select
                value={filter.category}
                onChange={handleFilterChange('category')}
                label="หมวดหมู่"
                disabled={loadingCategories}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.key} value={category.key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={filter.status}
                onChange={handleFilterChange('status')}
                label="สถานะ"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="ราคาต่ำสุด"
                value={filter.minPrice}
                onChange={handleFilterChange('minPrice')}
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                }}
              />

              <TextField
                label="ราคาสูงสุด"
                value={filter.maxPrice}
                onChange={handleFilterChange('maxPrice')}
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
                size="large"
                sx={{ minHeight: 48 }}
              >
                ล้างตัวกรอง
              </Button>
              <Button
                variant="contained"
                onClick={() => setMobileFilterOpen(false)}
                fullWidth
                size="large"
                sx={{ 
                  minHeight: 48,
                  backgroundColor: colors.primary.main,
                  "&:hover": { backgroundColor: colors.primary.dark },
                }}
              >
                ปิด
              </Button>
            </Box>
          </Stack>
        </Box>
      </Drawer>

      {/* Products Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: '1fr 1fr', 
          lg: '1fr 1fr 1fr', 
          xl: '1fr 1fr 1fr 1fr' 
        }, 
        gap: { xs: 2, sm: 3 }, 
        mb: 3 
      }}>
        {paginatedProducts.map((product) => (
          <Card 
            key={product.id} 
            sx={{ 
              position: "relative",
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 3,
              }
            }}
          >
            <Box
              sx={{
                position: "relative",
                paddingTop: { xs: "60%", sm: "75%" }, // More square on mobile
                overflow: "hidden",
                borderRadius: "4px 4px 0 0",
              }}
            >
              <Box
                component="img"
                src={getMainImage(product)}
                alt={product.name}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/icon-corgi.png";
                }}
              />
              
              {/* Status Badge */}
              <Chip
                label={product.isActive ? "เปิดขาย" : "ปิดขาย"}
                size={isMobile ? "small" : "small"}
                sx={{
                  position: "absolute",
                  top: { xs: 6, sm: 8 },
                  left: { xs: 6, sm: 8 },
                  backgroundColor: product.isActive ? colors.success : colors.error,
                  color: "white",
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  height: { xs: 20, sm: 24 },
                }}
              />

              {/* Discount Badge */}
              {hasDiscount(product) && (
                <Chip
                  label={`-${getDiscountPercent(product)}%`}
                  size={isMobile ? "small" : "small"}
                  sx={{
                    position: "absolute",
                    top: { xs: 6, sm: 8 },
                    right: { xs: 6, sm: 8 },
                    backgroundColor: colors.error,
                    color: "white",
                    fontWeight: "bold",
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    height: { xs: 20, sm: 24 },
                  }}
                />
              )}

              {/* Menu Button */}
              <IconButton
                size={isMobile ? "medium" : "small"}
                onClick={(e) => handleMenuOpen(e, product)}
                sx={{
                  position: "absolute",
                  bottom: { xs: 6, sm: 8 },
                  right: { xs: 6, sm: 8 },
                  backgroundColor: "rgba(255,255,255,0.95)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                  width: { xs: 36, sm: 32 },
                  height: { xs: 36, sm: 32 },
                  boxShadow: 1,
                }}
              >
                <MoreVert sx={{ fontSize: { xs: "1.2rem", sm: "1rem" } }} />
              </IconButton>
            </Box>

            <CardContent sx={{ 
              p: { xs: 1.5, sm: 2 },
              "&:last-child": { pb: { xs: 1.5, sm: 2 } }
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: "bold", 
                  mb: 1, 
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  height: { xs: "2.6em", sm: "auto" }
                }}
              >
                {product.name}
              </Typography>
              
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5, 
                mb: 1,
                flexWrap: "wrap"
              }}>
                <Chip 
                  label={getCategoryName(product.category)} 
                  size="small" 
                  variant="outlined" 
                  sx={{ 
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    height: { xs: 20, sm: 24 }
                  }}
                />
                {product.breed && (
                  <Chip 
                    label={product.breed} 
                    size="small" 
                    variant="outlined" 
                    sx={{ 
                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      height: { xs: 20, sm: 24 }
                    }}
                  />
                )}
              </Box>

              <Box sx={{ 
                display: "flex", 
                alignItems: "baseline", 
                gap: 1, 
                mb: { xs: 1, sm: 1 },
                flexWrap: "wrap"
              }}>
                {hasDiscount(product) && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                      textDecoration: "line-through",
                      fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    }}
                  >
                    ฿{product.price.toLocaleString()}
                  </Typography>
                )}
                <Typography
                  variant="h6"
                  sx={{
                    color: hasDiscount(product) ? colors.error : colors.primary.main,
                    fontWeight: "bold",
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  ฿{getEffectivePrice(product).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 0 },
                alignItems: { xs: "flex-start", sm: "center" }
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  สต็อก: {product.stock}
                </Typography>
                <Box sx={{ 
                  display: "flex", 
                  gap: 0.5,
                  flexWrap: "wrap"
                }}>
                  {product.vaccinated && (
                    <Chip 
                      label="วัคซีน" 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: { xs: "0.6rem", sm: "0.75rem" },
                        height: { xs: 18, sm: 24 }
                      }}
                    />
                  )}
                  {product.certified && (
                    <Chip 
                      label="ใบรับรอง" 
                      size="small" 
                      color="info" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: { xs: "0.6rem", sm: "0.75rem" },
                        height: { xs: 18, sm: 24 }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Pagination */}
      {filteredProducts.length > rowsPerPage && (
        <Card>
          <TablePagination
            component="div"
            count={filteredProducts.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[12, 24, 48]}
            labelRowsPerPage={isMobile ? "ต่อหน้า:" : "รายการต่อหน้า:"}
            labelDisplayedRows={({ from, to, count }) =>
              isMobile 
                ? `${from}-${to}/${count !== -1 ? count : `${to}+`}`
                : `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
            sx={{
              "& .MuiTablePagination-toolbar": {
                minHeight: { xs: 52, sm: 64 },
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 0 },
                alignItems: { xs: "stretch", sm: "center" }
              },
              "& .MuiTablePagination-spacer": {
                display: { xs: "none", sm: "block" }
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                textAlign: { xs: "center", sm: "left" }
              },
              "& .MuiTablePagination-actions": {
                "& .MuiIconButton-root": {
                  padding: { xs: 1, sm: 0.75 }
                }
              }
            }}
          />
        </Card>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <Box sx={{ 
          textAlign: "center", 
          py: { xs: 6, sm: 8 },
          px: { xs: 2, sm: 0 }
        }}>
          <PhotoCamera sx={{ 
            fontSize: { xs: 48, sm: 64 }, 
            color: colors.text.disabled, 
            mb: 2 
          }} />
          <Typography 
            variant={isMobile ? "h6" : "h6"} 
            sx={{ 
              mb: 1,
              fontSize: { xs: "1.1rem", sm: "1.25rem" }
            }}
          >
            ไม่พบสินค้า
          </Typography>
          <Typography 
            color="text.secondary" 
            sx={{ 
              mb: 3,
              fontSize: { xs: "0.875rem", sm: "1rem" },
              maxWidth: { xs: "100%", sm: 400 },
              mx: "auto"
            }}
          >
            {products.length === 0 
              ? "ยังไม่มีสินค้าในระบบ เริ่มต้นด้วยการเพิ่มสินค้าใหม่"
              : "ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา"
            }
          </Typography>
          {products.length === 0 && (
            <Button
              variant="contained"
              startIcon={!isMobile && <Add />}
              onClick={() => handleLiffNavigation(router, "/admin/products/new")}
              size={isMobile ? "large" : "medium"}
              sx={{
                backgroundColor: colors.primary.main,
                "&:hover": { backgroundColor: colors.primary.dark },
                minHeight: { xs: 48, sm: "auto" },
                px: { xs: 4, sm: 2 }
              }}
            >
              {isMobile ? "เพิ่มสินค้าแรก" : "เพิ่มสินค้าแรก"}
            </Button>
          )}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: { xs: 160, sm: 140 },
            "& .MuiMenuItem-root": {
              fontSize: { xs: "0.9rem", sm: "0.875rem" },
              minHeight: { xs: 44, sm: 36 },
              px: { xs: 2, sm: 1.5 },
              py: { xs: 1, sm: 0.75 }
            }
          }
        }}
      >
        <MenuItemMui onClick={handleEditProduct}>
          <Edit sx={{ mr: 1, fontSize: { xs: "1.1rem", sm: "1rem" } }} />
          แก้ไข
        </MenuItemMui>
        <MenuItemMui onClick={handleToggleStatus}>
          {selectedProduct?.isActive ? (
            <>
              <VisibilityOff sx={{ mr: 1, fontSize: { xs: "1.1rem", sm: "1rem" } }} />
              ปิดขาย
            </>
          ) : (
            <>
              <Visibility sx={{ mr: 1, fontSize: { xs: "1.1rem", sm: "1rem" } }} />
              เปิดขาย
            </>
          )}
        </MenuItemMui>
        <MenuItemMui onClick={handleDeleteProduct} sx={{ color: colors.error }}>
          <Delete sx={{ mr: 1, fontSize: { xs: "1.1rem", sm: "1rem" } }} />
          ลบ
        </MenuItemMui>
      </Menu>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="ลบสินค้า"
        cancelText="ยกเลิก"
        severity="error"
        loading={deleteLoading}
      />
    </Box>
  );
}
