-- Demo promotions and customer accounts for the checkout walkthrough.
-- Safe to re-run: named promotions, users, customers, and addresses are not duplicated.
-- Demo customer password: DemoShop!2026

USE newtin1;

START TRANSACTION;

INSERT INTO promotion
    (promo_name, promo_description, discount_type, discount_value, start_date, end_date, is_active)
SELECT 'Demo Week: Clothing 15%', 'Demo discount on the demo clothing collection.',
       'PERCENTAGE', 15.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 180 DAY, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM promotion WHERE promo_name = 'Demo Week: Clothing 15%'
);

INSERT INTO promotion
    (promo_name, promo_description, discount_type, discount_value, start_date, end_date, is_active)
SELECT 'Demo Week: Accessories 12%', 'Demo discount on the demo accessories collection.',
       'PERCENTAGE', 12.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 180 DAY, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM promotion WHERE promo_name = 'Demo Week: Accessories 12%'
);

INSERT INTO promotion
    (promo_name, promo_description, discount_type, discount_value, start_date, end_date, is_active)
SELECT 'Demo Week: Skincare 10%', 'Demo discount on the demo skincare collection.',
       'PERCENTAGE', 10.00, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 180 DAY, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM promotion WHERE promo_name = 'Demo Week: Skincare 10%'
);

INSERT INTO promotion_category (promotion_id, category_id)
SELECT p.promotion_id, c.category_id
FROM promotion p
JOIN category c ON c.category_name = 'Demo Clothing'
WHERE p.promo_name = 'Demo Week: Clothing 15%'
  AND NOT EXISTS (
      SELECT 1 FROM promotion_category pc
      WHERE pc.promotion_id = p.promotion_id AND pc.category_id = c.category_id
  );

INSERT INTO promotion_category (promotion_id, category_id)
SELECT p.promotion_id, c.category_id
FROM promotion p
JOIN category c ON c.category_name = 'Demo Accessories'
WHERE p.promo_name = 'Demo Week: Accessories 12%'
  AND NOT EXISTS (
      SELECT 1 FROM promotion_category pc
      WHERE pc.promotion_id = p.promotion_id AND pc.category_id = c.category_id
  );

INSERT INTO promotion_category (promotion_id, category_id)
SELECT p.promotion_id, c.category_id
FROM promotion p
JOIN category c ON c.category_name = 'Demo Skincare'
WHERE p.promo_name = 'Demo Week: Skincare 10%'
  AND NOT EXISTS (
      SELECT 1 FROM promotion_category pc
      WHERE pc.promotion_id = p.promotion_id AND pc.category_id = c.category_id
  );

INSERT INTO sys_user
    (first_name, last_name, email, password_hash, role, is_active, email_verified)
SELECT d.first_name, d.last_name, d.email,
       '$2a$10$YgN9AnbGdUbY1M0iserCduUIZdB9q4XZIjsd7SgEuoy5qzhNTwm1G',
       'ROLE_CUSTOMER', TRUE, TRUE
FROM (
    SELECT 'Maya' AS first_name, 'Hassan' AS last_name, 'demo.buyer.01@example.test' AS email
    UNION ALL SELECT 'Omar', 'Khalil', 'demo.buyer.02@example.test'
    UNION ALL SELECT 'Lina', 'Farouk', 'demo.buyer.03@example.test'
    UNION ALL SELECT 'Youssef', 'Nabil', 'demo.buyer.04@example.test'
    UNION ALL SELECT 'Nour', 'Samir', 'demo.buyer.05@example.test'
) d
WHERE NOT EXISTS (
    SELECT 1 FROM sys_user u WHERE u.email = d.email
);

INSERT INTO customer (customer_id)
SELECT u.user_id
FROM sys_user u
WHERE u.email IN (
    'demo.buyer.01@example.test',
    'demo.buyer.02@example.test',
    'demo.buyer.03@example.test',
    'demo.buyer.04@example.test',
    'demo.buyer.05@example.test'
)
  AND u.role = 'ROLE_CUSTOMER'
  AND NOT EXISTS (
      SELECT 1 FROM customer c WHERE c.customer_id = u.user_id
  );

INSERT INTO address
    (customer_id, street, city, state, zipcode, country_code, address_type, is_default)
SELECT c.customer_id, d.street, 'Cairo', 'Cairo', d.zipcode, 'EG', 'HOME', FALSE
FROM (
    SELECT 'demo.buyer.01@example.test' AS email, '12 Demo Garden Street' AS street, '11511' AS zipcode
    UNION ALL SELECT 'demo.buyer.02@example.test', '24 Sample River Road', '11512'
    UNION ALL SELECT 'demo.buyer.03@example.test', '36 Example Palm Avenue', '11513'
    UNION ALL SELECT 'demo.buyer.04@example.test', '48 Test Market Lane', '11514'
    UNION ALL SELECT 'demo.buyer.05@example.test', '50 Demo Sunrise Street', '11515'
) d
JOIN sys_user u ON u.email = d.email
JOIN customer c ON c.customer_id = u.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM address a
    WHERE a.customer_id = c.customer_id AND a.street = d.street
);

COMMIT;
