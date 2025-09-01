"use client";

import React from "react";
import { Card, CardMedia, Typography, Box, IconButton, Chip } from "@mui/material";

import Image from "next/image";
import { colors } from "@/theme/colors";
import { Product } from "@/types";
import { LocationOn } from "@mui/icons-material";
import { getProductImageUrl } from "@/utils/imageUtils";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
  onProductClick?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  onProductClick,
}: ProductCardProps) {
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(product.id);
  };

  const handleProductClick = () => {
    onProductClick?.(product);
  };

  // Get background color based on product category (using pastel colors like in the design)
  const getCardBgColor = (category: string) => {
    const pastelColors = [
      colors.cardBg.orange,
      colors.cardBg.teal,
      colors.cardBg.yellow,
      colors.cardBg.blue,
      colors.cardBg.pink,
      colors.cardBg.lightOrange,
      colors.cardBg.lightTeal,
      colors.cardBg.lightYellow,
      colors.cardBg.lightBlue,
      colors.cardBg.lightPink,
    ];
    
    // Use product id or name to get consistent color for each product
    const colorIndex = Math.abs(product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % pastelColors.length;
    return pastelColors[colorIndex];
  };

  const isOutOfStock =
    typeof product.stock === "number" ? product.stock <= 0 : true;

  // Calculate discount percentage
  const getDiscountPercent = () => {
    if (product.discountPercent != null && product.discountPercent > 0) {
      return product.discountPercent;
    }
    if (product.salePrice != null && product.salePrice < product.price) {
      return Math.round(((product.price - product.salePrice) / product.price) * 100);
    }
    return 0;
  };

  const discountPercent = getDiscountPercent();

  return (
    <Card
      onClick={handleProductClick}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        border: "none",
        overflow: "visible",
        backgroundColor: colors.secondary.main,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        "&:hover": {
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        },
        "&:active": {
          transform: "translateY(-4px) scale(1.01)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          background: `linear-gradient(135deg, ${getCardBgColor(product.category)} 0%, ${getCardBgColor(product.category)}DD 100%)`,
          borderTopLeftRadius: { xs: 15, sm: 18, md: 20 },
          borderTopRightRadius: { xs: 15, sm: 18, md: 20 },
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          overflow: "visible",
          mb: 1,
          height: 120,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%)",
            borderRadius: 2,
            pointerEvents: "none",
          },
        }}
      >
                 <CardMedia
          component="img"
          image={getProductImageUrl(product)}
          alt={product.name}
          sx={{
            objectFit: "contain",
            backgroundColor: "transparent",
            width: "auto",
            height: { xs: 160},
            maxWidth: "90%",
            position: "relative",
            bottom: -20,
            filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
            zIndex: 2,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            // Ensure PNG transparency is preserved
            mixBlendMode: "normal",
            isolation: "isolate",
            "&:hover": {
              filter: "drop-shadow(0 12px 28px rgba(0, 0, 0, 0.2)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))",
              transform: "scale(1.05) translateY(-5px)",
            },
          }}
        />

        {/* Surprise/Shock Effect - OHO Icon for all products */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            right: -20,
            width: { xs: 35, sm: 45, md: 50 },
            height: { xs: 35, sm: 45, md: 50 },
            zIndex: 4,
            animation: "surpriseEffect 1.5s ease-in-out infinite",
            "@keyframes surpriseEffect": {
              "0%": {
                transform: "scale(1) rotate(0deg)",
                opacity: 1,
              },
              "25%": {
                transform: "scale(1.1) rotate(-8deg)",
                opacity: 0.9,
              },
              "50%": {
                transform: "scale(1.2) rotate(8deg)",
                opacity: 1,
              },
              "75%": {
                transform: "scale(1.1) rotate(-4deg)",
                opacity: 0.9,
              },
              "100%": {
                transform: "scale(1) rotate(0deg)",
                opacity: 1,
              },
            },
          }}
        >
          <Image
            src="/images/oho.png"
            alt="Surprise effect!"
            width={25}
            height={25}
            style={{
              objectFit: "contain",
              filter: "drop-shadow(0 6px 12px rgba(255, 165, 0, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
            }}
          />
        </Box>
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <Chip
            label={`-${discountPercent}%`}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: colors.error,
              color: "white",
              fontWeight: "bold",
              fontSize: "0.75rem",
              height: 24,
              "& .MuiChip-label": {
                px: 1,
              },
            }}
          />
        )}

        {isOutOfStock && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: colors.secondary.main, fontWeight: "500" }}
            >
              สินค้าหมด
            </Typography>
          </Box>
        )}

        {/* Favorite Button */}
        <IconButton
          onClick={handleToggleFavorite}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: colors.secondary.main,
            opacity: 0.7,
            color: isFavorite ? colors.primary.main : colors.text.secondary,
            width: 32,
            height: 32,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
            zIndex: 3,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(8px)",
            "&:hover": {
              backgroundColor: colors.secondary.main,
              transform: "scale(1.1) translateY(-1px)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15)",
            },
            "&:active": {
              transform: "scale(1.05)",
            },
          }}
          size="small"
        >
          <Image
            src="/images/icon-paw.png"
            alt="Favorite"
            width={16}
            height={16}
            style={{
              filter: isFavorite 
                ? "brightness(0) saturate(100%) invert(34%) sepia(92%) saturate(1384%) hue-rotate(337deg) brightness(98%) contrast(91%)" // red color for active
                : "brightness(0) saturate(100%) invert(60%)", // Gray color for inactive
              transition: "all 0.2s ease",
            }}
          />
        </IconButton>
      </Box>

      <Box 
        sx={{ 
          px: { xs: 1.5, sm: 2 }, 
          pb: { xs: 1.5, sm: 2 },
          pt: 1,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.05) 50%, transparent 100%)",
          },
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{
            color: colors.text.primary,
            fontWeight: "bold",
            mb: 0.5,
            fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <Box
            
          />
          <Typography
            variant="caption"
            sx={{
              color: colors.text.secondary,
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            <LocationOn sx={{ fontSize: "1rem", mr: 0.5 }} />
            {product.location}
          </Typography>
        </Box>

        {(() => {
          const hasSalePrice = product.salePrice != null;
          const hasDiscountPercent =
            !hasSalePrice &&
            product.discountPercent != null &&
            product.discountPercent > 0;
          const finalPrice = hasSalePrice
            ? (product.salePrice as number)
            : hasDiscountPercent
            ? Math.max(
                0,
                product.price -
                  product.price * ((product.discountPercent as number) / 100)
              )
            : product.price;

          return (
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              {(hasSalePrice || hasDiscountPercent) && (
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
                  color: colors.primary.main,
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                ฿
                {finalPrice.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          );
        })()}
      </Box>
    </Card>
  );
}
