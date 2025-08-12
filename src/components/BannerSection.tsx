'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/theme/colors';

export default function BannerSection() {
  return (
    <Box sx={{ px: 2, mb: 3 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8A65 100%)',
          borderRadius: 4,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left content */}
        <Box sx={{ flex: 1, zIndex: 2 }}>
          <Typography
            variant="h5"
            sx={{
              color: colors.secondary.main,
              fontWeight: 'bold',
              fontSize: '1.5rem',
              mb: 0.5
            }}
          >
            🐦 Birds
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.secondary.main,
              opacity: 0.9,
              fontSize: '0.9rem'
            }}
          >
            Find your perfect feathered friend
          </Typography>
        </Box>

        {/* Right decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            🐦
          </Box>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              mt: 1
            }}
          >
            🥜
          </Box>
        </Box>

        {/* Background decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            right: -20,
            top: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            right: 60,
            bottom: -10,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            zIndex: 1
          }}
        />
      </Box>
    </Box>
  );
}