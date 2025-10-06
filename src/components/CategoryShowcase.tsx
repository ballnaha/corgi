'use client';

import React from 'react';
import { Box, Typography, Container, Paper, Fade } from '@mui/material';
import Image from 'next/image';
import { colors } from '@/theme/colors';
import { Pets } from '@mui/icons-material';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  backgroundColor: string;
  textColor?: string;
}

interface CategoryShowcaseProps {
  onCategoryClick: (category: string) => void;
}

export default function CategoryShowcase({ onCategoryClick }: CategoryShowcaseProps) {
  const categories: CategoryItem[] = [
    {
      id: '1',
      name: 'สุนัข',
      description: 'อาหารและอุปกรณ์สำหรับน้องหมา',
      image: '/images/dog1_nobg.png',
      category: 'dogs',
      backgroundColor: 'linear-gradient(135deg, #FFE0B2 0%, #FFCC02 100%)',
      textColor: '#5D4037'
    },
    {
      id: '2', 
      name: 'แมว',
      description: 'อาหารและอุปกรณ์สำหรับน้องแมว',
      image: '/images/cat1_nobg.png',
      category: 'cats',
      backgroundColor: 'linear-gradient(135deg, #F8BBD9 0%, #E91E63 100%)',
      textColor: 'white'
    },
    {
      id: '3',
      name: 'นก',
      description: 'อาหารและกรงสำหรับนก',
      image: '/images/bird1.png',
      category: 'birds',
      backgroundColor: 'linear-gradient(135deg, #B3E5FC 0%, #03A9F4 100%)',
      textColor: 'white'
    },
    {
      id: '4',
      name: 'อุปกรณ์',
      description: 'ของเล่นและอุปกรณ์ทั่วไป',
      image: '/images/accessories1.png',
      category: 'accessories',
      backgroundColor: 'linear-gradient(135deg, #C8E6C9 0%, #4CAF50 100%)',
      textColor: 'white'
    },
  ];

  return (
    <Box sx={{ mb: 6 }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Pets sx={{ color: colors.primary.main, fontSize: '2rem' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                fontSize: { xs: '1.8rem', md: '2.2rem' },
              }}
            >
              ช้อปตามประเภทสัตว์เลี้ยง
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{
              color: colors.text.secondary,
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            เลือกสินค้าที่เหมาะสมกับสัตว์เลี้ยงของคุณ
          </Typography>
        </Box>

        {/* Categories Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: { xs: 2, md: 3 },
          }}
        >
          {categories.map((category, index) => (
            <Fade in timeout={600 + index * 150} key={category.id}>
              <Paper
                elevation={0}
                sx={{
                  background: category.backgroundColor,
                  borderRadius: 3,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                  position: 'relative',
                  minHeight: { xs: 200, md: 250 },
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'scale(1.05) translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  }
                }}
                onClick={() => onCategoryClick(category.category)}
              >
                {/* Background pattern */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                    zIndex: 1,
                  }}
                />

                {/* Content */}
                <Box
                  sx={{
                    p: { xs: 2, md: 3 },
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {/* Text Content */}
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: category.textColor || 'white',
                        fontSize: { xs: '1.3rem', md: '1.5rem' },
                        mb: 1,
                        textShadow: category.textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {category.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: category.textColor === 'white' ? 'rgba(255,255,255,0.9)' : 'rgba(93, 64, 55, 0.8)',
                        fontSize: { xs: '0.85rem', md: '0.9rem' },
                        lineHeight: 1.4,
                        textShadow: category.textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {category.description}
                    </Typography>
                  </Box>

                  {/* Image */}
                  <Box
                    sx={{
                      alignSelf: 'center',
                      mt: 2,
                      position: 'relative',
                      width: { xs: 80, md: 100 },
                      height: { xs: 80, md: 100 },
                    }}
                  >
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      style={{
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))',
                      }}
                    />
                  </Box>
                </Box>

                {/* Decorative elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    right: -10,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 1,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -5,
                    left: -5,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.15)',
                    zIndex: 1,
                  }}
                />
              </Paper>
            </Fade>
          ))}
        </Box>

        {/* Bottom Info */}
        <Box
          sx={{
            mt: 4,
            textAlign: 'center',
            p: 3,
            backgroundColor: colors.background.paper,
            borderRadius: 2,
            border: `1px solid #e0e0e0`,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: colors.text.secondary,
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            💡 <strong>เทิป:</strong> คลิกที่หมวดหมู่เพื่อดูสินค้าที่เหมาะสมกับสัตว์เลี้ยงของคุณ
            <br />
            เรามีสินค้าคุณภาพจากแบรนด์ชั้นนำมากมายให้เลือก
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}