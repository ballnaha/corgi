"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { colors } from "@/theme/colors";
import ThemeProvider from "@/components/ThemeProvider";
import Header from "@/components/Header";


import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import BottomNavigation from "@/components/BottomNavigation";
import BannerSection from "@/components/BannerSection";
import { products } from "@/data/products";
import { Product, CartItem } from "@/types";

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("dogs");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("home");

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let filtered = products;

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
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);



  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setSnackbar({
            open: true,
            message: "Cannot add more items - insufficient stock",
            severity: "warning",
          });
          return prevItems;
        }

        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });

    setSnackbar({
      open: true,
      message: `Added "${product.name}" to cart`,
      severity: "success",
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
    setSnackbar({
      open: true,
      message: "Item removed from cart",
      severity: "info",
    });
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(productId);
      if (isFavorite) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleCheckout = () => {
    setSnackbar({
      open: true,
      message: "Payment system is not available yet",
      severity: "info",
    });
  };

  const handleProductClick = (product: Product) => {
    // Navigate to product detail page using Next.js router
    router.push(`/product/${product.id}`);
  };



  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ThemeProvider>
      <Box
        sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartOpen(true)}
          onSearchChange={setSearchQuery}
        />

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            backgroundColor: colors.background.default,
            minHeight: '100vh',
            pt: 13, // Space for fixed header
            pb: 10 // Space for bottom navigation
          }}
        >
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <BannerSection />

          {filteredProducts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                No pets found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try changing category or search term
              </Typography>
            </Box>
          ) : (
            <Box sx={{ px: 2 }}>
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
                  Trending Pets
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                    fontWeight: "500",
                    cursor: "pointer",
                    "&:hover": {
                      color: colors.primary.main,
                    },
                  }}
                >
                  See more
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "flex-start",
                }}
              >
                {filteredProducts.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      width: { xs: "calc(50% - 8px)", sm: "calc(33.333% - 12px)", md: "calc(25% - 12px)" },
                      minWidth: "160px",
                      maxWidth: "180px"
                    }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.includes(product.id)}
                      onProductClick={handleProductClick}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <BottomNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />



        <Cart
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
