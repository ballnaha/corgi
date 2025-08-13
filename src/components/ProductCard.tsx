'use client';

import React from 'react';
import {
  Card,
  CardMedia,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { colors } from '@/theme/colors';
import { Product } from '@/types';

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
  onProductClick
}: ProductCardProps) {


  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(product.id);
  };

  const handleProductClick = () => {
    onProductClick?.(product);
  };

  // Get background color based on product category
  const getCardBgColor = (category: string) => {
    switch (category) {
      case 'dogs': return colors.cardBg.orange;
      case 'cats': return colors.cardBg.blue;
      case 'birds': return colors.cardBg.yellow;
      case 'fish': return colors.cardBg.pink;
      default: return colors.cardBg.green;
    }
  };

  const isOutOfStock = typeof product.stock === 'number' ? product.stock <= 0 : true;

  return (
    <Card
      onClick={handleProductClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 'none',
        border: 'none',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          backgroundColor: getCardBgColor(product.category),
          borderRadius: 2,
          overflow: 'hidden',
          mb: 1
        }}
      >
        <CardMedia
          component="img"
          height="150"
          image={product.image || product.imageUrl || ''}
          alt={product.name}
          sx={{
            objectFit: 'cover',
            backgroundColor: 'transparent',
            width: '100%',
            display: 'block',
          }}
        />
        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: colors.secondary.main, fontWeight: 'bold' }}
            >
              สินค้าหมด
            </Typography>
          </Box>
        )}
        
        {/* Favorite Button */}
        <IconButton
          onClick={handleToggleFavorite}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: colors.secondary.main,
            color: isFavorite ? colors.error : colors.text.secondary,
            width: 32,
            height: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: colors.secondary.main,
              transform: 'scale(1.05)',
            }
          }}
          size="small"
        >
          {isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
        </IconButton>
      </Box>

      <Box sx={{ px: 1 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            color: colors.text.primary,
            fontWeight: 'bold',
            mb: 0.5,
            fontSize: '0.95rem',
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: colors.text.disabled,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: colors.text.secondary,
              fontSize: '0.75rem'
            }}
          >
            {product.location}
          </Typography>
        </Box>

        {(() => {
          const hasSalePrice = product.salePrice != null;
          const hasDiscountPercent = !hasSalePrice && product.discountPercent != null && product.discountPercent > 0;
          const finalPrice = hasSalePrice
            ? (product.salePrice as number)
            : (hasDiscountPercent
              ? Math.max(0, product.price - (product.price * ((product.discountPercent as number) / 100)))
              : product.price);

          return (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              {(hasSalePrice || hasDiscountPercent) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                    textDecoration: 'line-through',
                    fontSize: '0.85rem'
                  }}
                >
                  ฿{product.price.toLocaleString()}
                </Typography>
              )}
              <Typography
                variant="h6"
                sx={{
                  color: colors.primary.main,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                ฿{finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          );
        })()}
      </Box>
    </Card>
  );
}