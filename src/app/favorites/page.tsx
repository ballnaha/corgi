'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Slide } from '@mui/material';
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
																	showSnackbar(
									`${wasFavorite ? 'นำออก' : 'เพิ่ม'} "${product.name}" ${wasFavorite ? 'จาก' : 'เข้า'} รายการโปรด`,
									wasFavorite ? 'error' : 'success'
								);
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


