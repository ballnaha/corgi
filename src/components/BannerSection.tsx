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
  bannerUrl: string | null;
  bannerType: string;
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
      title: "Natpi & Cor.",
      subtitle: "ร้านค้าสัตว์เลี้ยง",
      background: 'linear-gradient(135deg, #FFB74D 0%, #FB8C00 50%, #F57C00 100%)',
      imageUrl: "/images/icon_logo.png",
      imageAlt: "Pet Shop Promotion",
      linkUrl: null,
      bannerUrl: null,
      bannerType: "custom",
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

  const renderBanner = (banner: Banner, index: number) => {
    // For fullsize banners, use bannerUrl as background image
    const isFullsize = banner.bannerType === 'fullsize';
    
    const bannerStyle = isFullsize && banner.bannerUrl 
      ? {
          backgroundImage: `url(${banner.bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      : { background: banner.background };

    return (
      <Box
        key={banner.id}
        onClick={() => handleBannerClick(banner)}
        sx={{
          ...bannerStyle,
          borderRadius: { xs: 2, md: 3 },
          p: isFullsize ? 0 : { xs: 3, sm: 4, md: 5 },
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          overflow: 'visible',
          minHeight: { xs: 150, sm: 200, md: 400, lg: 400 },
          height: { xs: 150, sm: 200, md: 400, lg: 400 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: currentSlide === index ? 1 : 0,
          transform: currentSlide === index ? 'translateX(0)' : 
                     index > currentSlide ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'all 0.5s ease-in-out',
          cursor: banner.linkUrl ? 'pointer' : 'default',
          '&:hover': {
            transform: currentSlide === index ? 'scale(1.01)' : 
                       index > currentSlide ? 'translateX(100%) scale(1.01)' : 'translateX(-100%) scale(1.01)',
          }
        }}
      >
        {/* Text content overlay for fullsize banners */}
        {isFullsize && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: { xs: 2, md: 3 },
              zIndex: 1
            }}
          />
        )}

        {/* Left content - Hide text for fullsize banners */}
        {!isFullsize && (
          <Box sx={{ flex: 1, zIndex: 2, maxWidth: { xs: '60%', md: '65%' } }}>
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: '600',
                fontSize: { xs: '1.8rem', sm: '1.3rem', md: '2rem', lg: '2.5rem' },
                mb: { xs: 0.5, md: 1 },
                lineHeight: 1.1
              }}
            >
              {banner.title}
            </Typography>
            {banner.subtitle && (
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: '400',
                  fontSize: { xs: '1.3rem', sm: '0.9rem', md: '1.2rem', lg: '1.4rem' },
                  lineHeight: 1.2,
                  opacity: 0.9
                }}
              >
                {banner.subtitle}
              </Typography>
            )}
          </Box>
        )}

        {/* Right image - Only show for custom banners */}
        {!isFullsize && (
          <Box
            sx={{
              position: 'absolute',
              right: { xs: 8, md: 16 },
              top: { xs: -10, md: -20 },
              zIndex: 2,
              width: { xs: 120, sm: 140, md: 200, lg: 240 },
              height: { xs: 140, sm: 160, md: 220, lg: 260 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {banner.imageUrl && (
              <Image
                src={banner.imageUrl}
                alt={banner.imageAlt}
                width={0}
                height={0}
                sizes="(max-width: 600px) 120px, (max-width: 900px) 140px, (max-width: 1200px) 200px, 240px"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: '240px',
                  maxHeight: '240px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  zIndex: 9999,
                  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
                }}
              />
            )}
          </Box>
        )}

        {/* Background decorative stars and paws - Only show for custom banners */}
        {!isFullsize && (
          <>
            <Box
              sx={{
                position: 'absolute',
                right: { xs: 20, md: 30 },
                top: { xs: 20, md: 30 },
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '1rem', md: '1.5rem' },
                zIndex: 1
              }}
            >
              ✨
            </Box>

            <Box
              sx={{
                position: 'absolute',
                left: { xs: 15, md: 25 },
                bottom: { xs: 15, md: 25 },
                color: 'rgba(255, 255, 255, 1)',
                fontSize: { xs: '1.2rem', md: '1.8rem' },
                zIndex: 1
              }}
            >
              🐾
            </Box>
          </>
        )}
      </Box>
    );
  };

  // Don't render anything while loading
  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
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
    <Box sx={{ mb: 3 }}>
      {/* Banner Container */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 150, sm: 200, md: 400, lg: 400 },
          height: 'auto',
          overflow: 'visible',
          borderRadius: { xs: 4, md: 5 },
          touchAction: 'pan-y',
          userSelect: 'none',
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
          gap: { xs: 1, md: 1.5 },
          mt: { xs: 3, md: 4 },
        }}
      >
        {banners.map((_, index) => (
          <Box
            key={index}
            onClick={() => handleDotClick(index)}
            sx={{
              width: { xs: 8, md: 10 },
              height: { xs: 8, md: 10 },
              borderRadius: '50%',
              backgroundColor: currentSlide === index ? colors.primary.main : 'rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: currentSlide === index ? 'scale(1.2)' : 'scale(1)',
              '&:hover': {
                backgroundColor: currentSlide === index ? colors.primary.main : 'rgba(0, 0, 0, 0.5)',
                transform: 'scale(1.3)',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}