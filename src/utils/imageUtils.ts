/**
 * Utility functions for handling image URLs in production and development
 */

/**
 * Get optimized image URL that works in both development and production
 * @param imagePath - The original image path (e.g., "/uploads/products/image.jpg")
 * @param fallbackToApi - Whether to use API route as fallback for production
 * @returns Optimized image URL
 */
export function getImageUrl(imagePath: string | null | undefined, fallbackToApi: boolean = false): string {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // For production with fallback enabled, try API route first for better reliability
  if (typeof window !== 'undefined' && fallbackToApi && process.env.NODE_ENV === 'production') {
    // Remove /uploads/ prefix and use API route
    const apiPath = normalizedPath.replace('/uploads/', 'uploads/');
    return `/api/images/${apiPath}`;
  }
  
  // For development or direct static serving, use direct path
  return normalizedPath;
}

/**
 * Get blog image URL with fallback for production
 * @param imagePath - The blog image path
 * @returns Blog image URL with production fallback
 */
export function getBlogImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/images/placeholder.png';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // In production, prefer direct static file access
  return normalizedPath;
}

/**
 * Get API fallback URL for images
 * @param imagePath - The original image path
 * @returns API route URL for serving images
 */
export function getApiImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  
  // Remove /uploads/ prefix and use API route
  const apiPath = imagePath.replace('/uploads/', 'uploads/').replace(/^\//, '');
  return `/api/images/${apiPath}`;
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

/**
 * Load image from file for cropping
 * @param file - File object
 * @returns Promise resolving to Image element
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Create cropped canvas from image
 * @param image - Source image element
 * @param crop - Crop coordinates
 * @param targetWidth - Optional target width for resizing
 * @param targetHeight - Optional target height for resizing
 * @returns Canvas element with cropped image
 */
export function createCroppedCanvas(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Use target dimensions if provided, otherwise use crop dimensions
  canvas.width = targetWidth || crop.width;
  canvas.height = targetHeight || crop.height;
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  
  return canvas;
}

/**
 * Convert canvas to file
 * @param canvas - Canvas element
 * @param fileName - Output file name
 * @param type - Output type ('jpeg' or 'png')
 * @param quality - Quality for JPEG (0-1)
 * @returns Promise resolving to File object
 */
export function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  type: 'jpeg' | 'png' = 'jpeg',
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        
        const file = new File([blob], fileName, { type: mimeType });
        resolve(file);
      },
      mimeType,
      type === 'jpeg' ? quality : undefined
    );
  });
}

/**
 * Calculate aspect ratio crop
 * @param aspectRatio - Target aspect ratio
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 * @returns Crop object
 */
export function calculateAspectRatioCrop(
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const imageAspectRatio = imageWidth / imageHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  
  if (imageAspectRatio > aspectRatio) {
    // Image is wider than target ratio
    cropHeight = imageHeight;
    cropWidth = cropHeight * aspectRatio;
  } else {
    // Image is taller than target ratio
    cropWidth = imageWidth;
    cropHeight = cropWidth / aspectRatio;
  }
  
  const x = (imageWidth - cropWidth) / 2;
  const y = (imageHeight - cropHeight) / 2;
  
  return { x, y, width: cropWidth, height: cropHeight };
}

/**
 * Check if image needs cropping
 * @param file - File object
 * @param targetAspectRatio - Target aspect ratio
 * @param tolerance - Tolerance for aspect ratio difference
 * @returns Promise resolving to boolean
 */
export async function needsCropping(
  file: File,
  targetAspectRatio: number,
  tolerance: number = 0.1
): Promise<boolean> {
  try {
    const img = await loadImageFromFile(file);
    const imageAspectRatio = img.width / img.height;
    const difference = Math.abs(imageAspectRatio - targetAspectRatio);
    return difference > tolerance;
  } catch {
    return true; // If we can't load the image, assume it needs cropping
  }
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'ไม่พบไฟล์' };
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB' };
  }
  
  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG และ WebP เท่านั้น' };
  }
  
  return { isValid: true };
}