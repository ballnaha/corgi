export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[]; // Optional array for multiple images
  category: string;
  description: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}