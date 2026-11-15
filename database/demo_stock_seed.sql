-- Demo procurement seed for the [DEMO] products created by demo_product_seed.sql.
-- Adds three suppliers, three accountable staff, and receives stock for 45 of
-- the 51 demo variants. Re-running this file does not create duplicate receipts
-- or add the same received quantity a second time.
--
-- Run only after demo_product_seed.sql. This file does not create or alter schema.

START TRANSACTION;

INSERT INTO provider (provider_name, email, phone, is_active)
SELECT '[DEMO] Nile Apparel Supply', 'apparel@example.test', '+20-2-5550-1001', TRUE
WHERE NOT EXISTS (SELECT 1 FROM provider WHERE provider_name = '[DEMO] Nile Apparel Supply');
INSERT INTO provider (provider_name, email, phone, is_active)
SELECT '[DEMO] Cairo Accessories Wholesale', 'accessories@example.test', '+20-2-5550-1002', TRUE
WHERE NOT EXISTS (SELECT 1 FROM provider WHERE provider_name = '[DEMO] Cairo Accessories Wholesale');
INSERT INTO provider (provider_name, email, phone, is_active)
SELECT '[DEMO] Alexandria Beauty Trading', 'beauty@example.test', '+20-3-5550-1003', TRUE
WHERE NOT EXISTS (SELECT 1 FROM provider WHERE provider_name = '[DEMO] Alexandria Beauty Trading');

INSERT INTO accountable (accountable_name, email, phone, is_active)
SELECT '[DEMO] Mariam Hassan', 'mariam@example.test', '+20-10-5550-2001', TRUE
WHERE NOT EXISTS (SELECT 1 FROM accountable WHERE accountable_name = '[DEMO] Mariam Hassan');
INSERT INTO accountable (accountable_name, email, phone, is_active)
SELECT '[DEMO] Omar Adel', 'omar@example.test', '+20-10-5550-2002', TRUE
WHERE NOT EXISTS (SELECT 1 FROM accountable WHERE accountable_name = '[DEMO] Omar Adel');
INSERT INTO accountable (accountable_name, email, phone, is_active)
SELECT '[DEMO] Salma Nabil', 'salma@example.test', '+20-10-5550-2003', TRUE
WHERE NOT EXISTS (SELECT 1 FROM accountable WHERE accountable_name = '[DEMO] Salma Nabil');

CREATE TEMPORARY TABLE demo_stock_lines (
    reference_number VARCHAR(100) NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    accountable_name VARCHAR(200) NOT NULL,
    variant_item_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (reference_number, variant_item_id)
);

INSERT INTO demo_stock_lines
    (reference_number, provider_name, accountable_name, variant_item_id, quantity, unit_cost)
SELECT 'DEMO-STOCK-CLOTHING-01', '[DEMO] Nile Apparel Supply', '[DEMO] Mariam Hassan',
       vi.variant_item_id, 8 + MOD(vi.variant_item_id, 7),
       ROUND(GREATEST(0.01, (p.base_price + cv.price_adjustment) * 0.45), 2)
FROM product p
JOIN clothing_variant cv ON cv.product_id = p.product_id
JOIN variant_item vi ON vi.variant_item_id = cv.variant_item_id
WHERE p.product_name LIKE '[DEMO] %'
  AND p.product_name NOT IN ('[DEMO] Ribbed Long Sleeve Top', '[DEMO] Lightweight Windbreaker');

INSERT INTO demo_stock_lines
    (reference_number, provider_name, accountable_name, variant_item_id, quantity, unit_cost)
SELECT 'DEMO-STOCK-ACCESSORIES-01', '[DEMO] Cairo Accessories Wholesale', '[DEMO] Omar Adel',
       vi.variant_item_id, 8 + MOD(vi.variant_item_id, 7),
       ROUND(GREATEST(0.01, (p.base_price + av.price_adjustment) * 0.45), 2)
FROM product p
JOIN accessory_variant av ON av.product_id = p.product_id
JOIN variant_item vi ON vi.variant_item_id = av.variant_item_id
WHERE p.product_name LIKE '[DEMO] %'
  AND p.product_name NOT IN ('[DEMO] Simple Hoop Earrings', '[DEMO] Everyday Leather Belt');

INSERT INTO demo_stock_lines
    (reference_number, provider_name, accountable_name, variant_item_id, quantity, unit_cost)
SELECT 'DEMO-STOCK-SKINCARE-01', '[DEMO] Alexandria Beauty Trading', '[DEMO] Salma Nabil',
       vi.variant_item_id, 8 + MOD(vi.variant_item_id, 7),
       ROUND(GREATEST(0.01, (p.base_price + sv.price_adjustment) * 0.45), 2)
FROM product p
JOIN skincare_variant sv ON sv.product_id = p.product_id
JOIN variant_item vi ON vi.variant_item_id = sv.variant_item_id
WHERE p.product_name LIKE '[DEMO] %'
  AND p.product_name NOT IN ('[DEMO] Overnight Face Mask', '[DEMO] Hand and Nail Cream');

INSERT INTO procurement_package
    (provider_id, accountable_id, total_cost, purchase_date, reference_number, notes)
SELECT p.provider_id, a.accountable_id, SUM(s.quantity * s.unit_cost),
       '2026-11-14 09:00:00', s.reference_number,
       'Demo opening stock receipt. Quantities are seeded for storefront and admin analytics testing.'
FROM demo_stock_lines s
JOIN provider p ON p.provider_name = s.provider_name
JOIN accountable a ON a.accountable_name = s.accountable_name
GROUP BY p.provider_id, a.accountable_id, s.reference_number
HAVING NOT EXISTS (
    SELECT 1 FROM procurement_package existing
    WHERE existing.provider_id = p.provider_id
      AND existing.reference_number = s.reference_number
);

CREATE TEMPORARY TABLE demo_new_stock_lines AS
SELECT pp.package_id, s.variant_item_id, s.quantity, s.unit_cost
FROM demo_stock_lines s
JOIN provider p ON p.provider_name = s.provider_name
JOIN procurement_package pp
  ON pp.provider_id = p.provider_id AND pp.reference_number = s.reference_number
WHERE NOT EXISTS (
    SELECT 1 FROM procurement_package_item existing
    WHERE existing.package_id = pp.package_id
      AND existing.variant_item_id = s.variant_item_id
);

INSERT INTO procurement_package_item (package_id, variant_item_id, quantity, unit_cost, notes)
SELECT package_id, variant_item_id, quantity, unit_cost, 'Demo opening inventory'
FROM demo_new_stock_lines;

UPDATE variant_item vi
JOIN (
    SELECT variant_item_id, SUM(quantity) AS received_quantity
    FROM demo_new_stock_lines
    GROUP BY variant_item_id
) received ON received.variant_item_id = vi.variant_item_id
SET vi.stock_quantity = vi.stock_quantity + received.received_quantity;

DROP TEMPORARY TABLE demo_new_stock_lines;
DROP TEMPORARY TABLE demo_stock_lines;
COMMIT;
