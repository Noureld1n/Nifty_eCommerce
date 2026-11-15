-- E-commerce database schema
-- Target: MySQL 8.0.16+ (enforced CHECK constraints)
-- CLEAN INSTALL ONLY: this script DROPS and recreates database `newtin1`.
-- WARNING: running it permanently deletes every table and all data in `newtin1`.
-- Run only if you are certain that the existing `newtin1` database can be erased.

DROP DATABASE IF EXISTS newtin1;
CREATE DATABASE newtin1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE newtin1;

CREATE TABLE IF NOT EXISTS sys_user (
    user_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    phone          VARCHAR(30) NULL,
    register_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role           ENUM('ROLE_CUSTOMER', 'ROLE_ADMIN') NOT NULL DEFAULT 'ROLE_CUSTOMER',
    image          VARCHAR(2048) NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_sys_user_email (email),
    UNIQUE KEY uq_sys_user_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer (
    customer_id BIGINT UNSIGNED NOT NULL,
    points      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (customer_id),
    CONSTRAINT fk_customer_user FOREIGN KEY (customer_id)
        REFERENCES sys_user(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_customer_points CHECK (points >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sys_admin (
    admin_id  BIGINT UNSIGNED NOT NULL,
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (admin_id),
    CONSTRAINT fk_sys_admin_user FOREIGN KEY (admin_id)
        REFERENCES sys_user(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS address (
    address_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id  BIGINT UNSIGNED NOT NULL,
    street       VARCHAR(255) NOT NULL,
    city         VARCHAR(100) NOT NULL,
    state        VARCHAR(100) NULL,
    zipcode      VARCHAR(20) NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'EG',
    address_type ENUM('WORK', 'HOME', 'OTHER') NOT NULL DEFAULT 'HOME',
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    default_customer_id BIGINT UNSIGNED
        GENERATED ALWAYS AS (
            CASE WHEN is_default = TRUE THEN customer_id ELSE NULL END
        ) VIRTUAL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id),
    KEY idx_address_customer (customer_id),
    UNIQUE KEY uq_address_one_default_per_customer (default_customer_id),
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Store payment-provider tokens, not full payment card numbers or CVVs.
CREATE TABLE IF NOT EXISTS payment_method (
    payment_method_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id       BIGINT UNSIGNED NOT NULL,
    provider          VARCHAR(80) NOT NULL,
    provider_token    VARCHAR(255) NOT NULL,
    card_brand        VARCHAR(40) NULL,
    last4             CHAR(4) NULL,
    expiry_month      TINYINT UNSIGNED NULL,
    expiry_year       SMALLINT UNSIGNED NULL,
    is_default        BOOLEAN NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    default_customer_id BIGINT UNSIGNED
        GENERATED ALWAYS AS (
            CASE WHEN is_default = TRUE AND is_active = TRUE
                 THEN customer_id ELSE NULL END
        ) VIRTUAL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_method_id),
    UNIQUE KEY uq_payment_provider_token (provider, provider_token),
    UNIQUE KEY uq_payment_one_default_per_customer (default_customer_id),
    KEY idx_payment_method_customer (customer_id),
    CONSTRAINT fk_payment_method_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_payment_expiry_month
        CHECK (expiry_month IS NULL OR expiry_month BETWEEN 1 AND 12)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS category (
    category_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_name      VARCHAR(100) NOT NULL,
    parent_category_id BIGINT UNSIGNED NULL,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_category_name_parent (category_name, parent_category_id),
    KEY idx_category_parent (parent_category_id),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_category_id)
        REFERENCES category(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- External suppliers and internal procurement contacts.
CREATE TABLE IF NOT EXISTS provider (
    provider_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_name VARCHAR(200) NOT NULL,
    email         VARCHAR(255) NULL,
    phone         VARCHAR(30) NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (provider_id),
    KEY idx_provider_name (provider_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accountable (
    accountable_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    accountable_name VARCHAR(200) NOT NULL,
    email            VARCHAR(255) NULL,
    phone            VARCHAR(30) NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (accountable_id),
    KEY idx_accountable_name (accountable_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS procurement_package (
    package_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provider_id      BIGINT UNSIGNED NOT NULL,
    accountable_id   BIGINT UNSIGNED NOT NULL,
    total_cost       DECIMAL(12,2) NOT NULL,
    purchase_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100) NULL,
    notes            TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (package_id),
    UNIQUE KEY uq_procurement_reference (provider_id, reference_number),
    KEY idx_package_provider_date (provider_id, purchase_date),
    KEY idx_package_accountable_date (accountable_id, purchase_date),
    CONSTRAINT fk_package_provider FOREIGN KEY (provider_id)
        REFERENCES provider(provider_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_package_accountable FOREIGN KEY (accountable_id)
        REFERENCES accountable(accountable_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_package_total_cost CHECK (total_cost >= 0)
) ENGINE=InnoDB;

-- Product has no admin_id; admin changes are recorded in admin_action_log.
-- Product connects to its subtype; subtype-variant tables connect to variant_item.
CREATE TABLE IF NOT EXISTS product (
    product_id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id            BIGINT UNSIGNED NULL,
    product_type           ENUM('CLOTHING', 'ACCESSORY', 'SKINCARE') NOT NULL,
    product_name           VARCHAR(200) NOT NULL,
    base_price             DECIMAL(12,2) NOT NULL,
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,
    creation_date          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pro_description        VARCHAR(1000) NULL,
    details                TEXT NULL,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    KEY idx_product_category_active (category_id, is_active),
    KEY idx_product_type_active (product_type, is_active),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id)
        REFERENCES category(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_product_base_price CHECK (base_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clothing (
    product_id    BIGINT UNSIGNED NOT NULL,
    clothing_type VARCHAR(80) NOT NULL,
    material      VARCHAR(120) NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_clothing_product FOREIGN KEY (product_id)
        REFERENCES product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accessory (
    product_id     BIGINT UNSIGNED NOT NULL,
    accessory_type VARCHAR(80) NOT NULL,
    material       VARCHAR(120) NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_accessory_product FOREIGN KEY (product_id)
        REFERENCES product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skincare (
    product_id    BIGINT UNSIGNED NOT NULL,
    skincare_type VARCHAR(80) NOT NULL,
    skin_type     VARCHAR(100) NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_skincare_product FOREIGN KEY (product_id)
        REFERENCES product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Shared identity for a sellable configuration. It is reached through one of the
-- subtype-specific variant tables, not directly from product. Products without
-- customer-visible options still have one hidden "Standard" subtype variant.
CREATE TABLE IF NOT EXISTS variant_item (
    variant_item_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,
    stock_quantity         INT UNSIGNED NOT NULL DEFAULT 0,
    additional_description VARCHAR(1000) NULL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (variant_item_id),
    CONSTRAINT chk_variant_stock CHECK (stock_quantity >= 0)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS clothing_variant (
    clothing_variant_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id          BIGINT UNSIGNED NOT NULL,
    variant_item_id     BIGINT UNSIGNED NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    default_product_id  BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_default = TRUE THEN product_id ELSE NULL END) VIRTUAL,
    size                VARCHAR(30) NOT NULL,
    color               VARCHAR(60) NOT NULL,
    price_adjustment    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (clothing_variant_id),
    UNIQUE KEY uq_clothing_variant_item (variant_item_id),
    UNIQUE KEY uq_clothing_one_default_variant (default_product_id),
    UNIQUE KEY uq_clothing_configuration (product_id, size, color),
    KEY idx_clothing_variant_product (product_id),
    CONSTRAINT fk_clothing_variant_product FOREIGN KEY (product_id)
        REFERENCES clothing(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_clothing_variant_item FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accessory_variant (
    accessory_variant_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id           BIGINT UNSIGNED NOT NULL,
    variant_item_id      BIGINT UNSIGNED NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    default_product_id  BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_default = TRUE THEN product_id ELSE NULL END) VIRTUAL,
    color                VARCHAR(60) NULL,
    material             VARCHAR(120) NULL,
    price_adjustment     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (accessory_variant_id),
    UNIQUE KEY uq_accessory_variant_item (variant_item_id),
    UNIQUE KEY uq_accessory_one_default_variant (default_product_id),
    UNIQUE KEY uq_accessory_configuration (product_id, color, material),
    KEY idx_accessory_variant_product (product_id),
    CONSTRAINT fk_accessory_variant_product FOREIGN KEY (product_id)
        REFERENCES accessory(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_accessory_variant_item FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skincare_variant (
    skincare_variant_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id          BIGINT UNSIGNED NOT NULL,
    variant_item_id     BIGINT UNSIGNED NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    default_product_id  BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_default = TRUE THEN product_id ELSE NULL END) VIRTUAL,
    volume_ml           DECIMAL(10,2) NULL,
    size_label          VARCHAR(40) NULL,
    formulation         VARCHAR(120) NULL,
    price_adjustment    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (skincare_variant_id),
    UNIQUE KEY uq_skincare_variant_item (variant_item_id),
    UNIQUE KEY uq_skincare_one_default_variant (default_product_id),
    UNIQUE KEY uq_skincare_configuration
        (product_id, volume_ml, size_label, formulation),
    KEY idx_skincare_variant_product (product_id),
    CONSTRAINT fk_skincare_variant_product FOREIGN KEY (product_id)
        REFERENCES skincare(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_skincare_variant_item FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_skincare_volume CHECK (volume_ml IS NULL OR volume_ml > 0)
) ENGINE=InnoDB;

-- Mark the first variant of each product as its default. The unique generated
-- column in each subtype-variant table enforces at most one default per product.
DROP TRIGGER IF EXISTS trg_clothing_variant_set_default;
DROP TRIGGER IF EXISTS trg_accessory_variant_set_default;
DROP TRIGGER IF EXISTS trg_skincare_variant_set_default;

DELIMITER $$
CREATE TRIGGER trg_clothing_variant_set_default
BEFORE INSERT ON clothing_variant
FOR EACH ROW
BEGIN
    IF NEW.is_default = FALSE AND NOT EXISTS (
        SELECT 1 FROM clothing_variant
        WHERE product_id = NEW.product_id AND is_default = TRUE
    ) THEN
        SET NEW.is_default = TRUE;
    END IF;
END$$

CREATE TRIGGER trg_accessory_variant_set_default
BEFORE INSERT ON accessory_variant
FOR EACH ROW
BEGIN
    IF NEW.is_default = FALSE AND NOT EXISTS (
        SELECT 1 FROM accessory_variant
        WHERE product_id = NEW.product_id AND is_default = TRUE
    ) THEN
        SET NEW.is_default = TRUE;
    END IF;
END$$

CREATE TRIGGER trg_skincare_variant_set_default
BEFORE INSERT ON skincare_variant
FOR EACH ROW
BEGIN
    IF NEW.is_default = FALSE AND NOT EXISTS (
        SELECT 1 FROM skincare_variant
        WHERE product_id = NEW.product_id AND is_default = TRUE
    ) THEN
        SET NEW.is_default = TRUE;
    END IF;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS procurement_package_item (
    package_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    package_id      BIGINT UNSIGNED NOT NULL,
    variant_item_id BIGINT UNSIGNED NOT NULL,
    quantity        INT UNSIGNED NOT NULL,
    unit_cost       DECIMAL(12,2) NOT NULL,
    line_total      DECIMAL(14,2)
        GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    notes           VARCHAR(500) NULL,
    PRIMARY KEY (package_item_id),
    UNIQUE KEY uq_package_variant (package_id, variant_item_id),
    KEY idx_package_item_variant (variant_item_id),
    CONSTRAINT fk_package_item_package FOREIGN KEY (package_id)
        REFERENCES procurement_package(package_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_package_item_variant FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_package_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_package_item_unit_cost CHECK (unit_cost >= 0)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS product_image (
    image_id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    variant_item_id        BIGINT UNSIGNED NOT NULL,
    image_url              VARCHAR(2048) NOT NULL,
    alt_text               VARCHAR(255) NULL,
    display_order          INT UNSIGNED NOT NULL DEFAULT 0,
    is_main                BOOLEAN NOT NULL DEFAULT FALSE,
    main_variant_item_id   BIGINT UNSIGNED
        GENERATED ALWAYS AS (
            CASE WHEN is_main = TRUE THEN variant_item_id ELSE NULL END
        ) VIRTUAL,
    created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    UNIQUE KEY uq_variant_one_main_image (main_variant_item_id),
    KEY idx_variant_image_order (variant_item_id, display_order),
    -- Explicitly named to prevent Workbench visual mapping errors
    CONSTRAINT fk_variant_image_item FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

DROP TRIGGER IF EXISTS trg_product_image_set_main;
DELIMITER $$
CREATE TRIGGER trg_product_image_set_main
BEFORE INSERT ON product_image
FOR EACH ROW
BEGIN
    IF NEW.is_main = TRUE THEN
        IF EXISTS (
            SELECT 1
            FROM product_image
            WHERE variant_item_id = NEW.variant_item_id
              AND is_main = TRUE
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'This variant already has a main image.';
        END IF;
    ELSEIF NOT EXISTS (
        SELECT 1
        FROM product_image
        WHERE variant_item_id = NEW.variant_item_id
          AND is_main = TRUE
    ) THEN
        SET NEW.is_main = TRUE;
    END IF;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS promotion (
    promotion_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    promo_name        VARCHAR(150) NOT NULL,
    promo_description TEXT NULL,
    discount_type     ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    discount_value    DECIMAL(12,2) NOT NULL,
    start_date        DATETIME NOT NULL,
    end_date          DATETIME NOT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (promotion_id),
    KEY idx_promotion_active_dates (is_active, start_date, end_date),
    CONSTRAINT chk_promotion_discount CHECK (
        (discount_type = 'PERCENTAGE' AND discount_value > 0 AND discount_value <= 100)
        OR (discount_type = 'FIXED_AMOUNT' AND discount_value > 0)
    ),
    CONSTRAINT chk_promotion_dates CHECK (end_date > start_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS promotion_category (
    promotion_id BIGINT UNSIGNED NOT NULL,
    category_id  BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (promotion_id, category_id),
    KEY idx_promotion_category_category (category_id),
    CONSTRAINT fk_promotion_category_promotion FOREIGN KEY (promotion_id)
        REFERENCES promotion(promotion_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promotion_category_category FOREIGN KEY (category_id)
        REFERENCES category(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS promotion_product (
    promotion_id BIGINT UNSIGNED NOT NULL,
    product_id   BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (promotion_id, product_id),
    KEY idx_promotion_product_product (product_id),
    CONSTRAINT fk_promotion_product_promotion FOREIGN KEY (promotion_id)
        REFERENCES promotion(promotion_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promotion_product_product FOREIGN KEY (product_id)
        REFERENCES product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shopping_cart (
    cart_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id    BIGINT UNSIGNED NOT NULL,
    cart_status    ENUM('Active', 'Completed', 'Abandoned') NOT NULL DEFAULT 'Active',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active_customer_id BIGINT UNSIGNED
        GENERATED ALWAYS AS (
            CASE WHEN cart_status = 'Active' THEN customer_id ELSE NULL END
        ) VIRTUAL,
    PRIMARY KEY (cart_id),
    UNIQUE KEY uq_customer_one_active_cart (active_customer_id),
    KEY idx_cart_customer_status (customer_id, cart_status),
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_item (
    cart_id         BIGINT UNSIGNED NOT NULL,
    variant_item_id BIGINT UNSIGNED NOT NULL,
    quantity        INT UNSIGNED NOT NULL DEFAULT 1,
    added_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cart_id, variant_item_id),
    KEY idx_cart_item_variant (variant_item_id),
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id)
        REFERENCES shopping_cart(cart_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_item_variant FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sys_order (
    order_id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id          BIGINT UNSIGNED NOT NULL,
    total_price          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    creation_date        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    order_status         ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
    payment_status       ENUM('Pending', 'Completed', 'Failed', 'Refunded', 'Partially_Refunded') NOT NULL DEFAULT 'Pending',
    shipping_address_id  BIGINT UNSIGNED NULL,
    billing_address_id   BIGINT UNSIGNED NULL,
    currency_code        CHAR(3) NOT NULL DEFAULT 'EGP',
    PRIMARY KEY (order_id),
    KEY idx_order_customer_date (customer_id, creation_date),
    KEY idx_order_status_date (order_status, creation_date),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_shipping_address FOREIGN KEY (shipping_address_id)
        REFERENCES address(address_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_billing_address FOREIGN KEY (billing_address_id)
        REFERENCES address(address_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_order_total CHECK (total_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_item (
    order_item_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id         BIGINT UNSIGNED NOT NULL,
    variant_item_id  BIGINT UNSIGNED NOT NULL,
    quantity         INT UNSIGNED NOT NULL,
    price_at_purchase DECIMAL(12,2) NOT NULL,
    product_name_at_purchase VARCHAR(200) NOT NULL,
    variant_description_at_purchase VARCHAR(500) NULL,
    PRIMARY KEY (order_item_id),
    UNIQUE KEY uq_order_variant (order_id, variant_item_id),
    KEY idx_order_item_variant (variant_item_id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id)
        REFERENCES sys_order(order_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_item_variant FOREIGN KEY (variant_item_id)
        REFERENCES variant_item(variant_item_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_order_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (price_at_purchase >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipment (
    shipment_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id             BIGINT UNSIGNED NOT NULL,
    is_delivered         BOOLEAN NOT NULL DEFAULT FALSE,
    tracking_number      VARCHAR(150) NULL,
    carrier              VARCHAR(100) NULL,
    expected_delivery_at DATETIME NULL,
    actual_delivery_at   DATETIME NULL,
    shipment_status      ENUM('Pending', 'Preparing', 'In_Transit', 'Delivered', 'Failed', 'Returned') NOT NULL DEFAULT 'Pending',
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (shipment_id),
    UNIQUE KEY uq_shipment_order (order_id),
    UNIQUE KEY uq_shipment_tracking (tracking_number),
    CONSTRAINT fk_shipment_order FOREIGN KEY (order_id)
        REFERENCES sys_order(order_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_review (
    review_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id BIGINT UNSIGNED NOT NULL,
    product_id  BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(200) NULL,
    review_text TEXT NULL,
    rating      TINYINT UNSIGNED NOT NULL,
    recommended BOOLEAN NULL,
    review_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    UNIQUE KEY uq_customer_product_review (customer_id, product_id),
    KEY idx_review_product_date (product_id, review_date),
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_review_product FOREIGN KEY (product_id)
        REFERENCES product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wish_list (
    wish_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id  BIGINT UNSIGNED NOT NULL,
    product_id   BIGINT UNSIGNED NOT NULL,
    added_date   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wish_item_id),
    UNIQUE KEY uq_wishlist_customer_product (customer_id, product_id),
    KEY idx_wishlist_product (product_id),
    CONSTRAINT fk_wishlist_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id)
        REFERENCES product(product_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id   BIGINT UNSIGNED NOT NULL,
    feedback_text TEXT NOT NULL,
    feedback_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_satisfied  BOOLEAN NULL,
    PRIMARY KEY (feedback_id),
    KEY idx_feedback_customer_date (customer_id, feedback_date),
    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_action_log (
    action_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id           BIGINT UNSIGNED NULL,
    action_type        VARCHAR(80) NOT NULL,
    entity_type        VARCHAR(80) NOT NULL,
    entity_id          BIGINT UNSIGNED NULL,
    action_description TEXT NULL,
    old_values         JSON NULL,
    new_values         JSON NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (action_id),
    KEY idx_admin_log_admin_date (admin_id, created_at),
    KEY idx_admin_log_entity (entity_type, entity_id, created_at),
    CONSTRAINT fk_admin_log_admin FOREIGN KEY (admin_id)
        REFERENCES sys_admin(admin_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- IMPORTANT APPLICATION RULES:
-- 1. Insert product, then variant_item, then the matching subtype-variant row.
-- 2. The first subtype-variant row for a product becomes its default automatically.
-- 3. Each product must have exactly one matching subtype (clothing/accessory/skincare).
-- 4. Ensure product.product_type matches the subtype table used; enforce in service logic.
-- 5. Each variant_item must be linked to exactly one subtype-variant row; enforce in service logic.
-- 6. A product with no visible options still gets one hidden Standard variant.
-- 7. The first image for each variant becomes the main image automatically.
-- 8. When replacing a main image, unset the existing main image before setting another.
-- 9. Product creation and first-variant creation should happen in one transaction.
-- 10. Update variant_item.stock_quantity transactionally when procurement is received.

-- SELECT
--     TABLE_NAME,
--     COLUMN_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME,
--     CONSTRAINT_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = 'newtin1'
--   AND TABLE_NAME = 'product_image'
--   AND REFERENCED_TABLE_NAME IS NOT NULL;
--   
--   SHOW CREATE TABLE newtin1.product_image;
--   
-- SHOW TRIGGERS FROM newtin1
-- WHERE `Table` = 'product_image';

-- SELECT DATABASE();

-- SHOW TABLES LIKE 'product_image';

select *
from sys_user;

ALTER TABLE sys_user
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN token_version  INT NOT NULL DEFAULT 0;

-- existing test users and the seeded admin must be able to log in
UPDATE sys_user SET email_verified = TRUE where user_id =2;

CREATE TABLE IF NOT EXISTS refresh_token (
    refresh_token_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,              -- SHA-256 hex, never the raw token
    expires_at DATETIME NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (refresh_token_id),
    UNIQUE KEY uq_refresh_token_hash (token_hash),
    KEY idx_refresh_token_user (user_id),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id)
        REFERENCES sys_user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_token (
    user_token_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    token_type ENUM('VERIFY_EMAIL', 'RESET_PASSWORD') NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at    DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_token_id),
    UNIQUE KEY uq_user_token_hash (token_hash),
    KEY idx_user_token_user_type (user_id, token_type),
    CONSTRAINT fk_user_token_user FOREIGN KEY (user_id)
        REFERENCES sys_user(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

USE newtin1;

-- audit log: keep the actor, add client IP
ALTER TABLE admin_action_log DROP FOREIGN KEY fk_admin_log_admin;
ALTER TABLE admin_action_log
  ADD COLUMN ip_address VARCHAR(45) NULL AFTER new_values,
  ADD CONSTRAINT fk_admin_log_admin FOREIGN KEY (admin_id)
      REFERENCES sys_admin(admin_id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- payment tokens are case-sensitive
ALTER TABLE payment_method
  MODIFY provider_token VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;

-- audit log is append-only (run last)
CREATE TRIGGER trg_admin_log_no_update BEFORE UPDATE ON admin_action_log
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'admin_action_log is append-only';
CREATE TRIGGER trg_admin_log_no_delete BEFORE DELETE ON admin_action_log
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'admin_action_log is append-only';

use newtin1;

select *
from feedback;

select *
from payment_method;

ALTER TABLE sys_user
  ADD COLUMN failed_login_count INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL;