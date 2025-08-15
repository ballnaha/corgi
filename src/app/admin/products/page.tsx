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
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { colors } from "@/theme/colors";
import { handleLiffNavigation } from "@/lib/liff-navigation";

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

const categories = [
  "สุนัขพันธุ์เล็ก",
  "สุนัขพันธุ์กลาง", 
  "สุนัขพันธุ์ใหญ่",
  "ลูกสุนัข",
  "สุนัขโกลเด้น",
  "สุนัขคอร์กี้",
];

const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "active", label: "เปิดขาย" },
  { value: "inactive", label: "ปิดขาย" },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      
      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
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

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    if (!confirm(`คุณต้องการลบสินค้า "${selectedProduct.name}" หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถลบสินค้าได้");
      }

      // Refresh products
      await fetchProducts();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการลบสินค้า");
    }
    handleMenuClose();
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
              จัดการสินค้า
            </Typography>
            <Typography color="text.secondary">
              ดูและจัดการสินค้าทั้งหมดในระบบ
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleLiffNavigation(router, "/admin/products/new")}
            sx={{
              backgroundColor: colors.primary.main,
              "&:hover": { backgroundColor: colors.primary.dark },
            }}
          >
            เพิ่มสินค้าใหม่
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {products.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                สินค้าทั้งหมด
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: colors.success }}>
                {products.filter(p => p.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เปิดขาย
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: colors.error }}>
                {products.filter(p => !p.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ปิดขาย
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: colors.warning }}>
                {products.filter(p => p.stock < 5).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: showFilters ? 2 : 0 }}>
            <TextField
              placeholder="ค้นหาสินค้า..."
              value={filter.search}
              onChange={handleFilterChange('search')}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              ตัวกรอง
            </Button>
            {(filter.category || filter.status || filter.minPrice || filter.maxPrice) && (
              <Button size="small" onClick={clearFilters}>
                ล้างตัวกรอง
              </Button>
            )}
          </Box>

          {showFilters && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <FormControl size="small">
                <InputLabel>หมวดหมู่</InputLabel>
                <Select
                  value={filter.category}
                  onChange={handleFilterChange('category')}
                  label="หมวดหมู่"
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
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

      {/* Products Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr', xl: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
        {paginatedProducts.map((product) => (
          <Card key={product.id} sx={{ position: "relative" }}>
            <Box
              sx={{
                position: "relative",
                paddingTop: "75%", // 4:3 aspect ratio
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
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: product.isActive ? colors.success : colors.error,
                  color: "white",
                }}
              />

              {/* Discount Badge */}
              {hasDiscount(product) && (
                <Chip
                  label={`-${product.discountPercent ? `${product.discountPercent}%` : 'Sale'}`}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: colors.error,
                    color: "white",
                  }}
                />
              )}

              {/* Menu Button */}
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, product)}
                sx={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  backgroundColor: "rgba(255,255,255,0.9)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                }}
              >
                <MoreVert />
              </IconButton>
            </Box>

            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, fontSize: "1rem" }}>
                {product.name}
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Chip label={product.category} size="small" variant="outlined" />
                {product.breed && (
                  <Chip label={product.breed} size="small" variant="outlined" />
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                {hasDiscount(product) && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                      textDecoration: "line-through",
                      fontSize: "0.85rem",
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
                    fontSize: "1rem",
                  }}
                >
                  ฿{getEffectivePrice(product).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  สต็อก: {product.stock}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {product.vaccinated && (
                    <Chip label="วัคซีน" size="small" color="success" variant="outlined" />
                  )}
                  {product.certified && (
                    <Chip label="ใบรับรอง" size="small" color="info" variant="outlined" />
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
            labelRowsPerPage="รายการต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
          />
        </Card>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <PhotoCamera sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            ไม่พบสินค้า
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {products.length === 0 
              ? "ยังไม่มีสินค้าในระบบ เริ่มต้นด้วยการเพิ่มสินค้าใหม่"
              : "ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา"
            }
          </Typography>
          {products.length === 0 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleLiffNavigation(router, "/admin/products/new")}
              sx={{
                backgroundColor: colors.primary.main,
                "&:hover": { backgroundColor: colors.primary.dark },
              }}
            >
              เพิ่มสินค้าแรก
            </Button>
          )}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemMui onClick={handleEditProduct}>
          <Edit sx={{ mr: 1 }} />
          แก้ไข
        </MenuItemMui>
        <MenuItemMui onClick={handleToggleStatus}>
          {selectedProduct?.isActive ? (
            <>
              <VisibilityOff sx={{ mr: 1 }} />
              ปิดขาย
            </>
          ) : (
            <>
              <Visibility sx={{ mr: 1 }} />
              เปิดขาย
            </>
          )}
        </MenuItemMui>
        <MenuItemMui onClick={handleDeleteProduct} sx={{ color: colors.error }}>
          <Delete sx={{ mr: 1 }} />
          ลบ
        </MenuItemMui>
      </Menu>
    </Box>
  );
}
