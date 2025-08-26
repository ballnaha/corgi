"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
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

export default function ProductDetailPage() {
  const SlideUpTransition = React.forwardRef(function SlideUpTransition(
    props: SlideProps,
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [snackbarKey, setSnackbarKey] = useState<number>(0);
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
      setSnackbar({ open: true, message: "สินค้าหมด", severity: "error" });
      setSnackbarKey((k) => k + 1);
      return;
    }
    const existingQty =
      readCartFromStorage().find((i) => i.product.id === product.id)
        ?.quantity ?? 0;
    if (existingQty >= stock) {
      setSnackbar({
        open: true,
        message: "สินค้าเกินจำนวนคงเหลือ",
        severity: "warning",
      });
      setSnackbarKey((k) => k + 1);
      return;
    }
    addToCartStorage(product, 1);
    const newCount = readCartFromStorage().reduce((s, i) => s + i.quantity, 0);
    setCartCount(newCount);
    setSnackbar({
      open: true,
      message: `เพิ่ม "${product.name}" ลงตะกร้าแล้ว`,
      severity: "success",
    });
    setSnackbarKey((k) => k + 1);
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
            setSnackbar({
              open: true,
              message: "ตะกร้าสินค้าว่างเปล่า",
              severity: "warning",
            });
            setSnackbarKey((k) => k + 1);
            return;
          }

          setIsCartOpen(false);
          handleLiffNavigation(router, "/checkout");
        }}
      />

      <Snackbar
        key={snackbarKey}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={SlideUpTransition}
        sx={{ pointerEvents: "none" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="standard"
          icon={false}
          sx={{
            pointerEvents: "all",
            width: "auto",
            maxWidth: "min(480px, calc(100vw - 32px))",
            px: 2,
            py: 1.25,
            borderRadius: 3,
            boxShadow:
              snackbar.severity === "success"
                ? "0 20px 40px rgba(46,125,50,0.18)"
                : snackbar.severity === "warning"
                ? "0 20px 40px rgba(240,180,0,0.18)"
                : snackbar.severity === "error"
                ? "0 20px 40px rgba(211,47,47,0.18)"
                : "0 20px 40px rgba(25,118,210,0.18)",
            backdropFilter: "saturate(180%) blur(12px)",
            WebkitBackdropFilter: "saturate(180%) blur(12px)",
            backgroundColor:
              snackbar.severity === "success"
                ? "rgba(46, 125, 50, 0.12)"
                : snackbar.severity === "warning"
                ? "rgba(240, 180, 0, 0.12)"
                : snackbar.severity === "error"
                ? "rgba(211, 47, 47, 0.12)"
                : "rgba(25, 118, 210, 0.12)",
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
            backgroundBlendMode: "overlay",
            color:
              snackbar.severity === "success"
                ? "#1b5e20"
                : snackbar.severity === "warning"
                ? "#7a5c00"
                : snackbar.severity === "error"
                ? "#8e0000"
                : "#0d47a1",
            border:
              snackbar.severity === "success"
                ? "1px solid rgba(46, 125, 50, 0.28)"
                : snackbar.severity === "warning"
                ? "1px solid rgba(240, 180, 0, 0.28)"
                : snackbar.severity === "error"
                ? "1px solid rgba(211, 47, 47, 0.28)"
                : "1px solid rgba(25, 118, 210, 0.28)",
            borderLeft:
              snackbar.severity === "success"
                ? "4px solid rgba(46, 125, 50, 0.65)"
                : snackbar.severity === "warning"
                ? "4px solid rgba(240, 180, 0, 0.65)"
                : snackbar.severity === "error"
                ? "4px solid rgba(211, 47, 47, 0.65)"
                : "4px solid rgba(25, 118, 210, 0.65)",
            fontWeight: 600,
            letterSpacing: 0.2,
          }}
        >
          {snackbar.message}
          <Box
            sx={{
              mt: 0.75,
              height: 2,
              borderRadius: 2,
              backgroundColor:
                snackbar.severity === "success"
                  ? "rgba(46,125,50,0.2)"
                  : snackbar.severity === "warning"
                  ? "rgba(240,180,0,0.2)"
                  : snackbar.severity === "error"
                  ? "rgba(211,47,47,0.2)"
                  : "rgba(25,118,210,0.2)",
              overflow: "hidden",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "100%",
                backgroundColor:
                  snackbar.severity === "success"
                    ? "rgba(46,125,50,0.6)"
                    : snackbar.severity === "warning"
                    ? "rgba(240,180,0,0.6)"
                    : snackbar.severity === "error"
                    ? "rgba(211,47,47,0.6)"
                    : "rgba(25,118,210,0.6)",
                transformOrigin: "left",
                animation: "snackGrow 3s linear forwards",
              },
              "@keyframes snackGrow": {
                from: { transform: "scaleX(0)" },
                to: { transform: "scaleX(1)" },
              },
            }}
          />
        </Alert>
      </Snackbar>
    </>
  );
}
