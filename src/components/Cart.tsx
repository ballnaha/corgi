'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Avatar,
  Button,
  Divider,
  Badge,
  ButtonGroup
} from '@mui/material';
import {
  Close,
  Add,
  Remove,
  ShoppingCart,
  Delete
} from '@mui/icons-material';
import { colors } from '@/theme/colors';
import { CartItem } from '@/types';

interface CartProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function Cart({
  open,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartProps) {
  const getMainImage = (product: CartItem['product']) => {
    // ลองหารูปหลักจาก images array ก่อน
    if (product.images && product.images.length > 0) {
      const mainImage = product.images.find(img => img.isMain);
      if (mainImage?.imageUrl) return mainImage.imageUrl;
      
      // ถ้าไม่มีรูปหลัก ใช้รูปแรก
      if (product.images[0]?.imageUrl) return product.images[0].imageUrl;
    }
    
    // fallback ไปยัง imageUrl หรือ image
    return product.imageUrl || product.image || "/images/icon-corgi.png";
  };

  // Get background color based on product ID (same as ProductCard)
  const getCardBgColor = (productId: string) => {
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
    
    // Use product id to get consistent color for each product
    const colorIndex = Math.abs(productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % pastelColors.length;
    return pastelColors[colorIndex];
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "dogs":
        return "🐕";
      case "cats":
        return "🐱";
      case "birds":
        return "🐦";
      case "fish":
        return "🐠";
      default:
        return "🐾";
    }
  };

  const calculateUnitPrice = (p: CartItem['product']) => {
    const hasSalePrice = p.salePrice != null;
    const hasDiscountPercent = !hasSalePrice && p.discountPercent != null && p.discountPercent > 0;
    if (hasSalePrice) return p.salePrice as number;
    if (hasDiscountPercent) return Math.max(0, p.price - (p.price * ((p.discountPercent as number) / 100)));
    return p.price;
  };

  const getMaxQuantity = (p: CartItem['product']) => {
    const stock = typeof p.stock === 'number' ? p.stock : 0;
    // ถ้าไม่มี stock หรือ = 0 ให้ถือว่าเพิ่มไม่ได้
    return Math.max(0, stock);
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + (calculateUnitPrice(item.product) * item.quantity),
    0
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 420 },
            backgroundColor: colors.background.default,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderLeft: `1px solid ${colors.primary.light}55`,
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 10px 30px rgba(0,0,0,0.08)'
          }
        }
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart sx={{ color: colors.primary.main }} />
            <Typography variant="h6" sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
              ตะกร้าสินค้า
            </Typography>
            <Badge
              badgeContent={totalItems}
              sx={{ '& .MuiBadge-badge': { backgroundColor: colors.primary.main, color: colors.secondary.main } }}
            >
              <Box />
            </Badge>
          </Box>
          <IconButton onClick={onClose} sx={{ color: colors.text.secondary, '&:hover': { color: colors.error } }}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: colors.primary.light, opacity: 0.35 }} />

        {/* Cart Items */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShoppingCart sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }} />
              <Typography variant="body1" sx={{ color: colors.text.secondary }}>
                ตะกร้าสินค้าว่างเปล่า
              </Typography>
            </Box>
          ) : (
            <List>
              {items.map((item) => (
                <ListItem
                  key={item.product.id}
                  sx={{
                    backgroundColor: colors.background.paper,
                    borderRadius: 3,
                    mb: 1.25,
                    border: `1px solid ${colors.primary.light}55`,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    p: 2
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      mr: 2,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${getCardBgColor(item.product.id)} 0%, ${getCardBgColor(item.product.id)}DD 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  >
                    {getMainImage(item.product) && getMainImage(item.product) !== "/images/icon-corgi.png" ? (
                      <Box
                        component="img"
                        src={getMainImage(item.product)}
                        alt={item.product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/icon-corgi.png";
                        }}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 2,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          fontSize: "1.5rem",
                          textAlign: "center",
                        }}
                      >
                        {getCategoryIcon(item.product.category)}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: colors.text.primary, mb: 0.25 }}>
                      {item.product.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mb: 0.75 }}>
                      คงเหลือ: {typeof item.product.stock === 'number' ? item.product.stock : 0}
                    </Typography>
                    {(() => {
                      const unitPrice = calculateUnitPrice(item.product);
                      const isDiscounted = unitPrice !== item.product.price;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
                          {isDiscounted && (
                            <Typography variant="body2" sx={{ color: colors.text.secondary, textDecoration: 'line-through' }}>
                              ฿{item.product.price.toLocaleString()}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ color: colors.primary.main, fontWeight: 'bold' }}>
                            ฿{unitPrice.toLocaleString()}
                          </Typography>
                        </Box>
                      );
                    })()}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: colors.background.default,
                        border: `1px solid ${colors.primary.light}66`,
                        borderRadius: 20,
                        px: 1,
                        py: 0.25
                      }}>
                        <IconButton
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          size="small"
                          sx={{
                            color: colors.primary.main,
                            '&:disabled': { color: colors.text.disabled }
                          }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center', color: colors.text.primary }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= getMaxQuantity(item.product)}
                          size="small"
                          sx={{
                            color: colors.primary.main,
                            '&:disabled': { color: colors.text.disabled }
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                      <IconButton
                        onClick={() => onRemoveItem(item.product.id)}
                        sx={{ color: colors.error }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {items.length > 0 && (
          <>
            <Divider sx={{ borderColor: colors.primary.light, opacity: 0.6 }} />
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary }}>
                  รวมทั้งหมด:
                </Typography>
                <Typography variant="h6" sx={{ color: colors.primary.main, fontWeight: 'bold' }}>
                  ฿{totalPrice.toLocaleString()}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={onCheckout}
                sx={{
                  backgroundColor: colors.primary.main,
                  color: colors.secondary.main,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                  }
                }}
              >
                ชำระเงิน
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}