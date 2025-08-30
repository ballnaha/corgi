"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  Avatar,
  Stack
} from '@mui/material';
import { Schedule } from '@mui/icons-material';
import { BlogPost } from '@/types';
import { colors } from '@/theme/colors';
import { useRouter } from 'next/navigation';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/blog/${post.slug}`);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid #e0e0e0',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }
      }}
    >
      {/* รูปภาพหลัก */}
      <CardMedia
        component="img"
        height={160}
        image={post.imageUrl || '/images/placeholder.png'}
        alt={post.title}
        sx={{
          objectFit: 'cover'
        }}
      />


      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* หมวดหมู่ */}
        <Chip
          label={post.category.name}
          size="small"
          sx={{
            backgroundColor: post.category.color || colors.secondary,
            color: 'white',
            fontSize: '0.75rem',
            mb: 1
          }}
        />

        {/* หัวข้อ */}
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: colors.text.primary,
            mb: 1
          }}
        >
          {post.title}
        </Typography>

        {/* คำอธิบาย */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
            mb: 2,
            wordBreak: 'break-word'
          }}
        >
          {post.excerpt}
        </Typography>

        {/* แท็ก */}
        {post.tags && post.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            ))}
            {post.tags.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{post.tags.length - 3}
              </Typography>
            )}
          </Stack>
        )}

        {/* ข้อมูลผู้เขียนและสถิติ */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: '0.75rem',
                mr: 1,
                backgroundColor: colors.secondary
              }}
            >
              {post.author.charAt(0)}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {post.author}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Schedule sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(post.publishedAt)}
              </Typography>
            </Box>

          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
