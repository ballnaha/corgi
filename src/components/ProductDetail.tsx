"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  CardMedia,
  Badge,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn,
  FiberManualRecord,
  Pets,
  Palette,
  Category,
  MedicalServices,
  Verified,
  HealthAndSafety,
  Schedule,
  CheckCircle,
  PendingActions,
  CalendarToday,
} from "@mui/icons-material";
import Image from "next/image";
import { colors } from "@/theme/colors";
import { Product } from "@/types";
import VaccinationSchedule from "./VaccinationSchedule";

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
        return colors.cardBg.teal;
      default:
        return colors.cardBg.lightBlue;
      
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
          product.gender === "MALE" ? colors.cardBg.blue : colors.cardBg.lightPink,
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

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <Chip
                label={`-${discountPercent}%`}
                size="medium"
                sx={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  backgroundColor: colors.error,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  height: 32,
                  "& .MuiChip-label": {
                    px: 1.5,
                  },
                }}
              />
            )}

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
                  <Image
                    src="/images/icon-cart.png"
                    alt="Shopping Cart"
                    width={24}
                    height={24}
                    style={{
                      filter: "brightness(0) saturate(100%) invert(100%)",
                    }}
                  />
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
                <Image
                  src="/images/icon-home.png"
                  alt="Home"
                  width={24}
                  height={24}
                  style={{
                    filter: "brightness(0) saturate(100%) invert(100%)",
                  }}
                />
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
                    color: "black",
                    fontSize: "1rem",
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
                รายละเอียด
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

            {/* Additional Pet Info - Professional Design */}
            {(product.breed ||
              product.color ||
              product.vaccinated ||
              product.certified ||
              product.healthNote) && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: colors.text.primary,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <HealthAndSafety 
                    sx={{ 
                      color: colors.primary.main, 
                      fontSize: "1.3rem" 
                    }} 
                  />
                  ข้อมูลเพิ่มเติม
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  {/* Breed Info */}
                  {product.breed && (
                    <Box
                      sx={{
                        backgroundColor: colors.cardBg.orange,
                        borderRadius: 3,
                        p: 2.5,
                        border: "2px solid rgba(255, 138, 80, 0.5)",
                        boxShadow: "0 4px 12px rgba(255, 138, 80, 0.3)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 8px 25px rgba(255, 138, 80, 0.4)",
                          backgroundColor: "#FF8A50",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: "rgba(255, 138, 80, 0.15)",
                            borderRadius: "50%",
                            p: 0.8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Category 
                            sx={{ 
                              color: "#FFF", 
                              fontSize: "1.1rem" 
                            }} 
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#FFF",
                            fontSize: "1rem",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                          }}
                        >
                          สายพันธุ์
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#FFF",
                          fontWeight: "700",
                          fontSize: "1rem",
                        }}
                      >
                        {product.breed}
                      </Typography>
                    </Box>
                  )}

                  {/* Color Info */}
                  {product.color && (
                    <Box
                      sx={{
                        backgroundColor: colors.cardBg.lightTeal,
                        borderRadius: 3,
                        p: 2.5,
                        border: "2px solid rgba(15, 176, 158, 0.5)",
                        boxShadow: "0 4px 12px rgba(15, 176, 158, 0.3)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 8px 25px rgba(15, 176, 158, 0.4)",
                          backgroundColor: "#0FB09E",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: "rgba(15, 176, 158, 0.15)",
                            borderRadius: "50%",
                            p: 0.8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Palette 
                            sx={{ 
                              color: "#FFF", 
                              fontSize: "1.1rem" 
                            }} 
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#FFF",
                            fontSize: "1rem",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                          }}
                        >
                          สี
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#FFF",
                          fontWeight: "700",
                          fontSize: "1rem",
                        }}
                      >
                        {product.color}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Health & Certification Status */}
                {(product.vaccinated || product.certified) && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      mb: product.healthNote ? 2 : 0,
                    }}
                  >
                    {product.vaccinated && (
                      <Box
                        sx={{
                          backgroundColor: colors.cardBg.teal,
                          borderRadius: 3,
                          p: 2.5,
                          border: "2px solid rgba(15, 176, 158, 0.6)",
                          boxShadow: "0 4px 12px rgba(178, 223, 219, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(178, 223, 219, 0.4)",
                            backgroundColor: "#C5E9E6",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: "rgba(0, 150, 136, 0.15)",
                            borderRadius: "50%",
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MedicalServices 
                            sx={{ 
                              color: "#FFF", 
                              fontSize: "1.3rem" 
                            }} 
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#FFF",
                            fontWeight: "700",
                            fontSize: "1rem",
                          }}
                        >
                          ฉีดวัคซีนแล้ว
                        </Typography>
                      </Box>
                    )}

                    {product.certified && (
                      <Box
                        sx={{
                          backgroundColor: colors.cardBg.blue,
                          borderRadius: 3,
                          p: 2.5,
                          border: "2px solid rgba(179, 229, 252, 0.6)",
                          boxShadow: "0 4px 12px rgba(179, 229, 252, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(179, 229, 252, 0.4)",
                            backgroundColor: "#C6F0FD",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: "rgba(33, 150, 243, 0.15)",
                            borderRadius: "50%",
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Verified 
                            sx={{ 
                              color: "#FFF", 
                              fontSize: "1.3rem" 
                            }} 
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#FFF",
                            fontWeight: "700",
                            fontSize: "1rem",
                          }}
                        >
                          มีใบรับรองคุณภาพ
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Health Note */}
                {product.healthNote && (
                  <Box
                    sx={{
                      backgroundColor: colors.cardBg.yellow,
                      borderRadius: 3,
                      p: 3,
                      border: "2px solid rgba(255, 245, 157, 0.6)",
                      boxShadow: "0 4px 12px rgba(255, 245, 157, 0.3)",
                      mt: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(255, 245, 157, 0.4)",
                        backgroundColor: "#FFF8C4",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          backgroundColor: "rgba(255, 193, 7, 0.2)",
                          borderRadius: "50%",
                          p: 0.8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <HealthAndSafety 
                          sx={{ 
                            color: "#FF8F00", 
                            fontSize: "1.2rem" 
                          }} 
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#E65100",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                        }}
                      >
                        หมายเหตุสุขภาพ
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#BF360C",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {product.healthNote}
                    </Typography>
                  </Box>
                )}

                {/* Vaccination Information */}
                <VaccinationSchedule product={product} />
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

        {/* Add to Cart Button - Right Side with Paw Icon */}
        <Button
          variant="contained"
          onClick={onAdopt}
          disabled={typeof product.stock !== "number" || product.stock <= 0}
          sx={{
            backgroundColor:
              typeof product.stock === "number" && product.stock > 0
                ? colors.primary.light // Orange background
                : colors.text.disabled,
            color: colors.secondary.main, // White text
            py: 1.5,
            px: 0, // Remove horizontal padding to control spacing manually
            fontSize: "1.1rem",
            fontWeight: "600",
            borderRadius: "50px", // More rounded for modern look
            border: "2px solid #2C2C2C", // Black border
            minWidth: "60%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
            position: "relative",
            height: 56, // Fixed height for button
            "&:hover": {
              backgroundColor:
                typeof product.stock === "number" && product.stock > 0
                  ? colors.primary.dark
                  : colors.text.disabled,
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(255, 107, 53, 0.4)",
              borderColor: "#1A1A1A", // Darker border on hover
            },
            "&:active": {
              transform: "translateY(0px)",
            },
          }}
        >
          {/* Paw Circle - Left Side */}
          <Box
            sx={{
              backgroundColor: "#2C2C2C", // Black circle
              borderRadius: "50%",
              width: 52, // Same as button height
              height: 52, // Same as button height
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              left: 0,
              top: 0,
              
            }}
          >
            <Pets 
              sx={{ 
                color: colors.secondary.main, // White paw icon
                fontSize: "1.4rem" 
              }} 
            />
          </Box>
          
          {/* Button Text */}
          <Box sx={{ ml: 8, flex: 1, textAlign: "center", color: "white" }}>
            {typeof product.stock === "number" && product.stock > 0
              ? ["dogs", "cats", "birds", "fish"].includes(product.category)
                ? "รับน้อลไปดูแล"
                : "หยิบใส่ตระกร้า"
              : "สินค้าหมด"}
          </Box>
        </Button>
      </Box>
    </Box>
  );
}
