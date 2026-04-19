/**
 * Test: Type System Verification
 * Checks all type definitions are correctly exported and usable
 */

import type {
  User,
  AuthState,
  Product,
  Sale,
  Expense,
  Category,
  Brand,
  Variant,
  AuditLog,
  ApiResponse,
  ApiError,
  PaginationParams,
  ButtonProps,
  InputProps,
  SelectProps,
  ModalProps,
  CardProps,
  DataTableProps,
} from '@/types';
import { Role } from '@/types';

describe('Type System Verification', () => {
  test('User types should be properly defined', () => {
    const user: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: Role.STAFF,
      createdAt: new Date().toISOString(),
    };
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('STAFF');
  });

  test('Product types should be properly defined', () => {
    const product: Product = {
      id: 1,
      name: 'Test Product',
      sku: 'SKU-001',
      categoryId: 1,
      brandId: 1,
      price: 99.99,
      stock: 10,
    };
    expect(product.price).toBe(99.99);
    expect(product.stock).toBe(10);
  });

  test('Sale types should be properly defined', () => {
    const sale: Sale = {
      id: 1,
      date: new Date().toISOString(),
      customerName: 'John Doe',
      productId: 1,
      quantity: 5,
      unitPrice: 99.99,
      totalAmount: 499.95,
    };
    expect(sale.quantity).toBe(5);
    expect(sale.totalAmount).toBe(499.95);
  });

  test('ApiResponse generic type should work', () => {
    const response: ApiResponse<Product> = {
      success: true,
      data: {
        id: 1,
        name: 'Product',
        sku: 'SKU',
        categoryId: 1,
        brandId: 1,
        price: 100,
        stock: 10,
      },
    };
    expect(response.success).toBe(true);
    expect(response.data?.name).toBe('Product');
  });

  test('UI component types should have proper props', () => {
    const buttonProps: ButtonProps = {
      variant: 'primary',
      size: 'md',
      disabled: false,
      children: 'Click me',
    };
    expect(buttonProps.variant).toBe('primary');
  });

  test('Role enum should have all values', () => {
    expect(Role.OWNER).toBe('OWNER');
    expect(Role.ACCOUNTANT).toBe('ACCOUNTANT');
    expect(Role.STAFF).toBe('STAFF');
  });
});
