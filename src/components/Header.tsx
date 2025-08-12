'use client';

import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge, 
  Box,
  InputBase,
  Button,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import { 
  ShoppingCart, 
  Search, 
  Person, 
  Menu as MenuIcon,
  Pets,
  LocationOn,
  Tune
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { colors } from '@/theme/colors';

const StyledAppBar = styled(AppBar)({
  backgroundColor: colors.secondary.main,
  boxShadow: 'none',
  borderBottom: 'none',
});

const MobileHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: colors.secondary.main,
  borderRadius: '0 0 24px 24px',
  marginBottom: theme.spacing(2),
}));

const LocationChip = styled(Chip)({
  backgroundColor: alpha(colors.text.secondary, 0.1),
  color: colors.text.secondary,
  fontSize: '0.75rem',
  height: '28px',
  '& .MuiChip-icon': {
    color: colors.text.secondary,
    fontSize: '16px',
  },
});

const SearchBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: '16px',
  backgroundColor: colors.background.default,
  border: `1px solid ${alpha(colors.text.secondary, 0.2)}`,
  marginTop: theme.spacing(2),
  width: '100%',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.text.secondary,
}));

const FilterButton = styled(IconButton)({
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: colors.primary.main,
  color: colors.secondary.main,
  width: 32,
  height: 32,
  '&:hover': {
    backgroundColor: colors.primary.dark,
  },
});

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: colors.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 6, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: '0.9rem',
    '&::placeholder': {
      color: colors.text.secondary,
      opacity: 1,
    },
  },
}));

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchChange?: (query: string) => void;
}

export default function Header({ 
  cartItemCount = 0, 
  onCartClick,
  onSearchChange 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen && searchQuery) {
      setSearchQuery('');
      onSearchChange?.('');
    }
  };

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
      <MobileHeader>
        {/* Top row with profile and notification */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F4511E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              🐕
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: colors.text.primary,
                  fontSize: '1.1rem',
                  mb: 0
                }}
              >
                Welcome Back!
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: colors.text.secondary,
                  fontSize: '0.85rem'
                }}
              >
                MD, Mainul Islam
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleSearchToggle}
              sx={{ 
                backgroundColor: colors.background.default,
                color: colors.text.secondary,
                width: 40,
                height: 40,
                '&:hover': {
                  backgroundColor: colors.background.accent,
                }
              }}
            >
              <Search fontSize="small" />
            </IconButton>

            <IconButton
              onClick={onCartClick}
              sx={{ 
                backgroundColor: colors.background.default,
                color: colors.text.secondary,
                width: 40,
                height: 40,
                '&:hover': {
                  backgroundColor: colors.background.accent,
                }
              }}
            >
              <Badge 
                badgeContent={cartItemCount} 
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: colors.primary.main,
                    color: colors.secondary.main,
                    fontSize: '0.7rem',
                    minWidth: 16,
                    height: 16,
                  }
                }}
              >
                <ShoppingCart fontSize="small" />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        {/* Search Bar - Only show when isSearchOpen is true */}
        {isSearchOpen && (
          <SearchBox>
            <SearchIconWrapper>
              <Search />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search a pet"
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            <FilterButton>
              <Tune fontSize="small" />
            </FilterButton>
          </SearchBox>
        )}
      </MobileHeader>
    </Box>
  );
}