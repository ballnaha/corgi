"use client";

import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, IconButton, Button, CardMedia } from "@mui/material";
import {
  ArrowBack,
  NotificationsNone,
  LocationOn,
  Phone,
  Chat,
  FiberManualRecord,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { Product } from "@/types";

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAdopt: () => void;
}

export default function ProductDetail({
  product,
  onBack,
  onAdopt,
}: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use product images if available, otherwise use main image
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

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

  const petDetails = [
    {
      label: "Gender",
      value: "Female",
      bgColor: colors.cardBg.pink,
    },
    {
      label: "Age",
      value: "2 Years",
      bgColor: colors.cardBg.orange,
    },
    {
      label: "Weight",
      value: "6 LBS",
      bgColor: colors.cardBg.yellow,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: colors.background.default,
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: colors.secondary.main,
          px: 2,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "0 0 24px 24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            backgroundColor: colors.background.default,
            color: colors.text.primary,
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: colors.background.accent,
            },
          }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            color: colors.text.primary,
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          Pet's Details
        </Typography>

        <IconButton
          sx={{
            backgroundColor: colors.background.default,
            color: colors.text.secondary,
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: colors.background.accent,
            },
          }}
        >
          <NotificationsNone fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ pt: 8, pb: 12 }}>
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

            {/* Image Counter (only show if multiple images) */}
            {productImages.length > 1 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: colors.secondary.main,
                  px: 2,
                  py: 0.5,
                  borderRadius: 3,
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                }}
              >
                {currentImageIndex + 1} / {productImages.length}
              </Box>
            )}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <LocationOn sx={{ color: colors.text.secondary, fontSize: 18 }} />
            <Typography
              variant="body2"
              sx={{
                color: colors.text.secondary,
                fontSize: "0.9rem",
              }}
            >
              New York City, USA
            </Typography>
          </Box>

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
              Dogs are more than just pets—they're family. Known for their
              loyalty, love, and playful spirit, they bring joy to every home.
              Whether it's a small lap dog...{" "}
              <Typography
                component="span"
                sx={{
                  color: colors.text.primary,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                See All
              </Typography>
            </Typography>
          </Box>

          {/* Price */}
          <Typography
            variant="h5"
            sx={{
              color: colors.primary.main,
              fontWeight: "bold",
              fontSize: "1.5rem",
              mb: 3,
            }}
          >
            ฿{product.price.toLocaleString()}
          </Typography>
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
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onAdopt}
          sx={{
            backgroundColor: colors.primary.main,
            color: colors.secondary.main,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: "bold",
            borderRadius: 3,
            flex: 1,
            "&:hover": {
              backgroundColor: colors.primary.dark,
            },
          }}
        >
          Adopt Now
        </Button>

        <IconButton
          sx={{
            backgroundColor: colors.background.default,
            color: colors.primary.main,
            width: 48,
            height: 48,
            border: `2px solid ${colors.primary.main}`,
            "&:hover": {
              backgroundColor: colors.primary.light,
              color: colors.secondary.main,
            },
          }}
        >
          <Phone fontSize="small" />
        </IconButton>

        <IconButton
          sx={{
            backgroundColor: colors.background.default,
            color: colors.primary.main,
            width: 48,
            height: 48,
            border: `2px solid ${colors.primary.main}`,
            "&:hover": {
              backgroundColor: colors.primary.light,
              color: colors.secondary.main,
            },
          }}
        >
          <Chat fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
