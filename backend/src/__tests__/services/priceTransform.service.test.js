/**
 * Unit Tests: Price Transform Service
 * Tests priceTransform.service.js price parsing and conversion functionality
 */

describe('Price Transform Service', () => {
  let priceTransformService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../services/priceTransform.service')];
    priceTransformService = require('../../services/priceTransform.service');
  });

  describe('transformVariant', () => {
    it('should parse variant with JSON prices', () => {
      const variant = {
        id: 1,
        variant_name: 'Galaxy S21 Black',
        prices: JSON.stringify({
          purchase_price: 600.00,
          selling_price: 999.99,
          reorder_level: 10,
        }),
      };

      const result = priceTransformService.transformVariant(variant);

      expect(result.purchase_price).toBe(600.00);
      expect(result.selling_price).toBe(999.99);
      expect(result.reorder_level).toBe(10);
    });

    it('should parse variant with object prices', () => {
      const variant = {
        id: 2,
        variant_name: 'iPhone 14 Pro',
        prices: {
          purchase_price: 800.00,
          selling_price: 1299.00,
          reorder_level: 5,
        },
      };

      const result = priceTransformService.transformVariant(variant);

      expect(result.purchase_price).toBe(800.00);
      expect(result.selling_price).toBe(1299.00);
      expect(result.reorder_level).toBe(5);
    });

    it('should handle missing price fields with defaults', () => {
      const variant = {
        id: 3,
        variant_name: 'OnePlus 10',
        prices: JSON.stringify({ selling_price: 699.00 }),
      };

      const result = priceTransformService.transformVariant(variant);

      expect(result.purchase_price).toBe(0);
      expect(result.selling_price).toBe(699.00);
      expect(result.reorder_level).toBe(0);
    });

    it('should handle invalid JSON prices gracefully', () => {
      const variant = {
        id: 4,
        variant_name: 'Invalid Variant',
        prices: 'invalid json {',
      };

      const result = priceTransformService.transformVariant(variant);

      expect(result.purchase_price).toBe(0);
      expect(result.selling_price).toBe(0);
      expect(result.reorder_level).toBe(0);
    });

    it('should return null for null variant', () => {
      const result = priceTransformService.transformVariant(null);
      expect(result).toBeNull();
    });

    it('should preserve other variant fields', () => {
      const variant = {
        id: 5,
        variant_name: 'Samsung Galaxy',
        sku: 'SKU-123',
        stock: 50,
        prices: JSON.stringify({ selling_price: 500 }),
      };

      const result = priceTransformService.transformVariant(variant);

      expect(result.id).toBe(5);
      expect(result.variant_name).toBe('Samsung Galaxy');
      expect(result.sku).toBe('SKU-123');
      expect(result.stock).toBe(50);
    });
  });

  describe('transformVariants', () => {
    it('should transform array of variants', () => {
      const variants = [
        {
          id: 1,
          variant_name: 'Model A',
          prices: JSON.stringify({ selling_price: 100 }),
        },
        {
          id: 2,
          variant_name: 'Model B',
          prices: JSON.stringify({ selling_price: 200 }),
        },
      ];

      const result = priceTransformService.transformVariants(variants);

      expect(result).toHaveLength(2);
      expect(result[0].selling_price).toBe(100);
      expect(result[1].selling_price).toBe(200);
    });

    it('should handle empty array', () => {
      const result = priceTransformService.transformVariants([]);
      expect(result).toEqual([]);
    });
  });

  describe('transformProduct', () => {
    it('should parse product with JSON prices', () => {
      const product = {
        id: 1,
        name: 'Samsung Galaxy S21',
        prices: JSON.stringify({
          purchase_price: 600,
          selling_price: 999.99,
        }),
      };

      const result = priceTransformService.transformProduct(product);

      expect(result.purchase_price).toBe(600);
      expect(result.selling_price).toBe(999.99);
    });

    it('should parse product with object prices', () => {
      const product = {
        id: 2,
        name: 'iPhone 14 Pro',
        prices: {
          purchase_price: 800,
          selling_price: 1299,
        },
      };

      const result = priceTransformService.transformProduct(product);

      expect(result.purchase_price).toBe(800);
      expect(result.selling_price).toBe(1299);
    });

    it('should handle missing price fields with defaults', () => {
      const product = {
        id: 3,
        name: 'OnePlus 10',
        prices: JSON.stringify({ selling_price: 699 }),
      };

      const result = priceTransformService.transformProduct(product);

      expect(result.purchase_price).toBe(0);
      expect(result.selling_price).toBe(699);
    });

    it('should handle invalid JSON prices gracefully', () => {
      const product = {
        id: 4,
        name: 'Invalid Product',
        prices: 'not valid json',
      };

      const result = priceTransformService.transformProduct(product);

      expect(result.purchase_price).toBe(0);
      expect(result.selling_price).toBe(0);
    });

    it('should return null for null product', () => {
      const result = priceTransformService.transformProduct(null);
      expect(result).toBeNull();
    });

    it('should preserve other product fields', () => {
      const product = {
        id: 5,
        name: 'Product Name',
        category: 'Electronics',
        stock: 100,
        prices: JSON.stringify({ selling_price: 500 }),
      };

      const result = priceTransformService.transformProduct(product);

      expect(result.id).toBe(5);
      expect(result.name).toBe('Product Name');
      expect(result.category).toBe('Electronics');
      expect(result.stock).toBe(100);
    });
  });

  describe('transformProducts', () => {
    it('should transform array of products', () => {
      const products = [
        { id: 1, name: 'Product A', prices: JSON.stringify({ selling_price: 100 }) },
        { id: 2, name: 'Product B', prices: JSON.stringify({ selling_price: 200 }) },
      ];

      const result = priceTransformService.transformProducts(products);

      expect(result).toHaveLength(2);
      expect(result[0].selling_price).toBe(100);
      expect(result[1].selling_price).toBe(200);
    });

    it('should handle empty array', () => {
      const result = priceTransformService.transformProducts([]);
      expect(result).toEqual([]);
    });
  });

  describe('packPrices', () => {
    it('should pack prices into JSON format', () => {
      const priceObj = {
        purchase_price: 600,
        selling_price: 999.99,
        reorder_level: 10,
      };

      const result = priceTransformService.packPrices(priceObj);

      expect(typeof result).toBe('string');
      
      const parsed = JSON.parse(result);
      expect(parsed.purchase_price).toBe(600);
      expect(parsed.selling_price).toBe(999.99);
      expect(parsed.reorder_level).toBe(10);
    });

    it('should use default 0 for missing fields', () => {
      const priceObj = { selling_price: 500 };

      const result = priceTransformService.packPrices(priceObj);
      const parsed = JSON.parse(result);

      expect(parsed.purchase_price).toBe(0);
      expect(parsed.selling_price).toBe(500);
      expect(parsed.reorder_level).toBe(0);
    });

    it('should handle all zero values', () => {
      const priceObj = { purchase_price: 0, selling_price: 0, reorder_level: 0 };

      const result = priceTransformService.packPrices(priceObj);
      const parsed = JSON.parse(result);

      expect(parsed.purchase_price).toBe(0);
      expect(parsed.selling_price).toBe(0);
      expect(parsed.reorder_level).toBe(0);
    });

    it('should handle decimal prices correctly', () => {
      const priceObj = {
        purchase_price: 123.45,
        selling_price: 456.78,
        reorder_level: 5.5,
      };

      const result = priceTransformService.packPrices(priceObj);
      const parsed = JSON.parse(result);

      expect(parsed.purchase_price).toBe(123.45);
      expect(parsed.selling_price).toBe(456.78);
      expect(parsed.reorder_level).toBe(5.5);
    });

    it('should be reversible with transformVariant', () => {
      const originalPrices = {
        purchase_price: 700,
        selling_price: 1199.99,
        reorder_level: 8,
      };

      const packed = priceTransformService.packPrices(originalPrices);
      const variant = { prices: packed };
      const transformed = priceTransformService.transformVariant(variant);

      expect(transformed.purchase_price).toBe(700);
      expect(transformed.selling_price).toBe(1199.99);
      expect(transformed.reorder_level).toBe(8);
    });
  });

  describe('Price Transformation Consistency', () => {
    it('should maintain profit margin calculations', () => {
      const variant = {
        prices: JSON.stringify({
          purchase_price: 100,
          selling_price: 150,
        }),
      };

      const transformed = priceTransformService.transformVariant(variant);
      const margin = ((transformed.selling_price - transformed.purchase_price) / transformed.purchase_price) * 100;

      expect(margin).toBeCloseTo(50, 1); // 50% margin
    });

    it('should handle large price values', () => {
      const product = {
        prices: JSON.stringify({
          purchase_price: 50000.99,
          selling_price: 99999.99,
        }),
      };

      const result = priceTransformService.transformProduct(product);

      expect(result.purchase_price).toBe(50000.99);
      expect(result.selling_price).toBe(99999.99);
    });
  });
});
