export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category_name: string;
  stock: number;
  reorder_level: number;
  purchase_price: number;
  selling_price: number;
  updated_at?: string;
}

export type StockAdjustmentType = 'add' | 'reduce' | 'set';

export interface StockAdjustmentPayload {
  productId: string;
  adjustmentType: StockAdjustmentType;
  quantity: number;
  previousStock: number;
  nextStock: number;
  note?: string;
}
