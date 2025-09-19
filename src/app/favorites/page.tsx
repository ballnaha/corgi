'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Slide, Container } from '@mui/material';
import type { SlideProps } from '@mui/material';
import { colors } from '@/theme/colors';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import { Product, CartItem } from '@/types';
import { generateSlug } from '@/lib/products';
import { readFavoriteIds, toggleFavoriteId } from '@/lib/favorites';
import { readCartFromStorage, writeCartToStorage, addToCartStorage, updateQuantityInStorage, removeFromCartStorage } from '@/lib/cart';
import { handleLiffNavigation } from '@/lib/liff-navigation';
import { useThemedSnackbar } from '@/components/ThemedSnackbar';

export default function FavoritesPage() {
	const SlideUpTransition = React.forwardRef(function SlideUpTransition(
		props: SlideProps,
		ref: React.Ref<unknown>
	) {
		return <Slide direction="up" ref={ref} {...props} />;
	});
	const router = useRouter();
	const { showSnackbar, SnackbarComponent } = useThemedSnackbar();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

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
					images?: Array<{
						id: string;
						imageUrl: string;
						altText: string | null;
						isMain: boolean;
						order: number;
					}>;
				};
				const transformed: Product[] = (data as DbProduct[]).map((p) => {
					// Get main image from images array, fallback to imageUrl
					const mainImage = p.images?.find(img => img.isMain)?.imageUrl || 
									 p.images?.[0]?.imageUrl || 
									 p.imageUrl || 
									 '';
					
					// Transform images to match ProductImage interface
					const transformedImages = p.images?.map(img => ({
						...img,
						productId: p.id,
						createdAt: new Date() // Use current date as fallback
					})) || [];
					
					return {
						...p,
						image: mainImage,
						imageUrl: mainImage,
						images: transformedImages,
						price: Number(p.price),
						salePrice: p.salePrice != null ? Number(p.salePrice) : null,
						discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
						stock: Number(p.stock ?? 0),
					};
				});
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
		let filtered = products.filter(p => idSet.has(p.id));
		
		// Filter by search query
		if (searchQuery.trim()) {
			filtered = filtered.filter(
				(product) =>
					product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
			);
		}
		
		return filtered;
	}, [products, favoriteIds, searchQuery]);

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
			showSnackbar("สินค้าหมด", "error");
			return;
		}

		if (existing && existing.quantity >= stock) {
			showSnackbar("สินค้าเกินจำนวนคงเหลือ", "warning");
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

		showSnackbar(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`, "success");
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
		showSnackbar("นำสินค้าออกจากตะกร้าแล้ว", "error");
	};

	const handleCheckout = () => {
		if (cartItems.length === 0) {
			showSnackbar("ตะกร้าสินค้าว่างเปล่า", "warning");
			return;
		}
		
		setIsCartOpen(false);
		handleLiffNavigation(router, "/checkout");
	};

	const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<Box
			sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
		>
			<Navigation />
			<Header
				cartItemCount={cartItemCount}
				onCartClick={() => setIsCartOpen(true)}
				onSearchChange={setSearchQuery}
				showLogo={true}
				logoSrc="/images/natpi_logo.png"
			/>

			<Box 
				component="main" 
				sx={{ 
					flexGrow: 1,
					backgroundColor: colors.background.default,
					minHeight: '100vh',
					pt: 8, // Space for fixed header
					pb: 2, // Reduce bottom space after removing bottom navigation
				}}
			>
				<Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 2, md: 3 } }}>
					<Box sx={{ 
						display: 'flex', 
						justifyContent: 'space-between', 
						alignItems: 'center',
						mb: 2
					}}>
						<Typography
							variant="h6"
							sx={{
								color: colors.text.primary,
								fontWeight: "bold",
								fontSize: "1.1rem",
							}}
						>
							รายการโปรด
						</Typography>
						<Typography
							variant="body2"
							sx={{ color: colors.text.secondary }}
						>
							{favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'items'}
						</Typography>
					</Box>

					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
							<CircularProgress color="primary" />
						</Box>
					) : favoriteProducts.length === 0 ? (
						<Box sx={{ textAlign: "center", py: 8, px: 2 }}>
							<Typography variant="h6" sx={{ mb: 2 }}>
								{searchQuery.trim() ? "ไม่พบสินค้า" : "ยังไม่มีสินค้าในรายการโปรด"}
							</Typography>
							<Typography variant="body1" color="text.secondary">
								{searchQuery.trim() ? "ลองเปลี่ยนคำค้นหา" : "เพิ่มสินค้าที่ชอบจากหน้าร้านค้า"}
							</Typography>
						</Box>
					) : (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { 
									xs: 'repeat(2, 1fr)', 
									sm: 'repeat(3, 1fr)', 
									md: 'repeat(4, 1fr)', 
									lg: 'repeat(4, 1fr)' 
								},
								gap: { xs: 2, md: 3 },
								mb: 10,
							}}
						>
							{favoriteProducts.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									isFavorite={favoriteIds.includes(product.id)}
									onToggleFavorite={(id) => {
										const wasFavorite = favoriteIds.includes(id);
										setFavoriteIds(toggleFavoriteId(id));
										showSnackbar(
											`${wasFavorite ? 'นำออก' : 'เพิ่ม'} "${product.name}" ${wasFavorite ? 'จาก' : 'เข้า'} รายการโปรด`,
											wasFavorite ? 'error' : 'success'
										);
									}}
									onAddToCart={() => handleAddToCart(product)}
									onProductClick={() => {
										const slug = generateSlug(product.name, product.id);
										handleLiffNavigation(router, `/product/${slug}`);
									}}
								/>
							))}
						</Box>
					)}
				</Container>
			</Box>

			
			<Cart
				items={cartItems}
				onClose={() => setIsCartOpen(false)}
				open={isCartOpen}
				onRemoveItem={handleRemoveItem}
				onUpdateQuantity={handleUpdateQuantity}
				onCheckout={handleCheckout}
			/>

      {/* Themed Snackbar */}
      <SnackbarComponent />
		</Box>
	);
}


