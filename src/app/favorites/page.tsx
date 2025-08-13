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
import { Product } from '@/types';
import { generateSlug } from '@/lib/products';
import { readFavoriteIds, toggleFavoriteId } from '@/lib/favorites';
import { addToCartStorage } from '@/lib/cart';

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
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info'; }>({ open: false, message: '', severity: 'success' });
	const [snackbarKey, setSnackbarKey] = useState<number>(0);

	useEffect(() => {
		setFavoriteIds(readFavoriteIds());
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

	const favoriteProducts = useMemo(() => {
		const idSet = new Set(favoriteIds);
		return products.filter(p => idSet.has(p.id));
	}, [products, favoriteIds]);

	return (
		<Box sx={{ minHeight: '100vh', backgroundColor: colors.background.default, display: 'flex', flexDirection: 'column' }}>
			<Navigation />
			<Header cartItemCount={0} onCartClick={() => {}} onSearchChange={() => {}} />
			<Box component="main" sx={{ px: 2, py: 3, flex: 1 }}>
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
										message: `${wasFavorite ? 'Removed' : 'Added'} "${product.name}" ${wasFavorite ? 'from' : 'to'} favorites`,
										severity: wasFavorite ? 'info' : 'success'
									});
									setSnackbarKey((k) => k + 1);
								}}
							onAddToCart={() => addToCartStorage(product, 1)}
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
			<Snackbar
				key={snackbarKey}
				open={snackbar.open}
				autoHideDuration={2500}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				TransitionComponent={SlideUpTransition}
				sx={{ pointerEvents: 'none' }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={snackbar.severity}
					variant="standard"
					icon={false}
					sx={{
						pointerEvents: 'all',
						width: 'auto',
						maxWidth: 'min(480px, calc(100vw - 32px))',
						px: 2,
						py: 1,
						borderRadius: 999,
						backgroundColor: 'rgba(225, 245, 254, 0.92)',
						color: '#09539d',
						border: '2px solid rgba(66,133,244,0.35)'
					}}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}


