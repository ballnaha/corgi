'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { colors } from '@/theme/colors';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string;
  background: string;
  linkUrl: string | null;
  sortOrder: number;
}

export default function BannerSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback banners if API fails
  const fallbackBanners: Banner[] = [
    {
      id: "1",
      title: "อุ๋ง อุ๋ง",
      subtitle: "Pet Shop",
      background: 'linear-gradient(135deg, #FFE0B2 0%, #FFF3E0 50%, #FFCC80 100%)',
      imageUrl: "/images/oong_logo10.png",
      imageAlt: "Pet Shop Promotion",
      linkUrl: null,
      sortOrder: 0
    },

  ];

  // Load banners from API
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch('/api/banners');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setBanners(data);
          } else {
            setBanners(fallbackBanners);
          }
        } else {
          setBanners(fallbackBanners);
        }
      } catch (error) {
        console.error('Error loading banners:', error);
        setBanners(fallbackBanners);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (isAutoPlayPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isAutoPlayPaused]);

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlayPaused(true); // Pause autoplay when user starts touching
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      // Resume autoplay after a delay if no swipe occurred
      setTimeout(() => setIsAutoPlayPaused(false), 3000);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - next slide
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe) {
      // Swipe right - previous slide
      setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    }
    
    // Reset touch states and resume autoplay after a delay
    setTouchStart(null);
    setTouchEnd(null);
    setTimeout(() => setIsAutoPlayPaused(false), 3000);
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank');
    }
  };

  const renderBanner = (banner: Banner, index: number) => (
    <Box
      key={banner.id}
      onClick={() => handleBannerClick(banner)}
      sx={{
        background: banner.background,
        borderRadius: 4,
        p: 3,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'visible',
        minHeight: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: currentSlide === index ? 1 : 0,
        transform: currentSlide === index ? 'translateX(0)' : 
                   index > currentSlide ? 'translateX(100%)' : 'translateX(-100%)',
        transition: 'all 0.5s ease-in-out',
        cursor: banner.linkUrl ? 'pointer' : 'default',
        '&:hover': {
          transform: currentSlide === index ? 'scale(1.02)' : 
                     index > currentSlide ? 'translateX(100%) scale(1.02)' : 'translateX(-100%) scale(1.02)',
        }
      }}
    >
      {/* Left content */}
      <Box sx={{ flex: 1, zIndex: 2, maxWidth: '60%' }}>
        <Typography
          variant="h4"
          sx={{
            color: "black",
            fontWeight: '600',
            fontSize: '1.4rem',
            mb: 0.5,
            lineHeight: 1.1
          }}
        >
          {banner.title}
        </Typography>
        {banner.subtitle && (
          <Typography
            variant="h6"
            sx={{
              color: "black",
              fontWeight: '400',
              fontSize: '0.95rem',
              lineHeight: 1.2,
              opacity: 0.8
            }}
          >
            {banner.subtitle}
          </Typography>
        )}
      </Box>

      {/* Right image - 3D effect with overflow */}
      <Box
        sx={{
          position: 'absolute',
          right: 8,
          top: -20,
          zIndex: 2,
          width: 160,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Image
          src={banner.imageUrl}
          alt={banner.imageAlt}
          width={180}
          height={180}
          style={{
            objectFit: 'contain',
            borderRadius: '12px',
            zIndex: 9999,
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
          }}
        />
      </Box>

      {/* Background decorative stars */}
      <Box
        sx={{
          position: 'absolute',
          right: 20,
          top: 20,
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '1rem',
          zIndex: 1
        }}
      >
        ✨
      </Box>
      <Box
        sx={{
          position: 'absolute',
          right: 80,
          top: 35,
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '0.8rem',
          zIndex: 1
        }}
      >
        ⭐
      </Box>
      <Box
        sx={{
          position: 'absolute',
          right: 45,
          bottom: 25,
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.9rem',
          zIndex: 1
        }}
      >
        ✨
      </Box>

      {/* Background decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: -20,
          bottom: -20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          zIndex: 1
        }}
      />
    </Box>
  );

  // Don't render anything while loading
  if (loading) {
    return (
      <Box sx={{ px: 2, mb: 3 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
            borderRadius: 4,
            p: 3,
            minHeight: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">กำลังโหลด...</Typography>
        </Box>
      </Box>
    );
  }

  // Don't render if no banners
  if (banners.length === 0) {
    return null;
  }

  return (
    <Box sx={{ px: 2, mb: 3 }}>
      {/* Banner Container */}
      <Box
        sx={{
          position: 'relative',
          minHeight: 140,
          overflow: 'visible',
          borderRadius: 4,
          touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal touches
          userSelect: 'none', // Prevent text selection during swipe
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner, index) => renderBanner(banner, index))}
      </Box>

      {/* Pagination Dots */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          mt: 2,
        }}
      >
        {banners.map((_, index) => (
          <Box
            key={index}
            onClick={() => handleDotClick(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: currentSlide === index ? colors.primary.main : 'rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: currentSlide === index ? 'scale(1.2)' : 'scale(1)',
              '&:hover': {
                backgroundColor: currentSlide === index ? colors.primary.main : 'rgba(0, 0, 0, 0.5)',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}