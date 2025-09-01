/**
 * Utility functions for handling image URLs in production and development
 */

/**
 * Get optimized image URL that works in both development and production
 * @param imagePath - The original image path (e.g., "/uploads/products/image.jpg")
 * @param fallbackToApi - Whether to use API route as fallback for production
 * @returns Optimized image URL
 */
export function getImageUrl(imagePath: string | null | undefined, fallbackToApi: boolean = true): string {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // In production, if fallbackToApi is true, use the API route
  if (typeof window !== 'undefined' && fallbackToApi && process.env.NODE_ENV === 'production') {
    // For client-side in production, try static first, fallback to API
    return normalizedPath;
  }
  
  // For development or when not using API fallback, use direct path
  return normalizedPath;
}

/**
 * Get product image URL with proper fallback handling
 * @param product - Product object with image or images array
 * @returns Main product image URL
 */
export function getProductImageUrl(product: {
  image?: string;
  imageUrl?: string | null;
  images?: Array<{ imageUrl: string; isMain?: boolean }>;
}): string {
  // Priority: main image from images array > first image > imageUrl > image
  const mainImage = product.images?.find(img => img.isMain)?.imageUrl ||
                   product.images?.[0]?.imageUrl ||
                   product.imageUrl ||
                   product.image ||
                   '';
  
  return getImageUrl(mainImage);
}

/**
 * Preload critical images for better performance
 * @param imageUrls - Array of image URLs to preload
 */
export function preloadImages(imageUrls: string[]): void {
  if (typeof window === 'undefined') return;
  
  imageUrls.forEach(url => {
    if (url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getImageUrl(url);
      document.head.appendChild(link);
    }
  });
}

/**
 * Check if image URL is valid and accessible
 * @param imageUrl - Image URL to check
 * @returns Promise resolving to boolean indicating if image is accessible
 */
export async function isImageAccessible(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  
  try {
    const response = await fetch(getImageUrl(imageUrl), { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get image dimensions from URL
 * @param imageUrl - Image URL
 * @returns Promise resolving to {width, height} or null if failed
 */
export function getImageDimensions(imageUrl: string): Promise<{width: number; height: number} | null> {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = getImageUrl(imageUrl);
  });
}