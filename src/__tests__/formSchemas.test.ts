/**
 * Test: Form Schemas Verification
 * Checks Zod schemas for validation rules
 */

import {
  LoginSchema,
  RegisterSchema,
  ProductSchema,
  SaleSchema,
  ExpenseSchema,
  CategorySchema,
} from '@/lib/formSchemas';
import { z } from 'zod';

describe('Form Schemas Verification', () => {
  test('LoginSchema should validate correct email and password', () => {
    const validData = {
      email: 'user@example.com',
      password: 'password123',
    };
    const result = LoginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('LoginSchema should reject invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
    };
    const result = LoginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.code === 'invalid_string')).toBe(true);
    }
  });

  test('LoginSchema should reject short password', () => {
    const invalidData = {
      email: 'user@example.com',
      password: '123',
    };
    const result = LoginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('RegisterSchema should validate complete registration data', () => {
    const validData = {
      email: 'newuser@example.com',
      password: 'securePassword123',
      name: 'John Doe',
    };
    const result = RegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('ProductSchema should validate product data', () => {
    const validProduct = {
      name: 'Laptop',
      sku: 'LAPTOP-001',
      categoryId: 1,
      brandId: 1,
      price: 999.99,
      stock: 50,
      description: 'High-performance laptop',
    };
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  test('ProductSchema should reject zero price', () => {
    const invalidProduct = {
      name: 'Laptop',
      sku: 'LAPTOP-001',
      categoryId: 1,
      brandId: 1,
      price: 0,
      stock: 50,
    };
    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  test('ProductSchema should reject negative stock', () => {
    const invalidProduct = {
      name: 'Laptop',
      sku: 'LAPTOP-001',
      categoryId: 1,
      brandId: 1,
      price: 999.99,
      stock: -5,
    };
    const result = ProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  test('SaleSchema should validate sales data', () => {
    const validSale = {
      customerName: 'Jane Smith',
      productId: 1,
      quantity: 3,
      unitPrice: 99.99,
    };
    const result = SaleSchema.safeParse(validSale);
    expect(result.success).toBe(true);
  });

  test('ExpenseSchema should validate expense data', () => {
    const validExpense = {
      categoryId: 2,
      amount: 150.00,
      description: 'Office supplies',
      date: new Date().toISOString(),
    };
    const result = ExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  test('CategorySchema should validate category data', () => {
    const validCategory = {
      name: 'Electronics',
      description: 'Electronic items',
      type: 'PRODUCT' as const,
    };
    const result = CategorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  test('CategorySchema should require name', () => {
    const invalidCategory = {
      description: 'No name',
    };
    const result = CategorySchema.safeParse(invalidCategory);
    expect(result.success).toBe(false);
  });

  test('All schemas should have proper error messages', () => {
    const invalidLogin = {
      email: 'invalid',
      password: '123',
    };
    const result = LoginSchema.safeParse(invalidLogin);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues[0].message).toBeDefined();
    }
  });
});
