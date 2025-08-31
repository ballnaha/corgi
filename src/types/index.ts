export interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  salePrice?: number | null;
  discountPercent?: number | null;
  image?: string; // For backward compatibility
  imageUrl?: string | null; // From database
  images?: ProductImage[]; // Multiple images from database
  category: string;
  description?: string | null;
  stock: number;
  isActive?: boolean;
  
  // Pet-specific fields
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
  age?: string | null;
  weight?: string | null;
  breed?: string | null;
  color?: string | null;
  
  // Health and certification
  vaccinated?: boolean;
  certified?: boolean;
  healthNote?: string | null;
  
  // Vaccination tracking for puppies
  birthDate?: Date | string | null;
  firstVaccineDate?: Date | string | null;
  secondVaccineDate?: Date | string | null;
  vaccineStatus?: 'NONE' | 'FIRST_DONE' | 'SECOND_DONE' | null;
  vaccineNotes?: string | null;
  
  // Location and contact
  location?: string | null;
  contactInfo?: string | null;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string | null;
  order: number;
  isMain: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  icon?: string;
  description?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string | null;
  category: BlogCategory;
  author: string;
  publishedAt: Date | string;
  updatedAt?: Date | string;
  tags?: string[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string;
}