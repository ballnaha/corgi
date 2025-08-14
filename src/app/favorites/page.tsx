'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Snackbar, Alert, Slide } from '@mui/material';
import type { SlideProps } from '@mui/material';
import { colors } from '@/theme/colors';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import { Product, CartItem } from '@/types';
import { generateSlug } from '@/lib/products';
import { readFavoriteIds, toggleFavoriteId } from '@/lib/favorites';
import { readCartFromStorage, writeCartToStorage, addToCartStorage, updateQuantityInStorage, removeFromCartStorage } from '@/lib/cart';

export default function FavoritesPage() {
	const SlideUpTransition = React.forwardRef(function SlideUpTransition(
		props: SlideProps,
		ref: React.Ref<unknown>
	) {
		return <Slide direction="up" ref={ref} {...props} />;
	});
	const router = useRouter();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info'; }>({ open: false, message: '', severity: 'success' });
	const [snackbarKey, setSnackbarKey] = useState<number>(0);

	useEffect(() => {
		setFavoriteIds(readFavoriteIds());
		const stored = readCartFromStorage();
		if (stored.length) setCartItems(stored);
		
		const fetchProducts = async () => {
			try {
				setLoading(true);
				const resp = await fetch('/api/products');
				const data = await resp.json();
				type DbProduct = {
					id: string;
					name: string;
					category: string;
					price: number | string;
					salePrice?: number | string | null;
					discountPercent?: number | string | null;
					description?: string | null;
					imageUrl?: string | null;
					stock?: number | string | null;
					gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
					age?: string | null;
					breed?: string | null;
					location?: string | null;
				};
				const transformed: Product[] = (data as DbProduct[]).map((p) => ({
					...p,
					image: p.imageUrl || '',
					price: Number(p.price),
					salePrice: p.salePrice != null ? Number(p.salePrice) : null,
					discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
					stock: Number(p.stock ?? 0)
				}));
				setProducts(transformed);
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, []);

	useEffect(() => {
		writeCartToStorage(cartItems);
	}, [cartItems]);

	const favoriteProducts = useMemo(() => {
		const idSet = new Set(favoriteIds);
		return products.filter(p => idSet.has(p.id));
	}, [products, favoriteIds]);

	const calculateUnitPrice = (product: Product) => {
		const hasSalePrice = product.salePrice != null;
		const hasDiscountPercent = !hasSalePrice && product.discountPercent != null && product.discountPercent > 0;
		if (hasSalePrice) return product.salePrice as number;
		if (hasDiscountPercent) return Math.max(0, product.price - (product.price * ((product.discountPercent as number) / 100)));
		return product.price;
	};

	const handleAddToCart = (product: Product) => {
		const stock = typeof product.stock === 'number' ? product.stock : 0;
		const existing = cartItems.find(i => i.product.id === product.id);

		if (stock <= 0) {
			setSnackbar({ open: true, message: "สินค้าหมด", severity: "error" });
			setSnackbarKey((k) => k + 1);
			return;
		}

		if (existing && existing.quantity >= stock) {
			setSnackbar({ open: true, message: "สินค้าเกินจำนวนคงเหลือ", severity: "warning" });
			setSnackbarKey((k) => k + 1);
			return;
		}

		setCartItems((prevItems) => {
			const item = prevItems.find(i => i.product.id === product.id);
			if (item) {
				return prevItems.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
			}
			return [...prevItems, { product, quantity: 1 }];
		});

		addToCartStorage(product, 1);

		setSnackbar({ open: true, message: `เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, severity: "success" });
		setSnackbarKey((k) => k + 1);
	};

	const handleUpdateQuantity = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			handleRemoveItem(productId);
			return;
		}

		setCartItems((prevItems) =>
			prevItems.map((item) => {
				if (item.product.id !== productId) return item;
				const stock = typeof item.product.stock === 'number' ? item.product.stock : 0;
				const maxQty = Math.max(0, stock);
				const nextQty = maxQty > 0 ? Math.min(quantity, maxQty) : item.quantity;
				return { ...item, quantity: nextQty };
			})
		);
		updateQuantityInStorage(productId, quantity);
	};

	const handleRemoveItem = (productId: string) => {
		setCartItems((prevItems) =>
			prevItems.filter((item) => item.product.id !== productId)
		);
		removeFromCartStorage(productId);
		setSnackbar({
			open: true,
			message: "นำสินค้าออกจากตะกร้าแล้ว",
			severity: "error",
		});
		setSnackbarKey((k) => k + 1);
	};

	const handleCheckout = () => {
		if (cartItems.length === 0) {
			setSnackbar({
				open: true,
				message: "ตะกร้าสินค้าว่างเปล่า",
				severity: "warning",
			});
			setSnackbarKey((k) => k + 1);
			return;
		}
		
		setIsCartOpen(false);
		router.push("/checkout");
	};

	const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<Box sx={{ minHeight: '100vh', backgroundColor: colors.background.default, display: 'flex', flexDirection: 'column' }}>
			<Navigation />
			<Header cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onSearchChange={() => {}} />
			<Box component="main" sx={{ px: 2, py: 5, flex: 1 }}>
				<Typography variant="h6" sx={{ color: colors.text.primary, fontWeight: 'bold', mb: 2 }}>
					รายการโปรด
				</Typography>
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
						<CircularProgress color="primary" />
					</Box>
				) : favoriteProducts.length === 0 ? (
					<Typography sx={{ color: colors.text.secondary }}>
						ยังไม่มีสินค้าในรายการโปรด
					</Typography>
				) : (
					<Box sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(2, 1fr)',
						gap: 2
					}}>
					{favoriteProducts.map((product) => (
							<ProductCard
								key={product.id}
								product={product}
								isFavorite={favoriteIds.includes(product.id)}
								onToggleFavorite={(id) => {
									const wasFavorite = favoriteIds.includes(id);
									setFavoriteIds(toggleFavoriteId(id));
									setSnackbar({
										open: true,
										message: `${wasFavorite ? 'นำออก' : 'เพิ่ม'} "${product.name}" ${wasFavorite ? 'จาก' : 'เข้า'} รายการโปรด`,
										severity: wasFavorite ? 'error' : 'success'
									});
									setSnackbarKey((k) => k + 1);
								}}
							onAddToCart={() => handleAddToCart(product)}
							onProductClick={() => {
								const slug = generateSlug(product.name, product.id);
								router.push(`/product/${slug}`);
							}}
							/>
						))}
					</Box>
				)}
			</Box>
			<BottomNavigation />
			
			<Cart
				items={cartItems}
				onClose={() => setIsCartOpen(false)}
				open={isCartOpen}
				onRemoveItem={handleRemoveItem}
				onUpdateQuantity={handleUpdateQuantity}
				onCheckout={handleCheckout}
			/>

      {/* Snackbar for feedback */}
      <Snackbar
        key={snackbarKey}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={SlideUpTransition}
        sx={{ pointerEvents: "none" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="standard"
          icon={false}
          sx={{
            pointerEvents: "all",
            width: "auto",
            maxWidth: "min(480px, calc(100vw - 32px))",
            px: 2,
            py: 1.25,
            borderRadius: 3,
            boxShadow:
              snackbar.severity === "success"
                ? "0 20px 40px rgba(46,125,50,0.18)"
                : snackbar.severity === "warning"
                ? "0 20px 40px rgba(240,180,0,0.18)"
                : snackbar.severity === "error"
                ? "0 20px 40px rgba(211,47,47,0.18)"
                : "0 20px 40px rgba(25,118,210,0.18)",
            backdropFilter: "saturate(180%) blur(12px)",
            WebkitBackdropFilter: "saturate(180%) blur(12px)",
            backgroundColor:
              snackbar.severity === "success"
                ? "rgba(46, 125, 50, 0.12)"
                : snackbar.severity === "warning"
                ? "rgba(240, 180, 0, 0.12)"
                : snackbar.severity === "error"
                ? "rgba(211, 47, 47, 0.12)"
                : "rgba(25, 118, 210, 0.12)",
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
            backgroundBlendMode: "overlay",
            color:
              snackbar.severity === "success"
                ? "#1b5e20"
                : snackbar.severity === "warning"
                ? "#7a5c00"
                : snackbar.severity === "error"
                ? "#8e0000"
                : "#0d47a1",
            border:
              snackbar.severity === "success"
                ? "1px solid rgba(46, 125, 50, 0.28)"
                : snackbar.severity === "warning"
                ? "1px solid rgba(240, 180, 0, 0.28)"
                : snackbar.severity === "error"
                ? "1px solid rgba(211, 47, 47, 0.28)"
                : "1px solid rgba(25, 118, 210, 0.28)",
            borderLeft:
              snackbar.severity === "success"
                ? "4px solid rgba(46, 125, 50, 0.65)"
                : snackbar.severity === "warning"
                ? "4px solid rgba(240, 180, 0, 0.65)"
                : snackbar.severity === "error"
                ? "4px solid rgba(211, 47, 47, 0.65)"
                : "4px solid rgba(25, 118, 210, 0.65)",
            fontWeight: 600,
            letterSpacing: 0.2,
            "& .MuiAlert-action > button": {
              color:
                snackbar.severity === "success"
                  ? "#1b5e20"
                  : snackbar.severity === "warning"
                  ? "#7a5c00"
                  : snackbar.severity === "error"
                  ? "#8e0000"
                  : "#0d47a1",
            },
          }}
        >
          {snackbar.message}
          <Box
            sx={{
              mt: 0.75,
              height: 2,
              borderRadius: 2,
              backgroundColor:
                snackbar.severity === "success"
                  ? "rgba(46,125,50,0.2)"
                  : snackbar.severity === "warning"
                  ? "rgba(240,180,0,0.2)"
                  : snackbar.severity === "error"
                  ? "rgba(211,47,47,0.2)"
                  : "rgba(25,118,210,0.2)",
              overflow: "hidden",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "100%",
                backgroundColor:
                  snackbar.severity === "success"
                    ? "rgba(46,125,50,0.6)"
                    : snackbar.severity === "warning"
                    ? "rgba(240,180,0,0.6)"
                    : snackbar.severity === "error"
                    ? "rgba(211,47,47,0.6)"
                    : "rgba(25,118,210,0.6)",
                transformOrigin: "left",
                animation: "snackGrow 3s linear forwards",
              },
              "@keyframes snackGrow": {
                from: { transform: "scaleX(0)" },
                to: { transform: "scaleX(1)" },
              },
            }}
          />
        </Alert>
      </Snackbar>
		</Box>
	);
}


