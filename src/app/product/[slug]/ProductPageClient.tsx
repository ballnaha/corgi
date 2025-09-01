"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Slide,
} from "@mui/material";
import type { SlideProps } from "@mui/material";
import ProductDetail from "@/components/ProductDetail";
import ProductDetailDesktop from "@/components/ProductDetailDesktop";
import { colors } from "@/theme/colors";
import { Product } from "@/types";
import Cart from "@/components/Cart";
import {
  addToCartStorage,
  readCartFromStorage,
  writeCartToStorage,
  updateQuantityInStorage,
  removeFromCartStorage,
} from "@/lib/cart";
import { handleLiffNavigation } from "@/lib/liff-navigation";
import { useThemedSnackbar } from "@/components/ThemedSnackbar";

export default function ProductPageClient() {
  const SlideUpTransition = React.forwardRef(function SlideUpTransition(
    props: SlideProps,
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });
  const params = useParams();
  const router = useRouter();
  const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    setCartCount(readCartFromStorage().reduce((s, i) => s + i.quantity, 0));
    
    // Detect desktop
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/slug/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found");
          } else {
            setError("Failed to load product");
          }
          return;
        }

        const productData = await response.json();

        // Transform database product to match component expectations
        const transformedProduct: Product = {
          ...productData,
          image: productData.imageUrl || "", // Map imageUrl to image for backward compatibility
          price: Number(productData.price), // Convert Decimal to number
          salePrice:
            productData.salePrice != null
              ? Number(productData.salePrice)
              : null,
          discountPercent:
            productData.discountPercent != null
              ? Number(productData.discountPercent)
              : null,
          location: productData.location ?? null,
        };

        setProduct(transformedProduct);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    writeCartToStorage(readCartFromStorage());
  }, []);

  const handleBack = () => {
    handleLiffNavigation(router, "/home");
  };

  const handleAdopt = () => {
    if (!product) return;
    const stock = typeof product.stock === "number" ? product.stock : 0;
    if (stock <= 0) {
      showSnackbar("สินค้าหมด", "error");
      return;
    }
    const existingQty =
      readCartFromStorage().find((i) => i.product.id === product.id)
        ?.quantity ?? 0;
    if (existingQty >= stock) {
      showSnackbar("สินค้าเกินจำนวนคงเหลือ", "warning");
      return;
    }
    addToCartStorage(product, 1);
    const newCount = readCartFromStorage().reduce((s, i) => s + i.quantity, 0);
    setCartCount(newCount);
    showSnackbar(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, "success");
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background.default,
          px: 2,
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background.default,
          px: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: colors.text.primary,
            textAlign: "center",
          }}
        >
          {error || "Product not found"}
        </Typography>
      </Box>
    );
  }

  // Render appropriate component based on screen size
  const ProductComponent = isDesktop ? ProductDetailDesktop : ProductDetail;

  return (
    <>
      <ProductComponent
        product={product}
        onBack={handleBack}
        onAdopt={handleAdopt}
        onCartClick={() => setIsCartOpen(true)}
        cartItemCount={cartCount}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <Cart
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={readCartFromStorage()}
        onUpdateQuantity={(productId, quantity) => {
          updateQuantityInStorage(productId, quantity);
          setCartCount(
            readCartFromStorage().reduce((s, i) => s + i.quantity, 0)
          );
        }}
        onRemoveItem={(productId) => {
          removeFromCartStorage(productId);
          setCartCount(
            readCartFromStorage().reduce((s, i) => s + i.quantity, 0)
          );
        }}
        onCheckout={() => {
          if (readCartFromStorage().length === 0) {
            showSnackbar("ตะกร้าสินค้าว่างเปล่า", "warning");
            return;
          }

          setIsCartOpen(false);
          handleLiffNavigation(router, "/checkout");
        }}
      />

      <SnackbarComponent />
    </>
  );
}
