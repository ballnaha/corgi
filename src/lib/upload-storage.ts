/**
 * Upload Storage Utilities
 * 
 * This file provides utilities for handling file uploads in both development and production.
 * 
 * IMPORTANT NOTES FOR PRODUCTION:
 * ================================
 * 
 * 1. VERCEL / SERVERLESS DEPLOYMENTS:
 *    - File system is READ-ONLY in production
 *    - Uploaded files will NOT persist between deployments
 *    - Use external storage solutions:
 *      * AWS S3
 *      * Cloudinary
 *      * Vercel Blob Storage
 *      * UploadThing
 * 
 * 2. TRADITIONAL SERVER DEPLOYMENTS (VPS, Dedicated Server):
 *    - File uploads to public/uploads/ will work
 *    - Ensure proper permissions: chmod 755 for directories, 644 for files
 *    - Ensure uploads folder exists and is writable
 *    - Add public/uploads/ to .gitignore (already done)
 * 
 * 3. RECOMMENDED SOLUTION:
 *    - Use cloud storage (S3, Cloudinary) for production
 *    - Keep local uploads for development
 */

import fs from 'fs';
import path from 'path';

/**
 * Check if the application is running in a serverless environment
 */
export function isServerless(): boolean {
  return process.env.VERCEL === '1' || 
         process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
         process.env.NETLIFY === 'true';
}

/**
 * Get the upload directory path
 */
export function getUploadDir(subDir: 'products' | 'blog' | 'banners' | 'payment-slips' = 'products'): string {
  return path.join(process.cwd(), 'public', 'uploads', subDir);
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(subDir: 'products' | 'blog' | 'banners' | 'payment-slips' = 'products'): Promise<void> {
  const uploadDir = getUploadDir(subDir);
  
  try {
    await fs.promises.access(uploadDir);
  } catch {
    await fs.promises.mkdir(uploadDir, { recursive: true });
  }
}

/**
 * Check if local file storage is available
 */
export async function isLocalStorageAvailable(): Promise<boolean> {
  if (isServerless()) {
    console.warn('⚠️ Running in serverless environment. Local file storage is NOT recommended.');
    return false;
  }

  const testDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    await fs.promises.access(testDir, fs.constants.W_OK);
    return true;
  } catch {
    try {
      await fs.promises.mkdir(testDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('❌ Upload directory is not writable:', error);
      return false;
    }
  }
}

/**
 * Get public URL for uploaded file
 */
export function getPublicUrl(filename: string, subDir: 'products' | 'blog' | 'banners' | 'payment-slips' = 'products'): string {
  return `/uploads/${subDir}/${filename}`;
}

/**
 * Delete uploaded file
 */
export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl.startsWith('/uploads/')) {
    return false;
  }

  try {
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
    console.log(`✅ Deleted file: ${fileUrl}`);
    return true;
  } catch (error) {
    console.log(`⚠️ Could not delete file: ${fileUrl}`, error);
    return false;
  }
}

/**
 * Setup instructions for production deployment
 */
export function getProductionSetupInstructions(): string {
  return `
📦 PRODUCTION SETUP INSTRUCTIONS
================================

If deploying to VERCEL or other SERVERLESS platforms:
-----------------------------------------------------
1. Install a cloud storage solution:
   npm install @vercel/blob
   OR
   npm install cloudinary
   OR
   npm install aws-sdk

2. Update upload routes to use cloud storage instead of local files

If deploying to TRADITIONAL SERVER (VPS/Dedicated):
---------------------------------------------------
1. SSH into your server
2. Navigate to your application directory
3. Create uploads directory:
   mkdir -p public/uploads/products
   mkdir -p public/uploads/blog
   mkdir -p public/uploads/banners
   mkdir -p public/uploads/payment-slips

4. Set proper permissions:
   chmod -R 755 public/uploads
   chown -R www-data:www-data public/uploads
   (Replace www-data with your web server user)

5. Ensure .gitignore excludes uploads:
   public/uploads/*
   !public/uploads/.gitkeep

6. Add .gitkeep files to maintain folders:
   touch public/uploads/products/.gitkeep
   touch public/uploads/blog/.gitkeep
   touch public/uploads/banners/.gitkeep
   touch public/uploads/payment-slips/.gitkeep

7. Configure your web server (nginx/apache) to serve static files from public/

RECOMMENDED: Use Cloudinary for easiest setup
----------------------------------------------
1. Sign up at https://cloudinary.com (free tier available)
2. Install: npm install cloudinary
3. Add to .env:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
4. Update upload routes to use Cloudinary SDK
`;
}

/**
 * Log storage configuration info
 */
export async function logStorageInfo(): Promise<void> {
  const isServerlessEnv = isServerless();
  const isLocalAvailable = await isLocalStorageAvailable();

  console.log('\n📁 STORAGE CONFIGURATION');
  console.log('========================');
  console.log(`Environment: ${isServerlessEnv ? '☁️ Serverless' : '🖥️ Traditional Server'}`);
  console.log(`Local Storage: ${isLocalAvailable ? '✅ Available' : '❌ Not Available'}`);
  
  if (isServerlessEnv) {
    console.warn('\n⚠️ WARNING: You are running in a serverless environment!');
    console.warn('Uploaded files will NOT persist between deployments.');
    console.warn('Please use a cloud storage solution (S3, Cloudinary, Vercel Blob).\n');
  }
  
  if (!isLocalAvailable) {
    console.error('\n❌ ERROR: Upload directory is not writable!');
    console.log(getProductionSetupInstructions());
  }
}
