"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, CircularProgress, Slide, Container } from "@mui/material";
import type { SlideProps } from "@mui/material";
import { colors } from "@/theme/colors";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import BannerSection from "@/components/BannerSection";
import { generateSlug } from "@/lib/products";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { readCartFromStorage, writeCartToStorage, addToCartStorage } from "@/lib/cart";
import { readFavoriteIds, toggleFavoriteId } from "@/lib/favorites";
import { Product, CartItem } from "@/types";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

export default function ShopPage() {
  const SlideUpTransition = React.forwardRef(function SlideUpTransition(
    props: SlideProps,
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });
  const router = useRouter();
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const [selectedCategory, setSelectedCategory] = useState("dogs");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from localStorage
  useEffect(() => {
    const stored = readCartFromStorage();
    if (stored.length) setCartItems(stored);
    setFavoriteIds(readFavoriteIds());
  }, []);

  useEffect(() => {
    writeCartToStorage(cartItems);
  }, [cartItems]);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (response.ok) {
          type DbProduct = {
            id: string;
            name: string;
            category: string;
            price: number | string;
            salePrice?: number | string | null;
            discountPercent?: number | string | null;
            description?: string | null;
            imageUrl?: string | null;
            stock?: number | string | null;
            gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
            age?: string | null;
            breed?: string | null;
            location?: string | null;
            images?: Array<{
              id: string;
              imageUrl: string;
              altText: string | null;
              isMain: boolean;
              order: number;
            }>;
          };
          const data: DbProduct[] = await response.json();
          // Transform database products to match component expectations
          const transformedProducts: Product[] = data.map((p) => {
            // Get main image from images array, fallback to imageUrl
            const mainImage = p.images?.find(img => img.isMain)?.imageUrl || 
                             p.images?.[0]?.imageUrl || 
                             p.imageUrl || 
                             '';
            
            return {
              id: p.id,
              name: p.name,
              category: p.category,
              price: Number(p.price),
              salePrice: p.salePrice != null ? Number(p.salePrice) : null,
              discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
              description: p.description ?? '',
              imageUrl: mainImage,
              image: mainImage,
              stock: Number(p.stock ?? 0),
              gender: p.gender ?? null,
              age: p.age ?? null,
              breed: p.breed ?? null,
              location: p.location ?? null,
              images: p.images?.map(img => ({
                ...img,
                productId: p.id,
                createdAt: new Date()
              })) || [],
            };
          });
          setProducts(transformedProducts);
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on category, search, and stock
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter out products with no stock (additional protection)
    filtered = filtered.filter((product) => {
      const stock = typeof product.stock === 'number' ? product.stock : 0;
      return stock > 0;
    });

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);



  const handleAddToCart = (product: Product) => {
    const stock = typeof product.stock === 'number' ? product.stock : 0;
    const existing = cartItems.find(i => i.product.id === product.id);

    if (stock <= 0) {
      showSnackbar("สินค้าหมด", "error");
      return;
    }

    if (existing && existing.quantity >= stock) {
      showSnackbar("สินค้าเกินจำนวนคงเหลือ", "warning");
      return;
    }

    setCartItems((prevItems) => {
      const item = prevItems.find(i => i.product.id === product.id);
      if (item) {
        return prevItems.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prevItems, { product, quantity: 1 }];
    });

    addToCartStorage(product, 1);

    showSnackbar(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, "success");
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id !== productId) return item;
        const stock = typeof item.product.stock === 'number' ? item.product.stock : 0;
        const maxQty = Math.max(0, stock);
        const nextQty = maxQty > 0 ? Math.min(quantity, maxQty) : item.quantity; // ถ้าไม่มี stock ไม่ให้เพิ่ม
        return { ...item, quantity: nextQty };
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
    showSnackbar("ลบสินค้าออกจากตะกร้า", "error");
  };

  const handleToggleFavorite = (productId: string) => {
    const wasFavorite = favoriteIds.includes(productId);
    setFavoriteIds(toggleFavoriteId(productId));
    const product = products.find(p => p.id === productId);
    showSnackbar(
      product
        ? `${wasFavorite ? 'นำออก' : 'เพิ่ม'} "${product.name}" ${wasFavorite ? 'จาก' : 'เข้า'} รายการที่ชอบ`
        : wasFavorite ? 'นำออกจากรายการที่ชอบ' : 'เพิ่มเข้ารายการที่ชอบ',
      wasFavorite ? 'error' : 'success'
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showSnackbar("ตะกร้าสินค้าว่างเปล่า", "warning");
      return;
    }
    
    setIsCartOpen(false);
    handleLiffNavigation(router, "/checkout");
  };

  const handleProductClick = (product: Product) => {
    // Navigate to product detail page using safe LIFF navigation
    const slug = generateSlug(product.name, product.id);
    handleLiffNavigation(router, `/product/${slug}`);
  };



  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Box
      sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navigation />
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onSearchChange={setSearchQuery}
        showLogo={true}
        logoSrc="/images/whatdadog_logo6.png"
      />

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          backgroundColor: colors.background.default,
          minHeight: '100vh',
          pt: 8, // Space for fixed header
          pb: 2, // Reduce bottom space after removing bottom navigation
          
        }}
      >
        {/* Category Filter with Container */}
        <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 2, md: 3 } }}>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </Container>

        {/* Banner Section with Container */}
        <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 2, md: 3 } }}>
          <BannerSection />
        </Container>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              ไม่พบสินค้า
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ลองเปลี่ยนหมวดหมู่หรือคำค้นหา
            </Typography>
          </Box>
        ) : (
          <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography
                variant="h6"
                sx={{
                  color: colors.text.primary,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                สินค้า
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.text.secondary }}
              >
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { 
                  xs: 'repeat(2, 1fr)', 
                  sm: 'repeat(3, 1fr)', 
                  md: 'repeat(4, 1fr)', 
                  lg: 'repeat(4, 1fr)' 
                },
                gap: { xs: 2, md: 3 },
                mb: 10,
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favoriteIds.includes(product.id)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onProductClick={() => handleProductClick(product)}
                />
              ))}
            </Box>
          </Container>
        )}
      </Box>

      <Cart
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        open={isCartOpen}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={handleCheckout}
      />

      {/* BottomNavigation moved to RootLayout for persistence across pages */}

      <SnackbarComponent />
    </Box>
  );
}
