/**
 * Business Entity Types
 */

export interface Product {
  id: string | number;
  name: string;
  sku: string;
  categoryId: string | number;
  brandId: string | number;
  price: number;
  cost?: number;
  stock: number;
  description?: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: Category;
  brand?: Brand;
  variants?: Variant[];
}

export interface Sale {
  id: string | number;
  date: string;
  customerName: string;
  productId: string | number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  invoicePath?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
}

export interface Expense {
  id: string | number;
  date: string;
  categoryId: string | number;
  amount: number;
  description: string;
  uploadPath?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: Category;
}

export interface Category {
  id: string | number;
  name: string;
  description?: string;
  type?: 'PRODUCT' | 'EXPENSE';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string | number;
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Variant {
  id: string | number;
  productId: string | number;
  name: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string | number;
  userId: string | number;
  action: string;
  entityType: string;
  entityId: string | number;
  changes?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
  user?: { name: string; email: string };
}

export interface InventoryItem {
  id: string | number;
  productId: string | number;
  currentStock: number;
  minimumStock: number;
  reorderQuantity: number;
  lastRestocked?: string;
  product?: Product;
}
