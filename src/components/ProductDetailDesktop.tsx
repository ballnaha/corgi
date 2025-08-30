"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Container,
  Paper,
  Badge,
} from "@mui/material";
import {
  ArrowBack,
  ShoppingCart,
  FavoriteOutlined,
  Favorite,
  LocationOn,
  Pets,
  Verified,
  HealthAndSafety,
  Schedule,
  Share,
} from "@mui/icons-material";
import Image from "next/image";
import { colors } from "@/theme/colors";
import { Product } from "@/types";
import VaccinationSchedule from "./VaccinationSchedule";

interface ProductDetailDesktopProps {
  product: Product;
  onBack: () => void;
  onAdopt: () => void;
  onCartClick?: () => void;
  cartItemCount?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ProductDetailDesktop({
  product,
  onBack,
  onAdopt,
  onCartClick,
  cartItemCount = 0,
  isFavorite = false,
  onToggleFavorite,
}: ProductDetailDesktopProps) {
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
  const finalPrice = product.salePrice || product.price;

  // Use product images if available, otherwise use main image
  const productImages = React.useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => img.imageUrl);
    }
    return [product.image || product.imageUrl || ""];
  }, [product.images, product.image, product.imageUrl]);



  // Get background color based on product category (Natural warm tones)
  const getCardBgColor = (category: string) => {
    switch (category) {
      case "dogs":
        return "#FFF5F0"; // Warm cream
      case "cats":
        return "#F0F8FF"; // Soft sky blue
      case "birds":
        return "#FFFEF7"; // Warm ivory
      case "fish":
        return "#F0FFFE"; // Cool mint
      default:
        return "#F8F6FF"; // Soft lavender
    }
  };

  const isOutOfStock = typeof product.stock === "number" ? product.stock <= 0 : true;

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      backgroundColor: "#FFF",
      
    }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          backgroundColor: "white", 
          borderBottom: "1px solid #E0E0E0",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: "1200px", mx: "auto" }}>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            py: 2 
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={onBack} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                รายละเอียดสินค้า
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
  
              <IconButton onClick={onCartClick}>
                <Badge badgeContent={cartItemCount} color="primary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ 
        maxWidth: "1200px", 
        mx: "auto", 
        py: 4,
        px: { xs: 2, md: 4 }
      }}>
        <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
          {/* Left: Images */}
          <Box sx={{ flex: 1, position: "sticky", top: 100, alignSelf: "flex-start" }}>
            {/* Main Image */}
            <Card sx={{ 
              mb: 2, 
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              overflow: "hidden"
            }}>
              <Box sx={{ 
                position: "relative", 
                height: 500,
                backgroundColor: getCardBgColor(product.category),
                borderRadius: 3,
                overflow: "hidden"
              }}>
                <Image
                  src={productImages[currentImageIndex]}
                  alt={product.name}
                  fill
                  style={{ objectFit: "contain", zIndex: 2 }}
                  priority
                />
                
                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <Chip
                    label={`-${discountPercent}%`}
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      backgroundColor: "#FF4444",
                      color: "white",
                      fontWeight: 600,
                      zIndex: 3
                    }}
                  />
                )}
                
                {/* Stock Status */}
                {isOutOfStock && (
                  <Box sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 4
                  }}>
                    <Typography variant="h5" sx={{ color: "white", fontWeight: 600 }}>
                      สินค้าหมด
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <Box sx={{ display: "flex", gap: 1, overflowX: "auto" }}>
                {productImages.map((image, index) => (
                  <Card
                    key={index}
                    sx={{
                      minWidth: 80,
                      height: 80,
                      cursor: "pointer",
                      border: currentImageIndex === index ? "2px solid #FF6B35" : "2px solid transparent",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)"
                      }
                    }}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <Box sx={{ 
                      position: "relative", 
                      width: "100%", 
                      height: "100%",
                      backgroundColor: getCardBgColor(product.category),
                      borderRadius: 2,
                      overflow: "hidden"
                    }}>
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        style={{ objectFit: "cover", borderRadius: 8, zIndex: 1 }}
                      />
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* Right: Product Info */}
          <Box sx={{ flex: 1 }}>
            {/* Product Title & Category */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: "#000" }}>
                {product.name}
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Chip 
                  label={product.category} 
                  sx={{ 
                    backgroundColor: "#F0F7FF", 
                    color: "#1976D2",
                    fontWeight: 600
                  }} 
                />
                {product.breed && (
                  <Chip 
                    label={product.breed} 
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              {product.location && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <LocationOn sx={{ color: "#666", fontSize: 20 }} />
                  <Typography sx={{ color: "#666" }}>
                    {product.location}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Price */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#FF6B35" }}>
                  ฿{finalPrice.toLocaleString()}
                </Typography>
                {product.salePrice && product.salePrice < product.price && (
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      textDecoration: "line-through", 
                      color: "#999",
                      fontWeight: 500
                    }}
                  >
                    ฿{product.price.toLocaleString()}
                  </Typography>
                )}
              </Box>
              <Typography sx={{ color: "#666", fontSize: 14 }}>
                รวมภาษีแล้ว ไม่รวมค่าขนส่ง
              </Typography>
            </Box>

            {/* Product Details */}
            <Card sx={{ 
              mb: 4, 
              p: 3, 
              borderRadius: 3,
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.8)"
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                รายละเอียดสินค้า
              </Typography>
              
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {product.gender && (
                  <Box sx={{ minWidth: "45%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Pets sx={{ color: "#FF6B35", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          เพศ
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.gender === 'MALE' ? 'ผู้' : product.gender === 'FEMALE' ? 'เมีย' : 'ไม่ระบุ'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                
                {product.age && (
                  <Box sx={{ minWidth: "45%" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Schedule sx={{ color: "#4CAF50", fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          อายุ
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.age}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ minWidth: "45%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Verified sx={{ color: "#2196F3", fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        สถานะ
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        มีใบทะเบียนประวัติสุนัข(Registration Certificate)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ minWidth: "45%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <HealthAndSafety sx={{ color: "#4CAF50", fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        วัคซีน
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ครบถ้วน
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Description */}
            {product.description && (
              <Card sx={{ 
                mb: 4, 
                p: 3, 
                borderRadius: 3,
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.8)"
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  รายละเอียด
                </Typography>
                <Typography sx={{ lineHeight: 1.8, color: "#333" }}>
                  {product.description}
                </Typography>
              </Card>
            )}

            {/* Add to Cart */}
            <Card sx={{ 
              p: 3, 
              borderRadius: 3,
              backgroundColor: "white",
              boxShadow: "0 6px 24px rgba(255, 107, 53, 0.15)",
              border: "2px solid rgba(255, 107, 53, 0.1)"
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Typography sx={{ color: "#666", fontSize: 14 }}>
                  เหลือ {product.stock || 0} ตัว
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={onAdopt}
                disabled={isOutOfStock}
                startIcon={<ShoppingCart />}
                sx={{
                  width: "100%",
                  py: 1.5,
                  backgroundColor: "#FF6B35",
                  fontSize: 18,
                  fontWeight: 600,
                  borderRadius: 3,
                  "&:hover": {
                    backgroundColor: "#E55A2B"
                  },
                  "&:disabled": {
                    backgroundColor: "#CCCCCC"
                  }
                }}
              >
                {isOutOfStock ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
              </Button>
            </Card>
          </Box>
        </Box>

        {/* Vaccination Schedule */}
        {(product.category === "dogs" || product.category === "cats") && (
          <Box sx={{ mt: 6 }}>
            <VaccinationSchedule product={product} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
