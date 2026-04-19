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
  categoryId?: string | number;
  category?: string;
  expense_category_id?: string | null;
  amount: number;
  description: string;
  vendor_name?: string;
  invoice_reference?: string;
  tax_amount?: number;
  payment_method?: string;
  affects_cogs_override?: boolean;
  uploadPath?: string;
  receipt_file?: string;
  createdAt?: string;
  updatedAt?: string;
  expenseCategory?: Category;
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
  action: string;
  timestamp: string;
  username?: string;
  role?: string;
  details?: string;
  ipAddress?: string;
  userId?: string | number;
  entityType?: string;
  entityId?: string | number;
  changes?: Record<string, any>;
  user?: {
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  };
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
