/**
 * Unit Tests: validation.middleware
 */

const {
  saleSchema,
  validate,
} = require('../../middleware/validation.middleware');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('validation.middleware validate()', () => {
  it('returns 400 with details for invalid schema payload', () => {
    const middleware = validate(saleSchema);
    const req = { body: { product_id: 1, quantity: -1 } };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed', details: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for a valid payload', () => {
    const middleware = validate(saleSchema);
    const req = {
      body: {
        customer_name: 'Test Customer',
        product_id: 1,
        variant_id: 2,
        selling_price: 10,
        quantity: 2,
      },
    };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({
      customer_name: 'Test Customer',
      product_id: 1,
      variant_id: 2,
      selling_price: 10,
      quantity: 2,
    });
  });
});
