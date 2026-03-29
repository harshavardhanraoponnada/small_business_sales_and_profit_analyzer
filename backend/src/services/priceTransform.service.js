/**
 * Price transformation service
 * Converts between database format (JSON prices) and API format (individual price fields)
 */

/**
 * Parse a variant with JSON prices and expose as individual fields
 */
function transformVariant(variant) {
  if (!variant) return null;
  
  let prices = {};
  if (typeof variant.prices === 'string') {
    try {
      prices = JSON.parse(variant.prices);
    } catch (e) {
      prices = {};
    }
  } else if (typeof variant.prices === 'object') {
    prices = variant.prices;
  }
  
  return {
    ...variant,
    purchase_price: prices.purchase_price || 0,
    selling_price: prices.selling_price || 0,
    reorder_level: prices.reorder_level || 0,
  };
}

/**
 * Parse an array of variants
 */
function transformVariants(variants) {
  return variants.map(transformVariant);
}

/**
 * Parse a product with JSON prices and expose as individual fields
 */
function transformProduct(product) {
  if (!product) return null;
  
  let prices = {};
  if (typeof product.prices === 'string') {
    try {
      prices = JSON.parse(product.prices);
    } catch (e) {
      prices = {};
    }
  } else if (typeof product.prices === 'object') {
    prices = product.prices;
  }
  
  return {
    ...product,
    purchase_price: prices.purchase_price || 0,
    selling_price: prices.selling_price || 0,
  };
}

/**
 * Parse an array of products
 */
function transformProducts(products) {
  return products.map(transformProduct);
}

/**
 * Convert individual price fields back to JSON format for storage
 */
function packPrices(priceObj) {
  return JSON.stringify({
    purchase_price: priceObj.purchase_price || 0,
    selling_price: priceObj.selling_price || 0,
    reorder_level: priceObj.reorder_level || 0,
  });
}

module.exports = {
  transformVariant,
  transformVariants,
  transformProduct,
  transformProducts,
  packPrices,
};
