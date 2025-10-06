'use client';

import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { colors } from '@/theme/colors';
import { ArrowForward, Star, LocalOffer } from '@mui/icons-material';
import ProductCard from './ProductCard';
import { Product } from '@/types';

interface FeaturedProductsSectionProps {
  products: Product[];
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onViewAllClick?: () => void;
}

export default function FeaturedProductsSection({
  products,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onProductClick,
  onViewAllClick
}: FeaturedProductsSectionProps) {
  // Show only first 8 products for featured section
  const featuredProducts = products.slice(0, 8);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Star sx={{ color: '#FFB347', fontSize: '1.5rem' }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: '800',
                  color: '#000',
                  fontSize: { xs: '1.8rem', md: '2.2rem' },
                  letterSpacing: '0.5px',
                }}
              >
                สินค้าแนะนำ
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                fontSize: '1.1rem',
                fontWeight: '600',
              }}
            >
              สินค้าคุณภาพดีที่ลูกค้าแนะนำ
            </Typography>
          </Box>

          {onViewAllClick && (
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={onViewAllClick}
              sx={{
                borderColor: '#000',
                color: '#000',
                fontWeight: '800',
                px: 3,
                py: 1,
                borderRadius: '20px',
                textTransform: 'none',
                border: '3px solid #000',
                display: { xs: 'none', md: 'flex' },
                letterSpacing: '0.5px',
                '&:hover': {
                  backgroundColor: '#FFB347',
                  borderColor: '#000',
                  color: '#000',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                }
              }}
            >
              ดูสินค้าทั้งหมด
            </Button>
          )}
        </Box>

        {/* Featured Products Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(4, 1fr)'
            },
            gap: { xs: 2, md: 3 },
            mb: 4,
          }}
        >
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.includes(product.id)}
              onToggleFavorite={() => onToggleFavorite(product.id)}
              onAddToCart={() => onAddToCart(product)}
              onProductClick={() => onProductClick(product)}
            />
          ))}
        </Box>

        {/* Call to Action - Mobile */}
        {onViewAllClick && (
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              justifyContent: 'center',
              mt: 3,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              endIcon={<ArrowForward />}
              onClick={onViewAllClick}
              sx={{
                backgroundColor: colors.primary.main,
                color: 'white',
                fontWeight: 600,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                maxWidth: 300,
                '&:hover': {
                  backgroundColor: colors.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }
              }}
            >
              ดูสินค้าทั้งหมด
            </Button>
          </Box>
        )}

        {/* Promotional Banner */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: { xs: 3, md: 4 },
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A50 100%)',
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '3px solid #000',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {/* Background decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              zIndex: 1,
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <LocalOffer
              sx={{
                fontSize: { xs: '2.5rem', md: '3rem' },
                color: 'white',
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: '800',
                mb: 1,
                fontSize: { xs: '1.3rem', md: '1.6rem' },
                letterSpacing: '0.5px',
              }}
            >
              โปรโมชั่นพิเศษสำหรับสมาชิก
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 3,
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                fontWeight: '600',
              }}
            >
              รับส่วนลดสูงสุด 20% สำหรับการสั่งซื้อครั้งแรก
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: colors.accent.main,
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }
              }}
              onClick={() => {
                // Handle promotion click
                onViewAllClick?.();
              }}
            >
              เริ่มช้อปปิ้งเลย
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}