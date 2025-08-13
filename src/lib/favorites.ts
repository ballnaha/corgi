'use client';

const FAVORITES_KEY = 'favorite_product_ids_v1';

export function readFavoriteIds(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(FAVORITES_KEY);
		if (!raw) return [];
		const ids = JSON.parse(raw);
		return Array.isArray(ids) ? ids.filter((v) => typeof v === 'string') : [];
	} catch {
		return [];
	}
}

export function writeFavoriteIds(ids: string[]) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(new Set(ids))));
	} catch {}
}

export function toggleFavoriteId(id: string): string[] {
	const current = readFavoriteIds();
	const exists = current.includes(id);
	const next = exists ? current.filter((x) => x !== id) : [...current, id];
	writeFavoriteIds(next);
	return next;
}

export function isFavorite(id: string): boolean {
	return readFavoriteIds().includes(id);
}


