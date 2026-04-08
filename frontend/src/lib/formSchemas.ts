import { z } from 'zod';

/**
 * Auth Schemas
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

/**
 * Product Schema
 */
export const ProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.union([z.string(), z.number()]),
  brandId: z.union([z.string(), z.number()]),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive').optional(),
  stock: z.number().nonnegative('Stock cannot be negative'),
  description: z.string().optional(),
});

/**
 * Sale Schema
 */
export const SaleSchema = z.object({
  customerName: z.string().min(2, 'Customer name required'),
  productId: z.union([z.string(), z.number()]),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  notes: z.string().optional(),
});

/**
 * Expense Schema
 */
export const ExpenseSchema = z.object({
  categoryId: z.union([z.string(), z.number()]),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(2, 'Description is required'),
  date: z.string().or(z.date()),
});

/**
 * Category Schema
 */
export const CategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['PRODUCT', 'EXPENSE']).optional(),
});

/**
 * Brand Schema
 */
export const BrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  description: z.string().optional(),
});

/**
 * Variant Schema
 */
export const VariantSchema = z.object({
  productId: z.union([z.string(), z.number()]),
  name: z.string().min(1, 'Variant name required'),
  value: z.string().min(1, 'Variant value required'),
});

/**
 * User Schema
 */
export const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'VIEWER']),
});

/**
 * Type inference from schemas
 */
export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type ProductFormData = z.infer<typeof ProductSchema>;
export type SaleFormData = z.infer<typeof SaleSchema>;
export type ExpenseFormData = z.infer<typeof ExpenseSchema>;
export type CategoryFormData = z.infer<typeof CategorySchema>;
export type BrandFormData = z.infer<typeof BrandSchema>;
export type VariantFormData = z.infer<typeof VariantSchema>;
export type UserFormData = z.infer<typeof UserSchema>;
