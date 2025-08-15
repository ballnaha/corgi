"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  CardMedia,
  Badge,
} from "@mui/material";
import {
  ArrowBack,
  Home,
  LocationOn,
  FiberManualRecord,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { ShoppingCart } from "@mui/icons-material";
import { Product } from "@/types";

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAdopt: () => void;
  onCartClick?: () => void;
  cartItemCount?: number;
}

export default function ProductDetail({
  product,
  onBack,
  onAdopt,
  onCartClick,
  cartItemCount = 0,
}: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use product images if available, otherwise use main image
  const productImages = React.useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => img.imageUrl);
    }
    return [product.image || product.imageUrl || ""];
  }, [product.images, product.image, product.imageUrl]);

  // Get background color based on product category
  const getCardBgColor = (category: string) => {
    switch (category) {
      case "dogs":
        return colors.cardBg.orange;
      case "cats":
        return colors.cardBg.blue;
      case "birds":
        return colors.cardBg.yellow;
      case "fish":
        return colors.cardBg.pink;
      default:
        return colors.cardBg.green;
    }
  };

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Swipe functionality
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const swiperRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentImageIndex < productImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Auto-scroll swiper container
  useEffect(() => {
    if (swiperRef.current) {
      const containerWidth = swiperRef.current.offsetWidth;
      swiperRef.current.scrollTo({
        left: currentImageIndex * containerWidth,
        behavior: "smooth",
      });
    }
  }, [currentImageIndex]);

  const petDetails = React.useMemo(() => {
    return [
      {
        label: "เพศ",
        value: product.gender
          ? product.gender === "MALE"
            ? "ผู้ชาย"
            : product.gender === "FEMALE"
            ? "ผู้หญิง"
            : "ไม่ระบุ"
          : "ไม่ระบุ",
        bgColor:
          product.gender === "MALE" ? colors.cardBg.blue : colors.cardBg.pink,
      },
      {
        label: "อายุ",
        value: product.age || "ไม่ระบุ",
        bgColor: colors.cardBg.orange,
      },
      {
        label: "น้ำหนัก",
        value: product.weight || "ไม่ระบุ",
        bgColor: colors.cardBg.yellow,
      },
    ];
  }, [product]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.background.default,
        position: "relative",
      }}
    >
      {/* Header - Transparent with Liquid Glass Back Button */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 1100,
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            color: colors.secondary.main,
            width: 48,
            height: 48,
            borderRadius: "50%",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <ArrowBack fontSize="medium" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ pb: 12 }}>
        {/* Pet Image Swiper - Full Width */}
        <Box sx={{ mb: 3 }}>
          {/* Swiper Container */}
          <Box
            ref={swiperRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            sx={{
              position: "relative",
              width: "100vw",
              ml: "-50vw",
              left: "50%",
              height: 400,
              backgroundColor: getCardBgColor(product.category),
              overflow: "hidden",
              cursor: productImages.length > 1 ? "grab" : "default",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              KhtmlUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              "&:active": {
                cursor: productImages.length > 1 ? "grabbing" : "default",
              },
              "&:focus": {
                outline: "none",
              },
            }}
          >
            {/* Current Image Only */}
            <CardMedia
              component="img"
              image={productImages[currentImageIndex]}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                backgroundColor: "transparent",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: "none",
              }}
            />

            {/* Home and Cart Icon Buttons */}
            <Box
              sx={{
                position: "fixed",
                top: 20,
                right: 20,
                display: "flex",
                gap: 1,
              }}
            >
              <IconButton
                onClick={onCartClick}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  color: colors.secondary.main,
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    transform: "scale(1.05)",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
              >
                <Badge
                  badgeContent={cartItemCount}
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: colors.primary.main,
                      color: colors.secondary.main,
                      fontSize: "0.7rem",
                      minWidth: 16,
                      height: 16,
                    },
                  }}
                >
                  <ShoppingCart fontSize="medium" />
                </Badge>
              </IconButton>
              <IconButton
                onClick={() => (window.location.href = "/")}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  color: colors.secondary.main,
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    transform: "scale(1.05)",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
              >
                <Home fontSize="medium" />
              </IconButton>
            </Box>
          </Box>

          {/* Image Indicators (only show if multiple images) */}
          {productImages.length > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                mt: 2,
                px: 2,
              }}
            >
              {productImages.map((_, index) => (
                <IconButton
                  key={index}
                  onClick={() => handleImageChange(index)}
                  sx={{
                    p: 0,
                    minWidth: "auto",
                    width: 12,
                    height: 12,
                  }}
                >
                  <FiberManualRecord
                    sx={{
                      fontSize: 12,
                      color:
                        currentImageIndex === index
                          ? colors.primary.main
                          : colors.text.disabled,
                      transition: "color 0.2s ease",
                    }}
                  />
                </IconButton>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ px: 2 }}>
          {/* Pet Name */}
          <Typography
            variant="h4"
            sx={{
              color: colors.text.primary,
              fontWeight: "bold",
              mb: 1,
              fontSize: "2rem",
            }}
          >
            {product.name}
          </Typography>

          {/* Location */}
          {product.location && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <LocationOn sx={{ color: colors.text.secondary, fontSize: 18 }} />
              <Typography
                variant="body2"
                sx={{
                  color: colors.text.secondary,
                  fontSize: "0.9rem",
                }}
              >
                {product.location}
              </Typography>
            </Box>
          )}

          {/* Pet Details Cards */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
            {petDetails.map((detail, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  backgroundColor: detail.bgColor,
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.text.secondary,
                    fontSize: "0.8rem",
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  {detail.label}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: colors.text.primary,
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  {detail.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Description */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: colors.text.primary,
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.text.secondary,
                  cursor: "pointer",
                  "&:hover": {
                    color: colors.primary.main,
                  },
                }}
              >
                See more
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: colors.text.secondary,
                lineHeight: 1.6,
                fontSize: "0.95rem",
              }}
            >
              {product.description || "ไม่มีรายละเอียด"}
            </Typography>

            {/* Additional Pet Info */}
            {(product.breed ||
              product.color ||
              product.vaccinated ||
              product.certified) && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: colors.background.paper,
                  borderRadius: 2,
                }}
              >
                {product.breed && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>สายพันธุ์:</strong> {product.breed}
                  </Typography>
                )}
                {product.color && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>สี:</strong> {product.color}
                  </Typography>
                )}
                {product.vaccinated && (
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: colors.success }}
                  >
                    ✅ ฉีดวัคซีนแล้ว
                  </Typography>
                )}
                {product.certified && (
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: colors.success }}
                  >
                    ✅ มีใบรับรอง
                  </Typography>
                )}
                {product.healthNote && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontStyle: "italic" }}
                  >
                    <strong>หมายเหตุสุขภาพ:</strong> {product.healthNote}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Stock */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              คงเหลือในสต็อก:
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: colors.text.primary, fontWeight: "bold" }}
            >
              {typeof product.stock === "number" ? product.stock : 0}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Bottom Actions */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.secondary.main,
          p: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Price Section - Left Side */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
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
              <>
                {(hasSalePrice || hasDiscountPercent) && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                      textDecoration: "line-through",
                      fontSize: "0.9rem",
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
                    fontSize: "1.3rem",
                  }}
                >
                  ฿
                  {finalPrice.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </>
            );
          })()}
        </Box>

        {/* Add to Cart Button - Right Side */}
        <Button
          variant="contained"
          onClick={onAdopt}
          disabled={typeof product.stock !== "number" || product.stock <= 0}
          sx={{
            backgroundColor:
              typeof product.stock === "number" && product.stock > 0
                ? colors.primary.main
                : colors.text.disabled,
            color: colors.secondary.main,
            py: 1.5,
            px: 3,
            fontSize: "1.1rem",
            fontWeight: "500",
            borderRadius: 3,
            minWidth: "50%",
            "&:hover": {
              backgroundColor:
                typeof product.stock === "number" && product.stock > 0
                  ? colors.primary.dark
                  : colors.text.disabled,
            },
          }}
        >
          {typeof product.stock === "number" && product.stock > 0
            ? ["dogs", "cats", "birds", "fish"].includes(product.category)
              ? "รับน้อลไปดูแล"
              : "หยิบใส่ตระกร้า"
            : "สินค้าหมด"}
        </Button>
      </Box>
    </Box>
  );
}
