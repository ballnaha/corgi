'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import ThemeProvider from '@/components/ThemeProvider';
import ProductDetail from '@/components/ProductDetail';
import { products } from '@/data/products';
import { colors } from '@/theme/colors';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // Find the product by ID
  const product = products.find(p => p.id === productId);

  const handleBack = () => {
    router.push('/');
  };

  const handleAdopt = () => {
    // You can add adoption logic here
    console.log('Adoption request for:', product?.name);
    router.push('/');
  };

  if (!product) {
    return (
      <ThemeProvider>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background.default,
            px: 2
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: colors.text.primary,
              textAlign: 'center'
            }}
          >
            Product not found
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ProductDetail
        product={product}
        onBack={handleBack}
        onAdopt={handleAdopt}
      />
    </ThemeProvider>
  );
}