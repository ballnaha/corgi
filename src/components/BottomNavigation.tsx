'use client';

import React from 'react';
import {
  Box,
  IconButton,
  Typography
} from '@mui/material';
import {
  Home,
  ChatBubbleOutline,
  FavoriteBorder,
  Person
} from '@mui/icons-material';
import { colors } from '@/theme/colors';

interface BottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function BottomNavigation({ 
  activeTab = 'home',
  onTabChange 
}: BottomNavigationProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'favorites', icon: FavoriteBorder, label: 'Favorites' },
    { id: 'calendar', icon: ChatBubbleOutline, label: 'Calendar' },
    { id: 'profile', icon: Person, label: 'Profile' },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.secondary.main,
        borderTop: `1px solid ${colors.background.default}`,
        borderRadius: '20px 20px 0 0',
        px: 2,
        py: 1,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        zIndex: 1000,
        height: 70
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Box
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            sx={{
              display: 'flex',
              flexDirection: isActive ? 'row' : 'column',
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.5,
              px: isActive ? 2 : 1,
              borderRadius: isActive ? 5 : 2,
              backgroundColor: isActive ? colors.primary.main : 'transparent',
              transition: 'all 0.3s ease',
              gap: isActive ? 0.5 : 0,
              minWidth: isActive ? 'auto' : 36,
              height: 48
            }}
          >
            <Icon 
              fontSize="small" 
              sx={{ 
                color: isActive ? colors.secondary.main : colors.text.secondary,
                mb: isActive ? 0 : 0.5
              }} 
            />
            <Typography
              variant="caption"
              sx={{
                color: isActive ? colors.secondary.main : colors.text.secondary,
                fontSize: '0.7rem',
                fontWeight: isActive ? 'bold' : 'normal',
                display: isActive ? 'block' : 'block',
                mt: isActive ? 0 : 0.25
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}