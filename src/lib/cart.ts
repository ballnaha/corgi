'use client';

import { CartItem, Product } from '@/types';

const STORAGE_KEY = 'cart_items_v1';

export function readCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    // Basic validation
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(it => it && it.product && typeof it.quantity === 'number');
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function addToCartStorage(product: Product, quantity: number = 1) {
  const current = readCartFromStorage();
  const idx = current.findIndex(i => i.product.id === product.id);
  const stock = typeof product.stock === 'number' ? Math.max(0, product.stock) : 0;

  // ถ้าไม่มีสต็อก ไม่ให้เพิ่ม
  if (stock <= 0) {
    return;
  }

  if (idx >= 0) {
    const currentQty = current[idx].quantity;
    const nextQty = Math.min(currentQty + quantity, stock);
    current[idx] = { ...current[idx], quantity: nextQty };
  } else {
    const initialQty = Math.min(quantity, stock);
    if (initialQty <= 0) {
      return;
    }
    current.push({ product, quantity: initialQty });
  }

  writeCartToStorage(current);
}

export function updateQuantityInStorage(productId: string, quantity: number) {
  const current = readCartFromStorage();
  const updated = current
    .map(i => {
      if (i.product.id !== productId) return i;
      const stock = typeof i.product.stock === 'number' ? Math.max(0, i.product.stock) : 0;
      if (quantity <= 0 || stock <= 0) {
        return { ...i, quantity: 0 };
      }
      const nextQty = Math.min(quantity, stock);
      return { ...i, quantity: nextQty };
    })
    .filter(i => i.quantity > 0);
  writeCartToStorage(updated);
}

export function removeFromCartStorage(productId: string) {
  const current = readCartFromStorage();
  writeCartToStorage(current.filter(i => i.product.id !== productId));
}

