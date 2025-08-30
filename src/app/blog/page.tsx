"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  Divider,
  Button,
  GlobalStyles
} from '@mui/material';
import { Search, Article } from '@mui/icons-material';
import { BlogPost, BlogCategory } from '@/types';
import { colors } from '@/theme/colors';
import BlogCard from '@/components/BlogCard';
import ResponsiveHeader from '@/components/ResponsiveHeader';

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');



  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    fetchInitialData();
  }, []);

  // ค้นหาเมื่อมีการเปลี่ยนแปลง category หรือ search term
  useEffect(() => {
    if (!loading) {
      fetchPosts();
    }
  }, [selectedCategory, searchTerm]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // โหลดหมวดหมู่
      const categoriesResponse = await fetch('/api/blog/categories');
      const categoriesData = await categoriesResponse.json();
      
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }



      // โหลดบทความทั้งหมด
      await fetchPosts();
      
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/blog?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการโหลดบทความ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการค้นหาบทความ');
      console.error('Error:', err);
    }
  };

  const handleCategoryClick = (categorySlug: string) => {
    setSelectedCategory(selectedCategory === categorySlug ? '' : categorySlug);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <>
        <GlobalStyles
          styles={{
            body: {
              margin: 0,
              padding: 0,
              backgroundColor: "#FFFFFF",
            },
          }}
        />
        <Box sx={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
          <ResponsiveHeader />

          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress size={60} sx={{ color: colors.primary }} />
            </Box>
          </Container>
        </Box>
      </>
    );
  }

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            margin: 0,
            padding: 0,
            backgroundColor: "#FFFFFF",
          },
        }}
      />
      <Box sx={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
        <ResponsiveHeader />

        <Container maxWidth="lg" sx={{ py: 6 }}>
          {/* หัวข้อหลัก */}
          <Box textAlign="center" mb={5}>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                color: '#000',
                mb: 2,
                letterSpacing: '-0.02em'
              }}
            >
              บล็อกเกี่ยวกับสัตว์เลี้ยง
            </Typography>
            <Typography
              variant="h6"
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                color: '#666',
                fontSize: { xs: '1rem', md: '1.125rem' },
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              ความรู้ เคล็ดลับ และคำแนะนำในการดูแลสัตว์เลี้ยงของคุณให้มีความสุขและสุขภาพดี
            </Typography>
          </Box>



          {/* ส่วนค้นหาและกรอง */}
          <Box
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              border: "3px solid #000",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              backgroundColor: 'white',
              mb: 4,
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)"
              }
            }}
          >
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '1fr 1fr'
                  },
                  gap: 3,
                  alignItems: 'start'
                }}
              >
                {/* ช่องค้นหา */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#000', mb: 2 }}>
                    ค้นหาบทความ:
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="ค้นหาบทความ..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#000' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        borderWidth: 2,
                        '&:hover': {
                          borderColor: '#000'
                        },
                        '&.Mui-focused': {
                          borderColor: '#000',
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                </Box>

                {/* หมวดหมู่ */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#000', mb: 2 }}>
                    หมวดหมู่:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    <Chip
                      label="ทั้งหมด"
                      onClick={() => setSelectedCategory('')}
                      sx={{
                        mb: 1,
                        backgroundColor: selectedCategory === '' ? '#000' : '#f1f3f4',
                        color: selectedCategory === '' ? 'white' : '#555',
                        fontWeight: 600,
                        borderRadius: 3,
                        border: '2px solid #000',
                        '&:hover': {
                          backgroundColor: selectedCategory === '' ? '#333' : '#e8eaed',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    />
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        onClick={() => handleCategoryClick(category.slug)}
                        sx={{
                          mb: 1,
                          backgroundColor: selectedCategory === category.slug 
                            ? category.color || '#000'
                            : '#f1f3f4',
                          color: selectedCategory === category.slug ? 'white' : '#555',
                          fontWeight: 600,
                          borderRadius: 3,
                          border: '2px solid #000',
                          '&:hover': {
                            backgroundColor: category.color || '#e8eaed',
                            color: 'white',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ข้อผิดพลาด */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                borderRadius: 3,
                border: '2px solid #f44336',
                backgroundColor: '#ffebee'
              }}
            >
              {error}
            </Alert>
          )}

          {/* รายการบทความ */}
          <Box>
            <Box display="flex" alignItems="center" mb={4}>
              <Article sx={{ color: '#000', mr: 1.5, fontSize: '1.5rem' }} />
              <Typography 
                variant="h5" 
                fontWeight={700} 
                sx={{ 
                  color: '#000',
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                บทความทั้งหมด
              </Typography>
              {posts.length > 0 && (
                <Typography variant="body2" sx={{ color: '#666', ml: 2, fontWeight: 500 }}>
                  ({posts.length} บทความ)
                </Typography>
              )}
            </Box>

            {posts.length === 0 ? (
              <Box
                sx={{
                  borderRadius: 4,
                  border: "3px solid #000",
                  backgroundColor: 'white',
                  textAlign: 'center',
                  py: 8,
                  px: 4
                }}
              >
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }} gutterBottom>
                  ไม่พบบทความที่ตรงกับการค้นหา
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                  },
                  gap: 2
                }}
              >
                {posts.map((post) => (
                  <Box key={post.id}>
                    <BlogCard post={post} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
}
