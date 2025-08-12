'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  Badge,
  ButtonGroup
} from '@mui/material';
import {
  Close,
  Add,
  Remove,
  ShoppingCart,
  Delete
} from '@mui/icons-material';
import { colors } from '@/theme/colors';
import { CartItem } from '@/types';

interface CartProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function Cart({
  open,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartProps) {
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 400 },
            backgroundColor: colors.background.default,
          }
        }
      }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart sx={{ color: colors.primary.main }} />
            <Typography variant="h6" sx={{ color: colors.text.primary }}>
              ตะกร้าสินค้า
            </Typography>
            <Badge 
              badgeContent={totalItems} 
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: colors.primary.main,
                  color: colors.secondary.main,
                }
              }}
            >
              <Box />
            </Badge>
          </Box>
          <IconButton onClick={onClose} sx={{ color: colors.accent.main }}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: colors.primary.main }} />

        {/* Cart Items */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShoppingCart sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }} />
              <Typography variant="body1" sx={{ color: colors.text.secondary }}>
                ตะกร้าสินค้าว่างเปล่า
              </Typography>
            </Box>
          ) : (
            <List>
              {items.map((item) => (
                <ListItem
                  key={item.product.id}
                  sx={{
                    backgroundColor: colors.background.paper,
                    borderRadius: 2,
                    mb: 1,
                    border: `1px solid ${colors.primary.light}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    p: 2
                  }}
                >
                  <Avatar
                    src={item.product.image}
                    alt={item.product.name}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: colors.text.primary, mb: 0.5 }}>
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primary.main, fontWeight: 'bold', mb: 1 }}>
                      ฿{item.product.price.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ButtonGroup size="small">
                        <Button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          sx={{ 
                            color: colors.primary.main,
                            borderColor: colors.primary.main,
                            minWidth: 30
                          }}
                        >
                          <Remove fontSize="small" />
                        </Button>
                        <Button
                          disabled
                          sx={{ 
                            color: colors.text.primary,
                            borderColor: colors.primary.main,
                            minWidth: 40
                          }}
                        >
                          {item.quantity}
                        </Button>
                        <Button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          sx={{ 
                            color: colors.primary.main,
                            borderColor: colors.primary.main,
                            minWidth: 30
                          }}
                        >
                          <Add fontSize="small" />
                        </Button>
                      </ButtonGroup>
                      <IconButton
                        onClick={() => onRemoveItem(item.product.id)}
                        sx={{ color: colors.error }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {items.length > 0 && (
          <>
            <Divider sx={{ borderColor: colors.primary.main }} />
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: colors.text.primary }}>
                  รวมทั้งหมด:
                </Typography>
                <Typography variant="h6" sx={{ color: colors.primary.main, fontWeight: 'bold' }}>
                  ฿{totalPrice.toLocaleString()}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={onCheckout}
                sx={{
                  backgroundColor: colors.primary.main,
                  color: colors.secondary.main,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                  }
                }}
              >
                ชำระเงิน
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}