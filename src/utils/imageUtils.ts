/**
 * Image utilities for cropping and resizing images
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Create a cropped canvas from an image element and crop area
 */
export const createCroppedCanvas = (
  image: HTMLImageElement,
  cropArea: CropArea,
  targetWidth: number = cropArea.width,
  targetHeight: number = cropArea.height
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to target dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Draw the cropped image
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas;
};

/**
 * Convert canvas to blob
 */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  quality: number = 0.9
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      `image/${format}`,
      quality
    );
  });
};

/**
 * Convert canvas to file
 */
export const canvasToFile = async (
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  quality: number = 0.9
): Promise<File | null> => {
  const blob = await canvasToBlob(canvas, format, quality);
  if (!blob) return null;

  return new File([blob], filename, {
    type: `image/${format}`,
    lastModified: Date.now(),
  });
};

/**
 * Load image from file
 */
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate crop area for 16:9 aspect ratio
 */
export const calculateAspectRatioCrop = (
  imageWidth: number,
  imageHeight: number,
  aspectWidth: number = 16,
  aspectHeight: number = 9
): CropArea => {
  const targetRatio = aspectWidth / aspectHeight;
  const imageRatio = imageWidth / imageHeight;

  let width, height, x, y;

  if (imageRatio > targetRatio) {
    // Image is wider than target ratio
    height = imageHeight;
    width = height * targetRatio;
    x = (imageWidth - width) / 2;
    y = 0;
  } else {
    // Image is taller than target ratio
    width = imageWidth;
    height = width / targetRatio;
    x = 0;
    y = (imageHeight - height) / 2;
  }

  return { x, y, width, height };
};

/**
 * Resize image while maintaining aspect ratio
 */
export const resizeImage = (
  image: HTMLImageElement,
  options: ResizeOptions = {}
): HTMLCanvasElement => {
  const { maxWidth = 1600, maxHeight = 900, quality = 0.9 } = options;
  
  let { width, height } = image;
  
  // Calculate new dimensions while maintaining aspect ratio
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Use image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
};

/**
 * Get image dimensions from file
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if image needs cropping for 16:9 ratio
 */
export const needsCropping = (width: number, height: number, tolerance: number = 0.1): boolean => {
  const currentRatio = width / height;
  const targetRatio = 16 / 9;
  const difference = Math.abs(currentRatio - targetRatio);
  
  return difference > tolerance;
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { isValid: false, error: 'รองรับเฉพาะไฟล์ JPEG, PNG และ WebP' };
  }

  return { isValid: true };
};
