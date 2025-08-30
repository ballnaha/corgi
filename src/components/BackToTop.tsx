"use client";

import React, { useState, useEffect } from 'react';
import { Box, Fab, Typography, Zoom } from '@mui/material';

interface BackToTopProps {
  threshold?: number;
}

export default function BackToTop({ threshold = 300 }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Zoom in={isVisible}>
      <Box
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, md: 40 },
          left: { xs: 20, md: 'auto' },
          right: { xs: 'auto', md: 20 },
          zIndex: 1000,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <Fab
          size="medium"
          sx={{
            backgroundColor: 'white',
            border: '2px solid #000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: 56,
            height: 56,
            '&:hover': {
              backgroundColor: '#f5f5f5',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <Box
            component="img"
            src="/images/icon-paw.png"
            alt="Back to top"
            sx={{
              width: 24,
              height: 24,
              objectFit: 'contain',
              filter: 'contrast(1.2)'
            }}
          />
        </Fab>
      </Box>
    </Zoom>
  );
}
