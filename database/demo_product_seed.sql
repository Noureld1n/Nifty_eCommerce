-- Demo catalog seed: 10 products for each product type (30 total).
-- Three products have two additional variants each: one clothing item, one
-- accessory, and one skincare item. Each variant receives a main image.
--
-- Run once against the intended development database after protype2.sql has
-- created the schema. This file is intentionally separate from protype2.sql;
-- do not run the schema setup file to load this demo data.
-- Seed stock is zero. Receive inventory through Admin > Commerce > Procurement.
-- Product photos are externally hosted by images.unsplash.com.

START TRANSACTION;

INSERT INTO category (category_name, is_active)
SELECT 'Demo Clothing', TRUE
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_name = 'Demo Clothing' AND parent_category_id IS NULL);
INSERT INTO category (category_name, is_active)
SELECT 'Demo Accessories', TRUE
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_name = 'Demo Accessories' AND parent_category_id IS NULL);
INSERT INTO category (category_name, is_active)
SELECT 'Demo Skincare', TRUE
WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_name = 'Demo Skincare' AND parent_category_id IS NULL);

SET @cat_clothing = (SELECT category_id FROM category WHERE category_name = 'Demo Clothing' AND parent_category_id IS NULL ORDER BY category_id LIMIT 1);
SET @cat_accessories = (SELECT category_id FROM category WHERE category_name = 'Demo Accessories' AND parent_category_id IS NULL ORDER BY category_id LIMIT 1);
SET @cat_skincare = (SELECT category_id FROM category WHERE category_name = 'Demo Skincare' AND parent_category_id IS NULL ORDER BY category_id LIMIT 1);

-- CLOTHING (10)
INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Everyday Cotton T-Shirt', 420.00, TRUE, 'A soft everyday cotton tee with a relaxed fit.', 'A breathable cotton staple for daily wear.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'T-Shirt', 'Cotton');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Classic fit');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'White', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85', 'White cotton t-shirt', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Lightweight Zip Hoodie', 980.00, TRUE, 'A comfortable layer for cool mornings and evenings.', 'Lightweight cotton blend with a full-length zipper.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Hoodie', 'Cotton blend');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Regular fit');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Grey', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85', 'Grey zip hoodie', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Relaxed Linen Shirt', 1150.00, TRUE, 'An airy button-up shirt with a relaxed silhouette.', 'Textured linen blend, suitable for layering or warm weather.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Button-up shirt', 'Linen blend');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Long sleeve');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Sand', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85', 'Relaxed linen shirt', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Straight Leg Denim Jeans', 1390.00, TRUE, 'Classic straight-leg jeans made for everyday outfits.', 'Mid-weight denim with a timeless five-pocket design.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Jeans', 'Denim');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Straight leg');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, '32', 'Indigo', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85', 'Indigo denim jeans', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Soft Knit Cardigan', 1280.00, TRUE, 'A soft knit layer with an easy, versatile shape.', 'Lightweight knit cardigan with a button front.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Cardigan', 'Cotton knit');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Button front');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Cream', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85', 'Cream knit cardigan', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Everyday Joggers', 890.00, TRUE, 'Easy-wearing joggers with a comfortable tapered leg.', 'Soft jersey fabric with an elasticated waist.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Joggers', 'Cotton jersey');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Tapered leg');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Black', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1200&q=85', 'Black joggers', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Everyday Midi Dress', 1240.00, TRUE, 'A simple midi dress that is easy to dress up or down.', 'Comfortable drape and a clean, understated silhouette.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Midi dress', 'Viscose blend');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Sleeveless');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Olive', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85', 'Olive midi dress', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Everyday Chino Trousers', 1090.00, TRUE, 'A clean-cut trouser for work and weekends.', 'Cotton twill with a comfortable straight fit.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Chino trousers', 'Cotton twill');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Straight fit');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, '32', 'Navy', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=85', 'Navy chino trousers', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Ribbed Long Sleeve Top', 590.00, TRUE, 'A soft ribbed top that layers easily.', 'Stretch cotton blend with a close but comfortable fit.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Long sleeve top', 'Ribbed cotton blend');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Ribbed texture');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Charcoal', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85', 'Charcoal ribbed top', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_clothing, 'CLOTHING', '[DEMO] Lightweight Windbreaker', 1490.00, TRUE, 'A lightweight outer layer for breezy days.', 'Packable-feel woven fabric with a practical hood.');
SET @pid = LAST_INSERT_ID();
INSERT INTO clothing (product_id, clothing_type, material) VALUES (@pid, 'Windbreaker', 'Woven polyester');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Hooded');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, TRUE, 'M', 'Blue', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1200&q=85', 'Blue lightweight jacket', 0, TRUE);

-- CLOTHING extra variants (the first clothing product has three sizes).
SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Everyday Cotton T-Shirt' AND product_type = 'CLOTHING' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Classic fit');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, 'S', 'White', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85', 'White cotton t-shirt, size small', 0, TRUE);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Classic fit');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, 'L', 'White', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85', 'White cotton t-shirt, size large', 0, TRUE);

-- ACCESSORIES (10)
INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Canvas Everyday Tote', 390.00, TRUE, 'A sturdy carry-all for errands, books, and daily essentials.', 'Reusable cotton canvas with reinforced handles.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Tote bag', 'Canvas');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Roomy everyday size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Natural', 'Canvas', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85', 'Natural canvas tote bag', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Minimal Crossbody Bag', 890.00, TRUE, 'A compact bag for the essentials, with hands-free convenience.', 'Adjustable strap and secure top closure.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Crossbody bag', 'Vegan leather');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Adjustable strap');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Black', 'Vegan leather', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', 'Black crossbody bag', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Daily Carry Backpack', 1190.00, TRUE, 'A practical backpack with room for everyday essentials.', 'Lightweight design with adjustable shoulder straps.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Backpack', 'Recycled polyester');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'One size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Olive', 'Recycled polyester', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', 'Olive everyday backpack', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Soft Knit Beanie', 320.00, TRUE, 'A cozy knit beanie for cooler days.', 'Soft stretch knit in a simple cuffed shape.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Beanie', 'Acrylic knit');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'One size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Rust', 'Acrylic knit', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1200&q=85', 'Rust knit beanie', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Everyday Baseball Cap', 350.00, TRUE, 'A classic cap with an adjustable back strap.', 'Cotton twill construction with a curved brim.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Cap', 'Cotton twill');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Adjustable');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Navy', 'Cotton twill', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85', 'Navy baseball cap', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Classic Sunglasses', 690.00, TRUE, 'Easy-to-wear sunglasses with a timeless frame.', 'Lightweight frame with UV-protective lenses.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Sunglasses', 'Acetate');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'UV protective lenses');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Tortoise', 'Acetate', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85', 'Tortoise sunglasses', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Minimal Leather Wallet', 540.00, TRUE, 'A slim wallet designed to keep cards organized.', 'Compact profile with multiple card slots.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Wallet', 'Vegan leather');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Slim profile');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Tan', 'Vegan leather', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85', 'Tan slim wallet', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Soft Everyday Scarf', 460.00, TRUE, 'A light, soft scarf that adds an easy layer.', 'Versatile woven scarf with a subtle texture.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Scarf', 'Viscose blend');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Lightweight weave');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Sage', 'Viscose blend', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1200&q=85', 'Sage woven scarf', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Simple Hoop Earrings', 290.00, TRUE, 'Lightweight hoops for a simple everyday look.', 'Polished stainless steel; store dry when not in use.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Earrings', 'Stainless steel');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Pair');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Gold', 'Stainless steel', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85', 'Gold hoop earrings', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_accessories, 'ACCESSORY', '[DEMO] Everyday Leather Belt', 620.00, TRUE, 'A versatile belt with a clean metal buckle.', 'Classic width, suitable for everyday outfits.');
SET @pid = LAST_INSERT_ID();
INSERT INTO accessory (product_id, accessory_type, material) VALUES (@pid, 'Belt', 'Vegan leather');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Classic width');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, TRUE, 'Brown', 'Vegan leather', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85', 'Brown everyday belt', 0, TRUE);

-- ACCESSORY extra variants (the tote comes in three color/material options).
SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Canvas Everyday Tote' AND product_type = 'ACCESSORY' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Roomy everyday size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Black', 'Canvas', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85', 'Black canvas tote bag', 0, TRUE);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Roomy everyday size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Navy', 'Canvas', 25.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85', 'Navy canvas tote bag', 0, TRUE);

-- SKINCARE (10)
INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Daily Hydrating Serum', 480.00, TRUE, 'A lightweight serum for a simple daily routine.', 'Demo catalog item. Check the product label and ingredients before use.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Serum', 'All skin types');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Lightweight daily serum');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 30.00, '30 ml', 'Hydrating', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85', 'Hydrating skincare serum', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Gentle Daily Cleanser', 360.00, TRUE, 'A gentle cleanser for a fresh start to the day.', 'Demo catalog item. Review ingredient and usage information on the package.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Cleanser', 'Normal to combination');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Rinse-off cleanser');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 150.00, '150 ml', 'Gel', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=85', 'Gentle daily cleanser', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Daily Moisture Cream', 520.00, TRUE, 'A daily moisturizer with a comfortable, creamy texture.', 'Demo catalog item. Patch test and follow the instructions on the product label.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Moisturizer', 'Normal to dry');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Daily face cream');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 50.00, '50 ml', 'Cream', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1200&q=85', 'Daily moisture cream', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Mineral Face Sunscreen', 610.00, TRUE, 'A daily sunscreen for an easy morning routine.', 'Demo catalog item only. Verify SPF and directions on the product label before use.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Sunscreen', 'All skin types');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Daily sun care');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 50.00, '50 ml', 'Mineral cream', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=85', 'Daily face sunscreen', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Nourishing Body Lotion', 430.00, TRUE, 'A lightweight lotion for everyday body care.', 'Demo catalog item. Review ingredients and directions on the product label.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Body lotion', 'All skin types');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Daily body care');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 250.00, '250 ml', 'Lotion', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85', 'Nourishing body lotion', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Gentle Micellar Water', 340.00, TRUE, 'A simple cleansing step for a fresh-feeling routine.', 'Demo catalog item. Use only as directed on the product label.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Micellar water', 'All skin types');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'No-rinse cleansing water');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 200.00, '200 ml', 'Micellar', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=85', 'Micellar cleansing water', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Lightweight Face Toner', 390.00, TRUE, 'A lightweight toner to complement a daily skincare routine.', 'Demo catalog item. Review the ingredients and directions on the label.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Toner', 'Combination');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Lightweight liquid');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 150.00, '150 ml', 'Lightweight', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1200&q=85', 'Lightweight face toner', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Lip Care Balm', 180.00, TRUE, 'A compact balm for everyday lip care.', 'Demo catalog item. Check ingredients and directions on the product label.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Lip balm', 'All skin types');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Pocket-sized');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 10.00, '10 ml', 'Balm', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1200&q=85', 'Lip care balm', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Overnight Face Mask', 550.00, TRUE, 'A richer evening-care step for a simple nighttime routine.', 'Demo catalog item. Patch test and follow the package directions.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Face mask', 'Normal to dry');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Leave-on overnight mask');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 75.00, '75 ml', 'Overnight cream', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=85', 'Overnight face mask', 0, TRUE);

INSERT INTO product (category_id, product_type, product_name, base_price, is_active, pro_description, details)
VALUES (@cat_skincare, 'SKINCARE', '[DEMO] Hand and Nail Cream', 240.00, TRUE, 'A handy cream for everyday hand care.', 'Demo catalog item. Review ingredients and directions on the product label.');
SET @pid = LAST_INSERT_ID();
INSERT INTO skincare (product_id, skincare_type, skin_type) VALUES (@pid, 'Hand cream', 'All skin types');
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Travel-friendly size');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, TRUE, 60.00, '60 ml', 'Cream', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85', 'Hand and nail cream', 0, TRUE);

-- SKINCARE extra variants (the serum comes in three sizes).
SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Daily Hydrating Serum' AND product_type = 'SKINCARE' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Lightweight daily serum');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 15.00, '15 ml', 'Hydrating', -120.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85', 'Hydrating serum, 15 ml', 0, TRUE);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Lightweight daily serum');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 50.00, '50 ml', 'Hydrating', 260.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85', 'Hydrating serum, 50 ml', 0, TRUE);

-- More clothing options: five additional products now have a second size.
SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Lightweight Zip Hoodie' AND product_type = 'CLOTHING' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Regular fit');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, 'L', 'Grey', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85', 'Grey zip hoodie, large', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Relaxed Linen Shirt' AND product_type = 'CLOTHING' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Long sleeve');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, 'L', 'Sand', 50.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85', 'Sand linen shirt, large', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Straight Leg Denim Jeans' AND product_type = 'CLOTHING' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Straight leg');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, '34', 'Indigo', 50.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85', 'Indigo jeans, waist 34', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Everyday Joggers' AND product_type = 'CLOTHING' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Tapered leg');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, 'L', 'Black', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1200&q=85', 'Black joggers, large', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Everyday Midi Dress' AND product_type = 'CLOTHING' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Sleeveless');
SET @vid = LAST_INSERT_ID();
INSERT INTO clothing_variant (product_id, variant_item_id, is_default, size, color, price_adjustment) VALUES (@pid, @vid, FALSE, 'L', 'Olive', 50.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85', 'Olive midi dress, large', 0, TRUE);

-- More accessory options: five additional products now have a second color.
SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Minimal Crossbody Bag' AND product_type = 'ACCESSORY' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Adjustable strap');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Tan', 'Vegan leather', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', 'Tan crossbody bag', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Daily Carry Backpack' AND product_type = 'ACCESSORY' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'One size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Black', 'Recycled polyester', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', 'Black everyday backpack', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Soft Knit Beanie' AND product_type = 'ACCESSORY' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'One size');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Black', 'Acrylic knit', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1200&q=85', 'Black knit beanie', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Everyday Baseball Cap' AND product_type = 'ACCESSORY' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Adjustable');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Black', 'Cotton twill', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85', 'Black baseball cap', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Classic Sunglasses' AND product_type = 'ACCESSORY' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'UV protective lenses');
SET @vid = LAST_INSERT_ID();
INSERT INTO accessory_variant (product_id, variant_item_id, is_default, color, material, price_adjustment) VALUES (@pid, @vid, FALSE, 'Black', 'Acetate', 0.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85', 'Black sunglasses', 0, TRUE);

-- More skincare options: five additional products now have a second package size.
SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Gentle Daily Cleanser' AND product_type = 'SKINCARE' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Rinse-off cleanser');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 250.00, '250 ml', 'Gel', 120.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=85', 'Gentle cleanser, 250 ml', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Daily Moisture Cream' AND product_type = 'SKINCARE' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Daily face cream');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 100.00, '100 ml', 'Cream', 240.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1200&q=85', 'Moisture cream, 100 ml', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Mineral Face Sunscreen' AND product_type = 'SKINCARE' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Daily sun care');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 100.00, '100 ml', 'Mineral cream', 300.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=85', 'Face sunscreen, 100 ml', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Nourishing Body Lotion' AND product_type = 'SKINCARE' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'Daily body care');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 500.00, '500 ml', 'Lotion', 220.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85', 'Body lotion, 500 ml', 0, TRUE);

SET @pid = (SELECT product_id FROM product WHERE product_name = '[DEMO] Gentle Micellar Water' AND product_type = 'SKINCARE' ORDER BY product_id LIMIT 1);
INSERT INTO variant_item (stock_quantity, additional_description) VALUES (0, 'No-rinse cleansing water');
SET @vid = LAST_INSERT_ID();
INSERT INTO skincare_variant (product_id, variant_item_id, is_default, volume_ml, size_label, formulation, price_adjustment) VALUES (@pid, @vid, FALSE, 400.00, '400 ml', 'Micellar', 140.00);
INSERT INTO product_image (variant_item_id, image_url, alt_text, display_order, is_main) VALUES (@vid, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=85', 'Micellar water, 400 ml', 0, TRUE);

COMMIT;
