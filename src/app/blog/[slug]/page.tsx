"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Breadcrumbs,
  Link,
  GlobalStyles
} from '@mui/material';
import {
  ArrowBack,
  Schedule,
  Person,
  Share,
  BookmarkBorder,
  NavigateNext
} from '@mui/icons-material';
import { BlogPost } from '@/types';
import { colors } from '@/theme/colors';
import BlogCard from '@/components/BlogCard';
import ResponsiveHeader from '@/components/ResponsiveHeader';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();


  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.data);
        // Fetch related posts
        const relatedResponse = await fetch(`/api/blog?category=${data.data.category.slug}&limit=3`);
        const relatedData = await relatedResponse.json();
        let relatedFiltered = [];
        if (relatedData.success) {
          // Filter out current post
          relatedFiltered = relatedData.data.filter((p: BlogPost) => p.id !== data.data.id);
          console.log('Related posts:', relatedFiltered.slice(0, 3));
        } else {
          console.log('Failed to fetch related posts:', relatedData);
        }
        
        // Fallback: หากไม่มี related posts ให้ดึงบทความล่าสุด
        if (relatedFiltered.length === 0) {
          const fallbackResponse = await fetch(`/api/blog?limit=3`);
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success) {
            relatedFiltered = fallbackData.data.filter((p: BlogPost) => p.id !== data.data.id);
          }
        }
        
        setRelatedPosts(relatedFiltered.slice(0, 3));
      } else {
        setError(data.error || 'ไม่พบบทความ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดบทความ');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('ลิงก์ถูกคัดลอกแล้ว');
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} sx={{ color: colors.primary }} />
        </Box>
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error || 'ไม่พบบทความที่ต้องการ'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ color: colors.primary }}
        >
          กลับไปหน้าบล็อก
        </Button>
      </Box>
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

        {/* เนื้อหาหลัก */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          px: { xs: 2, md: 4 },
          py: 6
        }}>
          <Box sx={{ width: '100%', maxWidth: '1200px' }}>
            {/* ปุ่มกลับและ Breadcrumbs */}
            <Box mb={{ xs: 2, md: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ 
                  color: colors.primary, 
                  mb: { xs: 1, md: 2 },
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  p: { xs: 1, md: 1.5 }
                }}
              >
                กลับ
              </Button>
              
              <Breadcrumbs 
                separator={<NavigateNext fontSize="small" />}
                sx={{ 
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  '& .MuiTypography-root': {
                    fontSize: 'inherit'
                  }
                }}
              >
                <Link
                  underline="hover"
                  color="inherit"
                  href="/blog"
                  sx={{ cursor: 'pointer' }}
                >
                  บล็อก
                </Link>
                <Link
                  underline="hover"
                  color="inherit"
                  href={`/blog?category=${post.category.slug}`}
                  sx={{ cursor: 'pointer' }}
                >
                  {post.category.name}
                </Link>
                <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                  {post.title.length > 30 ? `${post.title.substring(0, 30)}...` : post.title}
                </Typography>
              </Breadcrumbs>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '2fr 1fr'
                },
                gap: { xs: 2, md: 4 }
              }}
            >
              {/* เนื้อหาหลัก */}
              <Box>
                <Box
                  sx={{
                    borderRadius: 2,
                    border: "3px solid #000",
                    backgroundColor: 'white'
                  }}
                >
                  <Box sx={{ p: { xs: 3, md: 4 } }}>
                    {/* หมวดหมู่ */}
                    <Chip
                      label={post.category.name}
                      sx={{
                        backgroundColor: '#f1f3f4',
                        color: '#555',
                        fontWeight: 400,
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        mb: { xs: 1.5, md: 2 },
                        borderRadius: 1,
                        height: 24
                      }}
                    />

                    {/* หัวข้อ */}
                    <Typography
                      variant="h1"
                      component="h1"
                      gutterBottom
                      sx={{
                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                        fontWeight: 500,
                        lineHeight: 1.4,
                        color: '#333',
                        mb: { xs: 2, md: 3 },
                        letterSpacing: '0'
                      }}
                    >
                      {post.title}
                    </Typography>

                   

                    <Divider sx={{ 
                      mb: { xs: 1.5, md: 2 }, 
                      borderColor: '#e0e0e0'
                    }} />

                    {/* รูปภาพหลัก */}
                    {post.imageUrl && (
                      <Box
                        component="img"
                        src={post.imageUrl}
                        alt={post.title}
                        sx={{
                          width: '100%',
                          height: 'auto',
                          objectFit: 'contain',
                          borderRadius: 1,
                          mb: { xs: 1.5, md: 2 },
                          backgroundColor: '#f8f9fa'
                        }}
                      />
                    )}

                    {/* คำอธิบายย่อ */}
                    <Box
                      sx={{
                        p: { xs: 1.5, md: 2 },
                        backgroundColor: '#f8f9fa',
                        borderRadius: 1,
                        border: '1px solid #e9ecef',
                        mb: { xs: 1.5, md: 2 }
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                          fontSize: { xs: '0.8rem', md: '0.85rem' },
                          fontWeight: 400,
                          color: '#666'
                        }}
                      >
                        {post.excerpt}
                      </Typography>
                    </Box>

                    {/* เนื้อหาหลัก */}
                    <Box
                      sx={{
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                          color: '#333',
                          fontWeight: 500,
                          mt: { xs: 1.5, md: 2 },
                          mb: { xs: 1, md: 1.5 },
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          lineHeight: 1.4
                        },
                        '& p': {
                          lineHeight: 1.6,
                          mb: { xs: 1, md: 1.5 },
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          color: '#555',
                          fontWeight: 400
                        },
                        '& ul, & ol': {
                          pl: { xs: 1.5, md: 2 },
                          mb: { xs: 1, md: 1.5 }
                        },
                        '& li': {
                          mb: { xs: 0.25, md: 0.5 },
                          lineHeight: 1.5,
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          color: '#555'
                        },
                        '& blockquote': {
                          borderLeft: '3px solid #e0e0e0',
                          backgroundColor: '#f8f9fa',
                          p: { xs: 1.5, md: 2 },
                          m: { xs: 1, md: 1.5 },
                          borderRadius: 1,
                          fontStyle: 'italic',
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          color: '#666',
                          fontWeight: 400
                        },
                        '& code': {
                          backgroundColor: '#f1f3f4',
                          padding: '2px 6px',
                          borderRadius: 1,
                          fontSize: { xs: '0.75rem', md: '0.8rem' },
                          fontFamily: 'monospace',
                          color: '#333'
                        }
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: post.content
                            .replace(/\n/g, '<br>')
                            .replace(/#{1,6}\s?(.+)/g, '<h3 style="color: #666; font-weight: 400; margin: 12px 0; font-size: 0.95rem; line-height: 1.4;">$1</h3>')
                        }}
                      />
                    </Box>

                    {/* แท็ก */}
                    {post.tags && post.tags.length > 0 && (
                      <Box mt={{ xs: 2, md: 3 }}>
                        <Divider sx={{ 
                          mb: 1.5, 
                          borderColor: '#e0e0e0'
                        }} />
                        <Typography 
                          variant="subtitle2" 
                          gutterBottom
                          sx={{
                            fontSize: { xs: '0.75rem', md: '0.8rem' },
                            fontWeight: 500,
                            color: '#666',
                            mb: 1
                          }}
                        >
                          แท็ก:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {post.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{ 
                                fontSize: { xs: '0.7rem', md: '0.75rem' },
                                height: 24,
                                borderRadius: 1,
                                backgroundColor: '#f1f3f4',
                                color: '#555',
                                fontWeight: 400,
                                border: 'none',
                                '&:hover': {
                                  backgroundColor: '#e8eaed'
                                }
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* แถบข้าง */}
              <Box sx={{ 
                display: { xs: 'none', md: 'block' },
                
                minHeight: '200px',
                
              }}>
                
                {/* บทความที่เกี่ยวข้อง */}
                {relatedPosts.length > 0 && (
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "3px solid #000",
                      backgroundColor: 'white',
                      position: 'sticky',
                      top: 24
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        gutterBottom 
                        sx={{ 
                          color: '#333',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          mb: 2,
                          borderBottom: '1px solid #e0e0e0',
                          paddingBottom: 1
                        }}
                      >
                        บทความที่เกี่ยวข้อง
                      </Typography>
                      <Stack spacing={1.5}>
                        {relatedPosts.map((relatedPost) => (
                          <Box key={relatedPost.id}>
                            <BlogCard post={relatedPost} />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                )}

              </Box>
            </Box>
            
            {/* บทความที่เกี่ยวข้องสำหรับ Mobile */}
            {relatedPosts.length > 0 && (
              <Box sx={{ 
                display: { xs: 'block', md: 'none' }, 
                mt: 2
              }}>
                <Box
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    backgroundColor: 'white'
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography 
                      variant="subtitle1" 
                      gutterBottom 
                      sx={{ 
                        color: '#333',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        mb: 1.5,
                        borderBottom: '1px solid #e0e0e0',
                        paddingBottom: 1
                      }}
                    >
                      บทความที่เกี่ยวข้อง
                    </Typography>
                    <Stack spacing={1.5}>
                      {relatedPosts.map((relatedPost) => (
                        <Box key={relatedPost.id}>
                          <BlogCard post={relatedPost} />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
