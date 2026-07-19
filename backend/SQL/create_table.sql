-- =============================================================
--  Sales CRM  —  Complete Azure SQL / MS SQL Server Schema
-- =============================================================

USE SalesCRM;
GO

-- =============================================================
--  DROP TABLES (reverse dependency order)
-- =============================================================
IF OBJECT_ID('invoice_products',    'U') IS NOT NULL DROP TABLE invoice_products;
IF OBJECT_ID('invoices',            'U') IS NOT NULL DROP TABLE invoices;
IF OBJECT_ID('order_products',      'U') IS NOT NULL DROP TABLE order_products;
IF OBJECT_ID('orders',              'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('quote_products',      'U') IS NOT NULL DROP TABLE quote_products;
IF OBJECT_ID('quotes',              'U') IS NOT NULL DROP TABLE quotes;
IF OBJECT_ID('opportunity_products','U') IS NOT NULL DROP TABLE opportunity_products;
IF OBJECT_ID('opportunities',       'U') IS NOT NULL DROP TABLE opportunities;
IF OBJECT_ID('lead_competitors',    'U') IS NOT NULL DROP TABLE lead_competitors;
IF OBJECT_ID('leads',               'U') IS NOT NULL DROP TABLE leads;
IF OBJECT_ID('competitors',         'U') IS NOT NULL DROP TABLE competitors;
IF OBJECT_ID('products',            'U') IS NOT NULL DROP TABLE products;
IF OBJECT_ID('contacts',            'U') IS NOT NULL DROP TABLE contacts;
IF OBJECT_ID('accounts',            'U') IS NOT NULL DROP TABLE accounts;
IF OBJECT_ID('users',               'U') IS NOT NULL DROP TABLE users;
GO

-- =============================================================
--  USERS
-- =============================================================
CREATE TABLE users
(
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(MAX) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'Sales Representative',
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- =============================================================
--  ACCOUNTS
-- =============================================================
CREATE TABLE accounts
(
    account_id INT IDENTITY(1,1) PRIMARY KEY,
    account_name NVARCHAR(200) NOT NULL,
    industry NVARCHAR(50) CHECK (industry IN ('Technology','Manufacturing','Healthcare','Engineering','Food & Beverage','Research')),
    phone NVARCHAR(30),
    fax NVARCHAR(30),
    website NVARCHAR(255),
    street NVARCHAR(255),
    city NVARCHAR(100),
    state_province NVARCHAR(100),
    zip_postal_code NVARCHAR(20),
    country_region NVARCHAR(100),
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    annual_revenue DECIMAL(18,2),
    payment_terms NVARCHAR(20) CHECK (payment_terms IN ('Net 25','Net 50','Net 75','Net 100')),
    shipping_method NVARCHAR(50) CHECK (shipping_method IN ('Airborne','DHL','FedEx','UPS','Postal Mail','Full Load','Will Call')),
    contact_method NVARCHAR(20) CHECK (contact_method IN ('Email','Phone','Fax','Mail')),
    description NVARCHAR(MAX),
    primary_contact_id INT,
    -- FK added after contacts table
    status BIT NOT NULL DEFAULT 1,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- =============================================================
--  CONTACTS
-- =============================================================
CREATE TABLE contacts
(
    contact_id INT IDENTITY(1,1) PRIMARY KEY,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150),
    job_title NVARCHAR(150),
    phone NVARCHAR(30),
    fax NVARCHAR(30),
    gender NVARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
    address NVARCHAR(MAX),
    contact_method NVARCHAR(20) CHECK (contact_method IN ('Email','Phone','Fax','Mail')),
    description NVARCHAR(MAX),
    account_id INT REFERENCES accounts(account_id) ON DELETE SET NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Add primary_contact FK on accounts now that contacts exists
ALTER TABLE accounts
    ADD CONSTRAINT fk_accounts_primary_contact
    FOREIGN KEY (primary_contact_id) REFERENCES contacts(contact_id);
GO

-- =============================================================
--  PRODUCTS
-- =============================================================
CREATE TABLE products
(
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    product_name NVARCHAR(200) NOT NULL,
    product_code NVARCHAR(100) UNIQUE,
    valid_from DATE,
    valid_to DATE,
    description NVARCHAR(MAX),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- =============================================================
--  COMPETITORS
-- =============================================================
CREATE TABLE competitors
(
    competitor_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    website NVARCHAR(255),
    currency NVARCHAR(10) CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    street_1 NVARCHAR(255),
    street_2 NVARCHAR(255),
    street_3 NVARCHAR(255),
    city NVARCHAR(100),
    state_province NVARCHAR(100),
    zip_postal_code NVARCHAR(20),
    country_region NVARCHAR(100),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- =============================================================
--  LEADS
-- =============================================================
CREATE TABLE leads
(
    lead_id INT IDENTITY(1,1) PRIMARY KEY,
    account_id INT REFERENCES accounts(account_id)  ON DELETE SET NULL,
    primary_contact_id INT REFERENCES contacts(contact_id)  ON DELETE SET NULL,
    topic NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    payment_terms NVARCHAR(20) CHECK (payment_terms IN ('Net 25','Net 50','Net 75','Net 100')),
    shipping_method NVARCHAR(50) CHECK (shipping_method IN ('Airborne','DHL','FedEx','UPS','Postal Mail','Full Load','Will Call')),
    contact_method NVARCHAR(20) CHECK (contact_method IN ('Email','Phone','Fax','Mail')),
    rating NVARCHAR(10) CHECK (rating IN ('Hot','Warm','Cold')),
    order_type NVARCHAR(50) CHECK (order_type IN ('Item Based','Service-Maintenance Based')),
    purchase_timeframe NVARCHAR(30) CHECK (purchase_timeframe IN ('Immediate','This Quarter','Next Quarter','This Year','Unknown')),
    estimated_budget DECIMAL(18,2),
    purchase_process NVARCHAR(20) CHECK (purchase_process IN ('Individual','Committee','Unknown')),
    capture_summary NVARCHAR(MAX),
    status NVARCHAR(20) NOT NULL DEFAULT 'New' CHECK (status IN ('New','Qualified','Disqualified')),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Lead <-> Competitors (many-to-many)
CREATE TABLE lead_competitors
(
    lead_id INT NOT NULL REFERENCES leads(lead_id)              ON DELETE CASCADE,
    competitor_id INT NOT NULL REFERENCES competitors(competitor_id)  ON DELETE CASCADE,
    CONSTRAINT pk_lead_competitors PRIMARY KEY (lead_id, competitor_id)
);
GO

-- =============================================================
--  OPPORTUNITIES
-- =============================================================
CREATE TABLE opportunities
(
    opportunity_id INT IDENTITY(1,1) PRIMARY KEY,
    topic NVARCHAR(255) NOT NULL,
    account_id INT REFERENCES accounts(account_id)  ON DELETE SET NULL,
    primary_contact_id INT REFERENCES contacts(contact_id)  ON DELETE SET NULL,
    budget_amount DECIMAL(18,2),
    purchase_timeframe NVARCHAR(30) CHECK (purchase_timeframe IN ('Immediate','This Quarter','Next Quarter','This Year','Unknown')),
    purchase_process NVARCHAR(20) CHECK (purchase_process IN ('Individual','Committee','Unknown')),
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    description NVARCHAR(MAX),
    customer_need NVARCHAR(MAX),
    proposed_solution NVARCHAR(MAX),
    status NVARCHAR(20) NOT NULL DEFAULT 'New' CHECK (status IN ('New','Won','Lost')),
    detail_amount DECIMAL(18,2),
    total_discount DECIMAL(18,2) DEFAULT 0,
    total_tax DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

CREATE TABLE opportunity_products
(
    op_product_id INT IDENTITY(1,1) PRIMARY KEY,
    opportunity_id INT NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    unit_of_measure NVARCHAR(10) CHECK (unit_of_measure IN ('BAG','BOX','KG','LIT','PKT','PCS')),
    price_per_unit DECIMAL(18,2) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    amount          AS (price_per_unit * quantity) PERSISTED,
    -- computed column
    manual_discount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2)
);
GO

-- =============================================================
--  QUOTES
-- =============================================================
CREATE TABLE quotes
(
    quote_id INT IDENTITY(1,1) PRIMARY KEY,
    quote_code NVARCHAR(50) UNIQUE,
    opportunity_id INT REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    account_id INT REFERENCES accounts(account_id)          ON DELETE SET NULL,
    topic NVARCHAR(255) NOT NULL,
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    payment_terms NVARCHAR(20) CHECK (payment_terms IN ('Net 25','Net 50','Net 75','Net 100')),
    shipping_method NVARCHAR(50) CHECK (shipping_method IN ('Airborne','DHL','FedEx','UPS','Postal Mail','Full Load','Will Call')),
    -- Billing address
    bill_to_street_1 NVARCHAR(255),
    bill_to_street_2 NVARCHAR(255),
    bill_to_street_3 NVARCHAR(255),
    bill_to_city NVARCHAR(100),
    bill_to_state NVARCHAR(100),
    bill_to_zip NVARCHAR(20),
    bill_to_country NVARCHAR(100),
    -- Shipping address
    ship_to_street_1 NVARCHAR(255),
    ship_to_street_2 NVARCHAR(255),
    ship_to_street_3 NVARCHAR(255),
    ship_to_city NVARCHAR(100),
    ship_to_state NVARCHAR(100),
    ship_to_zip NVARCHAR(20),
    ship_to_country NVARCHAR(100),
    -- Totals
    detail_amount DECIMAL(18,2),
    total_discount DECIMAL(18,2) DEFAULT 0,
    total_tax DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2),
    status NVARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Won','Lost','Canceled')),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

CREATE TABLE quote_products
(
    quote_product_id INT IDENTITY(1,1) PRIMARY KEY,
    quote_id INT NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    unit_of_measure NVARCHAR(10) CHECK (unit_of_measure IN ('BAG','BOX','KG','LIT','PKT','PCS')),
    price_per_unit DECIMAL(18,2) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    amount            AS (price_per_unit * quantity) PERSISTED,
    manual_discount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2)
);
GO

-- =============================================================
--  ORDERS
-- =============================================================
CREATE TABLE orders
(
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    order_code NVARCHAR(50) UNIQUE,
    opportunity_id INT REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    account_id INT REFERENCES accounts(account_id)          ON DELETE SET NULL,
    quote_id INT REFERENCES quotes(quote_id)              ON DELETE SET NULL,
    topic NVARCHAR(255) NOT NULL,
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    requested_delivery DATE,
    payment_terms NVARCHAR(20) CHECK (payment_terms IN ('Net 25','Net 50','Net 75','Net 100')),
    shipping_method NVARCHAR(50) CHECK (shipping_method IN ('Airborne','DHL','FedEx','UPS','Postal Mail','Full Load','Will Call')),
    -- Billing address
    bill_to_street_1 NVARCHAR(255),
    bill_to_street_2 NVARCHAR(255),
    bill_to_street_3 NVARCHAR(255),
    bill_to_city NVARCHAR(100),
    bill_to_state NVARCHAR(100),
    bill_to_zip NVARCHAR(20),
    bill_to_country NVARCHAR(100),
    -- Shipping address
    ship_to_street_1 NVARCHAR(255),
    ship_to_street_2 NVARCHAR(255),
    ship_to_street_3 NVARCHAR(255),
    ship_to_city NVARCHAR(100),
    ship_to_state NVARCHAR(100),
    ship_to_zip NVARCHAR(20),
    ship_to_country NVARCHAR(100),
    -- Totals
    detail_amount DECIMAL(18,2),
    total_discount DECIMAL(18,2) DEFAULT 0,
    total_tax DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2),
    status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Submitted','Canceled','Invoiced')),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

CREATE TABLE order_products
(
    order_product_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    unit_of_measure NVARCHAR(10) CHECK (unit_of_measure IN ('BAG','BOX','KG','LIT','PKT','PCS')),
    price_per_unit DECIMAL(18,2) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    amount            AS (price_per_unit * quantity) PERSISTED,
    manual_discount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2)
);
GO

-- =============================================================
--  INVOICES
-- =============================================================
CREATE TABLE invoices
(
    invoice_id INT IDENTITY(1,1) PRIMARY KEY,
    invoice_code NVARCHAR(50) UNIQUE,
    opportunity_id INT REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    account_id INT REFERENCES accounts(account_id)          ON DELETE SET NULL,
    order_id INT REFERENCES orders(order_id)              ON DELETE SET NULL,
    topic NVARCHAR(255) NOT NULL,
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),
    due_date DATE,
    date_delivered DATE,
    payment_terms NVARCHAR(20) CHECK (payment_terms IN ('Net 25','Net 50','Net 75','Net 100')),
    shipping_method NVARCHAR(50) CHECK (shipping_method IN ('Airborne','DHL','FedEx','UPS','Postal Mail','Full Load','Will Call')),
    -- Billing address
    bill_to_street_1 NVARCHAR(255),
    bill_to_street_2 NVARCHAR(255),
    bill_to_street_3 NVARCHAR(255),
    bill_to_city NVARCHAR(100),
    bill_to_state NVARCHAR(100),
    bill_to_zip NVARCHAR(20),
    bill_to_country NVARCHAR(100),
    -- Shipping address
    ship_to_street_1 NVARCHAR(255),
    ship_to_street_2 NVARCHAR(255),
    ship_to_street_3 NVARCHAR(255),
    ship_to_city NVARCHAR(100),
    ship_to_state NVARCHAR(100),
    ship_to_zip NVARCHAR(20),
    ship_to_country NVARCHAR(100),
    -- Totals
    detail_amount DECIMAL(18,2),
    total_discount DECIMAL(18,2) DEFAULT 0,
    total_tax DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2),
    status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Paid','Canceled')),
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

CREATE TABLE invoice_products
(
    invoice_product_id INT IDENTITY(1,1) PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    unit_of_measure NVARCHAR(10) CHECK (unit_of_measure IN ('BAG','BOX','KG','LIT','PKT','PCS')),
    price_per_unit DECIMAL(18,2) NOT NULL,
    quantity DECIMAL(18,2) NOT NULL,
    amount              AS (price_per_unit * quantity) PERSISTED,
    manual_discount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2)
);
GO

-- =============================================================
--  INDEXES
-- =============================================================
CREATE INDEX idx_accounts_status          ON accounts(status);
CREATE INDEX idx_contacts_account         ON contacts(account_id);
CREATE INDEX idx_leads_account            ON leads(account_id);
CREATE INDEX idx_leads_status             ON leads(status);
CREATE INDEX idx_opportunities_account    ON opportunities(account_id);
CREATE INDEX idx_opportunities_status     ON opportunities(status);
CREATE INDEX idx_quotes_account           ON quotes(account_id);
CREATE INDEX idx_quotes_status            ON quotes(status);
CREATE INDEX idx_orders_account           ON orders(account_id);
CREATE INDEX idx_orders_status            ON orders(status);
CREATE INDEX idx_invoices_account         ON invoices(account_id);
CREATE INDEX idx_invoices_status          ON invoices(status);
GO

-- =============================================================
--  TRIGGERS  —  auto-update updated_at
-- =============================================================
-- accounts
CREATE OR ALTER TRIGGER trg_accounts_updated_at
ON accounts AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE accounts SET updated_at = SYSDATETIMEOFFSET()
    WHERE account_id IN (SELECT account_id
    FROM inserted);
END;
GO

-- contacts
CREATE OR ALTER TRIGGER trg_contacts_updated_at
ON contacts AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE contacts SET updated_at = SYSDATETIMEOFFSET()
    WHERE contact_id IN (SELECT contact_id
    FROM inserted);
END;
GO

-- products
CREATE OR ALTER TRIGGER trg_products_updated_at
ON products AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE products SET updated_at = SYSDATETIMEOFFSET()
    WHERE product_id IN (SELECT product_id
    FROM inserted);
END;
GO

-- competitors
CREATE OR ALTER TRIGGER trg_competitors_updated_at
ON competitors AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE competitors SET updated_at = SYSDATETIMEOFFSET()
    WHERE competitor_id IN (SELECT competitor_id
    FROM inserted);
END;
GO

-- leads
CREATE OR ALTER TRIGGER trg_leads_updated_at
ON leads AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE leads SET updated_at = SYSDATETIMEOFFSET()
    WHERE lead_id IN (SELECT lead_id
    FROM inserted);
END;
GO

-- opportunities
CREATE OR ALTER TRIGGER trg_opportunities_updated_at
ON opportunities AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE opportunities SET updated_at = SYSDATETIMEOFFSET()
    WHERE opportunity_id IN (SELECT opportunity_id
    FROM inserted);
END;
GO

-- quotes
CREATE OR ALTER TRIGGER trg_quotes_updated_at
ON quotes AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE quotes SET updated_at = SYSDATETIMEOFFSET()
    WHERE quote_id IN (SELECT quote_id
    FROM inserted);
END;
GO

-- orders
CREATE OR ALTER TRIGGER trg_orders_updated_at
ON orders AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE orders SET updated_at = SYSDATETIMEOFFSET()
    WHERE order_id IN (SELECT order_id
    FROM inserted);
END;
GO

-- invoices
CREATE OR ALTER TRIGGER trg_invoices_updated_at
ON invoices AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE invoices SET updated_at = SYSDATETIMEOFFSET()
    WHERE invoice_id IN (SELECT invoice_id
    FROM inserted);
END;
GO

-- =============================================================
--  SAMPLE DATA
-- ===========
-- STEP 1: Add the column if it doesn't exist yet
IF NOT EXISTS (
    SELECT 1
FROM sys.columns
WHERE object_id = OBJECT_ID('accounts')
    AND name = 'primary_contact'
)
BEGIN
    ALTER TABLE accounts
        ADD primary_contact NVARCHAR(200);
    PRINT 'Column primary_contact added.';
END
ELSE
BEGIN
    PRINT 'Column primary_contact already exists.';
END
GO

-- STEP 2: Add primary_contact_id (FK to contacts) if it doesn't exist
IF NOT EXISTS (
    SELECT 1
FROM sys.columns
WHERE object_id = OBJECT_ID('accounts')
    AND name = 'primary_contact_id'
)
BEGIN
    ALTER TABLE accounts
        ADD primary_contact_id INT NULL;
    PRINT 'Column primary_contact_id added.';
END
ELSE
BEGIN
    PRINT 'Column primary_contact_id already exists.';
END
GO

-- STEP 3: Add the FK constraint if not already present
IF NOT EXISTS (
    SELECT 1
FROM sys.foreign_keys
WHERE name = 'fk_accounts_primary_contact'
)
BEGIN
    ALTER TABLE accounts
        ADD CONSTRAINT fk_accounts_primary_contact
        FOREIGN KEY (primary_contact_id) 
        REFERENCES contacts(contact_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    PRINT 'FK constraint added.';
END
ELSE
BEGIN
    PRINT 'FK constraint already exists.';
END
GO

-- =============================================================
--  Verify the columns are present
-- =============================================================
SELECT
    c.name          AS column_name,
    t.name          AS data_type,
    c.is_nullable,
    c.max_length
FROM sys.columns c
    JOIN sys.types   t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('accounts')
    AND c.name IN ('primary_contact', 'primary_contact_id')
ORDER BY c.column_id;
GO


SELECT *
FROM accounts;

SELECT *
FROM contacts
WHERE account_id = 1

SELECT TOP 1
    *
FROM Accounts;

SELECT account_id, account_name, primary_contact_id
FROM Accounts;



ALTER TABLE accounts
ALTER COLUMN primary_contact_id INT NULL;

SELECT definition
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('accounts');


ALTER TABLE accounts
DROP CONSTRAINT fk_accounts_primary_contact;

ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_primary_contact
FOREIGN KEY (primary_contact_id)
REFERENCES contacts(contact_id)
ON DELETE SET NULL;

SELECT primary_contact_id
FROM Accounts

ALTER TABLE Accounts
ADD primary_contact_id INT NULL;

SELECT *
from leads;

ALTER TABLE leads DROP CONSTRAINT CK__leads__payment_t__619B8048;

ALTER TABLE leads ADD CONSTRAINT CK_payment_terms
CHECK (payment_terms IN ('Net 25', 'Net 50', 'Net 75', 'Net 100'));


SELECT
    opportunity_id,
    topic,
    primary_contact_id
FROM opportunities;


SELECT OBJECT_DEFINITION(OBJECT_ID('CK__opportuni__purch__2CBDA3B5'));


SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'products';

ALTER TABLE products
ADD
    unit_price DECIMAL(18,2) DEFAULT 0,
    unit_of_measure VARCHAR(50) DEFAULT 'Unit';


EXEC sp_helpconstraint opportunities;

SELECT *
FROM opportunity_products;

SELECT *
FROM opportunity_products
WHERE opportunity_id = 14;

SELECT *
FROM opportunities
ORDER BY opportunity_id DESC;

SELECT *
FROM quotes;

SELECT *
FROM opportunity_products;

SELECT *
FROM quote_products;

SELECT *
FROM order_products;

ALTER TABLE products
ADD
    list_price DECIMAL(18,2);

SELECT*
FROM invoices;

ALTER TABLE products
ADD cost_price DECIMAL(18,2);


ALTER TABLE products
ADD cost_price DECIMAL(10,2) NULL,
    unit_price DECIMAL(10,2) NULL,
    list_price DECIMAL(10,2) NULL;

ALTER TABLE products
ADD unit_of_measure NVARCHAR(50) NULL;


SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE
WHERE CONSTRAINT_NAME = 'UQ__quotes__8882C698B2F319AF';

SELECT OBJECT_DEFINITION(object_id)
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('contacts');

SELECT OBJECT_DEFINITION(OBJECT_ID('CK__leads__purchase___3AD6B8E2'));

--New lead table is created--


CREATE TABLE sales_leads
(
    lead_id INT IDENTITY(1,1) PRIMARY KEY,

    topic NVARCHAR(255) NOT NULL,

    -- Company Information
    company_name NVARCHAR(200) NOT NULL,
    industry NVARCHAR(50)
        CHECK (industry IN (
            'Technology',
            'Manufacturing',
            'Healthcare',
            'Engineering',
            'Food & Beverage',
            'Research'
        )),

    company_phone NVARCHAR(30),
    company_website NVARCHAR(255),

    street NVARCHAR(255),
    city NVARCHAR(100),
    state_province NVARCHAR(100),
    zip_postal_code NVARCHAR(20),
    country_region NVARCHAR(100),

    -- Contact Information
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,

    email NVARCHAR(150),
    job_title NVARCHAR(150),

    phone NVARCHAR(30),
    fax NVARCHAR(30),

    gender NVARCHAR(10)
        CHECK (gender IN ('Male','Female','Other')),

    -- Lead Details
    currency NVARCHAR(10) NOT NULL DEFAULT 'USD'
        CHECK (currency IN ('USD','INR','SGD','JPY','VND','MYR')),

    payment_terms NVARCHAR(20)
        CHECK (payment_terms IN (
            'Net 25',
            'Net 50',
            'Net 75',
            'Net 100'
        )),

    shipping_method NVARCHAR(50)
        CHECK (shipping_method IN (
            'Airborne',
            'DHL',
            'FedEx',
            'UPS',
            'Postal Mail',
            'Full Load',
            'Will Call'
        )),

    contact_method NVARCHAR(20)
        CHECK (contact_method IN (
            'Email',
            'Phone',
            'Fax',
            'Mail'
        )),

    rating NVARCHAR(10)
        CHECK (rating IN (
            'Hot',
            'Warm',
            'Cold'
        )),

    order_type NVARCHAR(50)
        CHECK (order_type IN (
            'Item Based',
            'Service-Maintenance Based'
        )),

    purchase_timeframe NVARCHAR(30)
        CHECK (purchase_timeframe IN (
            'Immediate',
            'This Quarter',
            'Next Quarter',
            'This Year',
            'Unknown'
        )),

    estimated_budget DECIMAL(18,2),

    purchase_process NVARCHAR(20)
        CHECK (purchase_process IN (
            'Individual',
            'Committee',
            'Unknown'
        )),

    description NVARCHAR(MAX),

    capture_summary NVARCHAR(MAX),

    status NVARCHAR(20)
        NOT NULL DEFAULT 'New'
        CHECK (status IN (
            'New',
            'Contacted',
            'Working',
            'Qualified',
            'Disqualified'
        )),

    converted_account_id INT NULL,
    converted_contact_id INT NULL,
    converted_opportunity_id INT NULL,

    converted_at DATETIMEOFFSET NULL,

    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

ALTER TABLE sales_leads
ADD CONSTRAINT FK_sales_leads_account
FOREIGN KEY (converted_account_id)
REFERENCES accounts(account_id);

ALTER TABLE sales_leads
ADD CONSTRAINT FK_sales_leads_contact
FOREIGN KEY (converted_contact_id)
REFERENCES contacts(contact_id);

ALTER TABLE sales_leads
ADD CONSTRAINT FK_sales_leads_opportunity
FOREIGN KEY (converted_opportunity_id)
REFERENCES opportunities(opportunity_id);

CREATE TABLE sales_lead_competitors
(
    lead_id INT NOT NULL,
    competitor_id INT NOT NULL,

    CONSTRAINT PK_sales_lead_competitors
        PRIMARY KEY (lead_id, competitor_id),

    CONSTRAINT FK_slc_lead
        FOREIGN KEY (lead_id)
        REFERENCES sales_leads(lead_id)
        ON DELETE CASCADE,

    CONSTRAINT FK_slc_competitor
        FOREIGN KEY (competitor_id)
        REFERENCES competitors(competitor_id)
        ON DELETE CASCADE
);


--CREATE OR ALTER TRIGGER trg_sales_leads_updated_at
/*ON sales_leads
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE sales_leads
    SET updated_at = SYSDATETIMEOFFSET()
    WHERE lead_id IN (
        SELECT lead_id FROM inserted
    );
END;
GO*/

CREATE INDEX idx_sales_leads_status
ON sales_leads(status);

CREATE INDEX idx_sales_leads_company
ON sales_leads(company_name);

CREATE INDEX idx_sales_leads_email
ON sales_leads(email);

ALTER TABLE sales_leads
DROP CONSTRAINT CK_sales_leads_status;

ALTER TABLE sales_leads
DROP CONSTRAINT sales_leads_status;

ALTER TABLE sales_leads
ADD CONSTRAINT CK_sales_leads_status
CHECK (
    status IN (
        'Active',
        'Qualified',
        'Disqualified'
    )
);

CREATE TABLE competitor_products
(
    competitor_product_id INT IDENTITY(1,1) PRIMARY KEY,

    competitor_id INT NOT NULL,

    product_id INT NOT NULL,

    competitor_product_name NVARCHAR(255),

    notes NVARCHAR(MAX),

    FOREIGN KEY (competitor_id)
        REFERENCES competitors(competitor_id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE CASCADE
);

ALTER TABLE competitors
ADD strengths NVARCHAR(MAX),
weaknesses NVARCHAR(MAX);

EXEC sp_rename 'competitors.strengths', 'strength', 'COLUMN';

EXEC sp_rename 'competitors.weaknesses', 'weakness', 'COLUMN';

CREATE TABLE opportunity_product_competitors
(
    opportunity_product_competitor_id INT IDENTITY(1,1) PRIMARY KEY,

    opportunity_id INT NOT NULL,

    product_id INT NOT NULL,

    competitor_product_id INT NOT NULL,

    FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(opportunity_id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    FOREIGN KEY (competitor_product_id)
        REFERENCES competitor_products(competitor_product_id)
);

ALTER TABLE opportunities
ADD lost_to_competitor_product_id INT NULL;

ALTER TABLE opportunities
ADD CONSTRAINT FK_Opportunity_LostCompetitor
FOREIGN KEY (lost_to_competitor_product_id)
REFERENCES competitor_products(competitor_product_id);

SELECT *
FROM opportunity_product_competitors;

SELECT *
FROM competitor_products
WHERE competitor_product_id = 1006;

ALTER TABLE users
ADD last_login DATETIMEOFFSET NULL,
    updated_at DATETIMEOFFSET NULL;

ALTER TABLE users
ADD updated_at DATETIMEOFFSET NULL;

UPDATE users
SET updated_at = SYSDATETIMEOFFSET()
WHERE updated_at IS NULL;

ALTER TABLE users
ALTER COLUMN updated_at DATETIMEOFFSET NOT NULL;

ALTER TABLE users
ADD CONSTRAINT DF_users_updated_at
DEFAULT SYSDATETIMEOFFSET() FOR updated_at;

SELECT *
FROM users;

ALTER TABLE users
ADD is_active BIT NOT NULL DEFAULT 1;

ALTER TABLE users
ADD is_active BIT NOT NULL
    CONSTRAINT DF_users_is_active DEFAULT 1;

-- Add CHECK constraint to restrict role to valid CRM values
ALTER TABLE users
ADD CONSTRAINT CK_users_role
CHECK (role IN (
    'Admin',
    'Sales Manager',
    'Sales Executive',
    'Sales Representative'
));

-- Update the default to match your app's default role
ALTER TABLE users
ADD CONSTRAINT DF_users_role
DEFAULT 'Sales Representative' FOR role;

SELECT
    c.name              AS column_name,
    t.name              AS data_type,
    c.is_nullable,
    dc.definition       AS default_value,
    cc.definition       AS check_constraint
FROM sys.columns c
    JOIN sys.types t
    ON c.user_type_id = t.user_type_id
    LEFT JOIN sys.default_constraints dc
    ON dc.parent_object_id = c.object_id
        AND dc.parent_column_id = c.column_id
    LEFT JOIN sys.check_constraints cc
    ON cc.parent_object_id = c.object_id
        AND cc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('users')
ORDER BY c.column_id;


-- Remove placeholder admin if it exists from sample data
DELETE FROM users WHERE email = 'admin@salescrm.com';

-- Insert Admin with hashed password (Admin@123)
INSERT INTO users
    (name, email, password_hash, role, is_active)
VALUES
    (
        'Admin User',
        'admin@salescrm.com',
        '$2b$10$18Qs07D6oGXKL1TMGhqPLeq8nkJRi9xRDVlrt19/8mwNA.djvaxNC',
        'Admin',
        1
);

-- Verify
SELECT user_id, name, email, role, is_active
FROM users
WHERE email = 'admin@salescrm.com';

ALTER TABLE users
ADD
    phone_number NVARCHAR(20),
    designation NVARCHAR(100),
    department NVARCHAR(100),
    employee_code NVARCHAR(50),
    manager_id INT NULL,
    profile_image NVARCHAR(500),
    password_reset_required BIT DEFAULT 0;

ALTER TABLE users
ADD
    notes NVARCHAR(MAX) NULL;

ALTER TABLE users
ADD phone NVARCHAR(20);

ALTER TABLE users
ADD reset_token NVARCHAR(255) NULL,
    reset_token_expiry DATETIME NULL;


SELECT DB_NAME() AS CurrentDatabase;

SELECT COUNT(*) AS UserCount
FROM users;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users';

ALTER TABLE users
ADD last_login DATETIME NULL;

SELECT DISTINCT status
FROM orders;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'orders';

SELECT DISTINCT status
FROM invoices;


SELECT o.order_id, o.status, i.invoice_id, i.status as invoice_status
FROM orders o
    LEFT JOIN invoices i ON i.order_id = o.order_id
ORDER BY o.order_id;

SELECT *
FROM opportunities;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'sales_leads';

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'opportunities';

SELECT *
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME = 'account_id'

ALTER TABLE users ADD updated_at DATETIMEOFFSET NULL;

SELECT *
FROM quotes
WHERE quote_id = 1002;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'accounts';

-- 1. Confirm which database and table you're actually querying
SELECT DB_NAME() AS current_db;

-- 2. See the actual current columns of the users table
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users';

-- 3. See actual current rows
SELECT *
FROM users;

-- Run this in SSMS, replacing the hash with one generated below
UPDATE users
SET password_hash = '<paste real bcrypt hash here>'
WHERE email = 'admin@salescrm.com';

UPDATE users
SET password_hash = '$2b$10$L/MrfpqN6KXZz7yMqhjVIeK5rcNl/7mJufmGaE0rzfaiMJwm9Fs4O'
WHERE email = 'admin@salescrm.com';

SELECT definition
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('contacts');

-- Procedure Trigger and Views
CREATE PROCEDURE sp_CreateSalesLead
    (
    @topic NVARCHAR(255),
    @company_name NVARCHAR(255),
    @industry NVARCHAR(100),
    @company_phone NVARCHAR(50),
    @company_website NVARCHAR(255),

    @street NVARCHAR(255),
    @city NVARCHAR(100),
    @state_province NVARCHAR(100),
    @zip_postal_code NVARCHAR(50),
    @country_region NVARCHAR(100),

    @first_name NVARCHAR(100),
    @last_name NVARCHAR(100),
    @email NVARCHAR(255),
    @job_title NVARCHAR(100),
    @phone NVARCHAR(50),
    @fax NVARCHAR(50),
    @gender NVARCHAR(20),

    @currency NVARCHAR(20),
    @payment_terms NVARCHAR(100),
    @shipping_method NVARCHAR(100),
    @contact_method NVARCHAR(100),

    @rating NVARCHAR(50),
    @order_type NVARCHAR(100),
    @purchase_timeframe NVARCHAR(100),
    @estimated_budget DECIMAL(18,2),

    @purchase_process NVARCHAR(MAX),
    @description NVARCHAR(MAX),
    @capture_summary NVARCHAR(MAX),

    @status NVARCHAR(50)
)
AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO sales_leads
        (
        topic,

        company_name,
        industry,
        company_phone,
        company_website,

        street,
        city,
        state_province,
        zip_postal_code,
        country_region,

        first_name,
        last_name,
        email,
        job_title,
        phone,
        fax,
        gender,

        currency,
        payment_terms,
        shipping_method,
        contact_method,

        rating,
        order_type,
        purchase_timeframe,
        estimated_budget,
        purchase_process,

        description,
        capture_summary,

        status
        )
    OUTPUT
    INSERTED.lead_id
    VALUES
        (
            @topic,

            @company_name,
            @industry,
            @company_phone,
            @company_website,

            @street,
            @city,
            @state_province,
            @zip_postal_code,
            @country_region,

            @first_name,
            @last_name,
            @email,
            @job_title,
            @phone,
            @fax,
            @gender,

            @currency,
            @payment_terms,
            @shipping_method,
            @contact_method,

            @rating,
            @order_type,
            @purchase_timeframe,
            @estimated_budget,
            @purchase_process,

            @description,
            @capture_summary,

            @status
    );

END;


CREATE PROCEDURE sp_AddLeadCompetitor
    (
    @lead_id INT,
    @competitor_id INT
)
AS
BEGIN

    INSERT INTO sales_lead_competitors
        (
        lead_id,
        competitor_id
        )
    VALUES
        (
            @lead_id,
            @competitor_id
    );

END


CREATE VIEW vw_SalesLeadList
AS
    SELECT
        lead_id,
        topic,
        company_name,
        first_name,
        last_name,
        email,
        phone,
        status,
        estimated_budget,
        created_at
    FROM sales_leads;


CREATE PROCEDURE sp_GetSalesLeadById
    (
    @leadId INT
)
AS
BEGIN
    SELECT *
    FROM sales_leads
    WHERE lead_id = @leadId
END

CREATE PROCEDURE sp_GetLeadCompetitors
    (
    @leadId INT
)
AS
BEGIN
    SELECT competitor_id
    FROM sales_lead_competitors
    WHERE lead_id = @leadId
END

CREATE PROCEDURE sp_DeleteLeadCompetitors
    (
    @leadId INT
)
AS
BEGIN

    DELETE FROM sales_lead_competitors
    WHERE lead_id = @leadId

END


CREATE PROCEDURE sp_DeleteLead
    (
    @leadId INT
)
AS
BEGIN

    DELETE FROM sales_leads
    WHERE lead_id = @leadId

END

CREATE TABLE LeadAudit
(
    audit_id INT IDENTITY(1,1),
    lead_id INT,
    old_status NVARCHAR(50),
    new_status NVARCHAR(50),
    changed_at DATETIME DEFAULT GETDATE()
);

CREATE TRIGGER trg_LeadStatusAudit
ON sales_leads
AFTER UPDATE
AS
BEGIN

    INSERT INTO LeadAudit
        (
        lead_id,
        old_status,
        new_status
        )
    SELECT
        d.lead_id,
        d.status,
        i.status
    FROM deleted d
        JOIN inserted i
        ON d.lead_id = i.lead_id
    WHERE d.status <> i.status

END

CREATE TABLE LeadDeleteAudit
(
    audit_id INT IDENTITY(1,1),
    lead_id INT,
    deleted_at DATETIME DEFAULT GETDATE()
);




CREATE PROCEDURE sp_QualifyLead
    (
    @leadId INT
)
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        DECLARE @accountId INT;
        DECLARE @contactId INT;
        DECLARE @opportunityId INT;

        IF NOT EXISTS
        (
            SELECT 1
    FROM sales_leads
    WHERE lead_id = @leadId
        )
        BEGIN
        RAISERROR('Lead not found',16,1);
    END

        IF EXISTS
        (
            SELECT 1
    FROM sales_leads
    WHERE lead_id = @leadId
        AND status = 'Qualified'
        )
        BEGIN
        RAISERROR('Lead already qualified',16,1);
    END

        ------------------------------------------------
        -- Create Account
        ------------------------------------------------

        INSERT INTO accounts
        (
        account_name,
        industry,
        phone,
        website,

        street,
        city,
        state_province,
        zip_postal_code,
        country_region,

        currency,
        payment_terms,
        shipping_method,
        contact_method,

        description
        )

    SELECT
        company_name,
        industry,
        company_phone,
        company_website,

        street,
        city,
        state_province,
        zip_postal_code,
        country_region,

        currency,
        payment_terms,
        shipping_method,
        contact_method,

        description

    FROM sales_leads
    WHERE lead_id = @leadId;

        SET @accountId = SCOPE_IDENTITY();

        ------------------------------------------------
        -- Create Contact
        ------------------------------------------------

        INSERT INTO contacts
        (
        first_name,
        last_name,
        email,
        job_title,

        phone,
        fax,
        gender,

        contact_method,
        description,

        account_id
        )

    SELECT
        first_name,
        last_name,
        email,
        job_title,

        phone,
        fax,
        gender,

        contact_method,
        description,

        @accountId

    FROM sales_leads
    WHERE lead_id = @leadId;

        SET @contactId = SCOPE_IDENTITY();

        ------------------------------------------------
        -- Update Account
        ------------------------------------------------

        UPDATE accounts
        SET primary_contact_id = @contactId
        WHERE account_id = @accountId;

        ------------------------------------------------
        -- Create Opportunity
        ------------------------------------------------

        INSERT INTO opportunities
        (
        topic,

        account_id,
        primary_contact_id,

        budget_amount,

        purchase_timeframe,
        purchase_process,

        currency,

        description,
        customer_need
        )

    SELECT
        topic,

        @accountId,
        @contactId,

        estimated_budget,

        purchase_timeframe,
        purchase_process,

        currency,

        description,
        capture_summary

    FROM sales_leads
    WHERE lead_id = @leadId;

        SET @opportunityId = SCOPE_IDENTITY();

        ------------------------------------------------
        -- Update Lead
        ------------------------------------------------

        UPDATE sales_leads
        SET
            status = 'Qualified',

            converted_account_id = @accountId,
            converted_contact_id = @contactId,
            converted_opportunity_id = @opportunityId,

            converted_at = SYSDATETIMEOFFSET()

        WHERE lead_id = @leadId;

        COMMIT TRANSACTION;

        SELECT
        @accountId AS account_id,
        @contactId AS contact_id,
        @opportunityId AS opportunity_id;
    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO


CREATE PROCEDURE sp_CheckLeadExists
    (
    @leadId INT
)
AS
BEGIN

    SELECT lead_id
    FROM sales_leads
    WHERE lead_id = @leadId

END

CREATE VIEW vw_AccountList
AS
SELECT
    a.account_id,
    a.account_name,
    a.industry,
    a.phone,
    a.website,
    a.currency,
    a.annual_revenue,
    a.status,
    a.primary_contact_id,

    CONCAT(c.first_name, ' ', c.last_name) AS primary_contact_name

FROM Accounts a
LEFT JOIN Contacts c
    ON a.primary_contact_id = c.contact_id;
GO


CREATE PROCEDURE sp_GetAllAccounts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_AccountList
    ORDER BY account_id DESC;
END
GO


CREATE PROCEDURE sp_GetAccountById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.*,
        CONCAT(c.first_name,' ',c.last_name) AS primary_contact
    FROM Accounts a
    LEFT JOIN Contacts c
        ON a.primary_contact_id = c.contact_id
    WHERE a.account_id = @id;
END
GO

CREATE PROCEDURE sp_CreateAccount

    @account_name NVARCHAR(255),
    @industry NVARCHAR(100)=NULL,
    @phone NVARCHAR(50)=NULL,
    @fax NVARCHAR(50)=NULL,
    @website NVARCHAR(255)=NULL,
    @street NVARCHAR(255)=NULL,
    @city NVARCHAR(100)=NULL,
    @state_province NVARCHAR(100)=NULL,
    @zip_postal_code NVARCHAR(20)=NULL,
    @country_region NVARCHAR(100)=NULL,
    @currency NVARCHAR(10)=NULL,
    @annual_revenue DECIMAL(18,2)=0,
    @payment_terms NVARCHAR(100)=NULL,
    @shipping_method NVARCHAR(100)=NULL,
    @contact_method NVARCHAR(100)=NULL,
    @description NVARCHAR(MAX)=NULL,
    @primary_contact_id INT=NULL,
    @status BIT=1

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO Accounts(
        account_name,
        industry,
        phone,
        fax,
        website,
        street,
        city,
        state_province,
        zip_postal_code,
        country_region,
        currency,
        annual_revenue,
        payment_terms,
        shipping_method,
        contact_method,
        description,
        primary_contact_id,
        status
    )

    OUTPUT INSERTED.account_id

    VALUES(
        @account_name,
        @industry,
        @phone,
        @fax,
        @website,
        @street,
        @city,
        @state_province,
        @zip_postal_code,
        @country_region,
        @currency,
        @annual_revenue,
        @payment_terms,
        @shipping_method,
        @contact_method,
        @description,
        @primary_contact_id,
        @status
    );

END
GO


CREATE PROCEDURE sp_UpdateAccount

    @id INT,

    @account_name NVARCHAR(255),
    @industry NVARCHAR(100),
    @phone NVARCHAR(50),
    @fax NVARCHAR(50),
    @website NVARCHAR(255),
    @street NVARCHAR(255),
    @city NVARCHAR(100),
    @state_province NVARCHAR(100),
    @zip_postal_code NVARCHAR(20),
    @country_region NVARCHAR(100),
    @currency NVARCHAR(10),
    @annual_revenue DECIMAL(18,2),
    @payment_terms NVARCHAR(100),
    @shipping_method NVARCHAR(100),
    @contact_method NVARCHAR(100),
    @description NVARCHAR(MAX),
    @primary_contact_id INT,
    @status BIT

AS
BEGIN

    SET NOCOUNT ON;

    UPDATE Accounts
    SET
        account_name = @account_name,
        industry = @industry,
        phone = @phone,
        fax = @fax,
        website = @website,
        street = @street,
        city = @city,
        state_province = @state_province,
        zip_postal_code = @zip_postal_code,
        country_region = @country_region,
        currency = @currency,
        annual_revenue = @annual_revenue,
        payment_terms = @payment_terms,
        shipping_method = @shipping_method,
        contact_method = @contact_method,
        description = @description,
        primary_contact_id = @primary_contact_id,
        status = @status
    WHERE account_id = @id;

END
GO


CREATE PROCEDURE sp_DeleteAccount
    @id INT
AS
BEGIN

    DELETE FROM Accounts
    WHERE account_id = @id;

END
GO

CREATE PROCEDURE sp_UpdateContactAccount
    @contact_id INT,
    @account_id INT
AS
BEGIN

    UPDATE Contacts
    SET account_id = @account_id
    WHERE contact_id = @contact_id;

END
GO

CREATE TRIGGER trg_AccountUpdated
ON Accounts
AFTER UPDATE
AS
BEGIN

    UPDATE Accounts
    SET updated_at = SYSDATETIMEOFFSET()
    WHERE account_id IN (
        SELECT account_id
        FROM inserted
    );

END
GO


CREATE PROCEDURE sp_GetCustomer360
    @accountId INT
AS
BEGIN
    SET NOCOUNT ON;

    ---------------------------------------------------
    -- 1. Account
    ---------------------------------------------------
    SELECT *
    FROM Accounts
    WHERE account_id = @accountId;

    ---------------------------------------------------
    -- 2. Primary Contact
    ---------------------------------------------------
    SELECT
        c.contact_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.job_title
    FROM Accounts a
    INNER JOIN Contacts c
        ON a.primary_contact_id = c.contact_id
    WHERE a.account_id = @accountId;

    ---------------------------------------------------
    -- 3. Contacts
    ---------------------------------------------------
    SELECT *
    FROM Contacts
    WHERE account_id = @accountId;

    ---------------------------------------------------
    -- 4. Opportunities
    ---------------------------------------------------
    SELECT
        o.*,
        CONCAT(c.first_name,' ',c.last_name)
            AS primary_contact_name
    FROM Opportunities o
    LEFT JOIN Contacts c
        ON o.primary_contact_id = c.contact_id
    WHERE o.account_id = @accountId;

    ---------------------------------------------------
    -- 5. Quotes
    ---------------------------------------------------
    SELECT *
    FROM Quotes
    WHERE account_id = @accountId;

    ---------------------------------------------------
    -- 6. Orders
    ---------------------------------------------------
    SELECT
        o.*,
        q.quote_code AS linked_quote_code
    FROM Orders o
    LEFT JOIN Quotes q
        ON o.quote_id = q.quote_id
    WHERE o.account_id = @accountId;

    ---------------------------------------------------
    -- 7. Invoices
    ---------------------------------------------------
    SELECT
        i.*,
        o.order_code AS linked_order_code
    FROM Invoices i
    LEFT JOIN Orders o
        ON i.order_id = o.order_id
    WHERE i.account_id = @accountId;

    ---------------------------------------------------
    -- 8. Revenue
    ---------------------------------------------------
    SELECT
        ISNULL(SUM(total_amount),0) AS revenue
    FROM Invoices
    WHERE account_id = @accountId
      AND status <> 'Canceled';

    ---------------------------------------------------
    -- 9. Last Activity
    ---------------------------------------------------
    SELECT
        MAX(activity_date) AS last_activity
    FROM
    (
        SELECT created_at AS activity_date
        FROM Opportunities
        WHERE account_id = @accountId

        UNION ALL

        SELECT created_at
        FROM Quotes
        WHERE account_id = @accountId

        UNION ALL

        SELECT created_at
        FROM Orders
        WHERE account_id = @accountId

        UNION ALL

        SELECT created_at
        FROM Invoices
        WHERE account_id = @accountId

    ) activities;

END
GO


CREATE PROCEDURE sp_ClearContactAccount
    @contact_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Contacts
    SET account_id = NULL
    WHERE contact_id = @contact_id;
END
GO

ALTER TRIGGER trg_AccountUpdated
ON Accounts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Prevent infinite recursion: this trigger's own UPDATE
    -- would otherwise re-fire itself
    IF TRIGGER_NESTLEVEL() > 1
        RETURN;

    -- Avoid re-firing if updated_at is the only thing that changed
    IF NOT UPDATE(updated_at)
    BEGIN
        UPDATE Accounts
        SET updated_at = SYSDATETIMEOFFSET()
        WHERE account_id IN (
            SELECT account_id FROM inserted
        );
    END
END
GO

ALTER PROCEDURE sp_DeleteAccount
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM sales_leads WHERE converted_account_id = @id)
       OR EXISTS (SELECT 1 FROM Opportunities WHERE account_id = @id)
       OR EXISTS (SELECT 1 FROM Quotes WHERE account_id = @id)
       OR EXISTS (SELECT 1 FROM Orders WHERE account_id = @id)
       OR EXISTS (SELECT 1 FROM Invoices WHERE account_id = @id)
       OR EXISTS (SELECT 1 FROM Contacts WHERE account_id = @id)
    BEGIN
        RAISERROR('Cannot delete account: related records exist', 16, 1);
        RETURN;
    END

    DELETE FROM Accounts WHERE account_id = @id;
END
GO




------------------------------------------------------
-- GET ALL CONTACTS (with account name)
------------------------------------------------------
CREATE PROCEDURE sp_GetAllContacts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.*,
        a.account_name
    FROM Contacts c
    LEFT JOIN Accounts a
        ON c.account_id = a.account_id
    ORDER BY c.contact_id DESC;
END
GO


------------------------------------------------------
-- GET CONTACT BY ID (with account name)
------------------------------------------------------
CREATE PROCEDURE sp_GetContactById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.*,
        a.account_name
    FROM Contacts c
    LEFT JOIN Accounts a
        ON c.account_id = a.account_id
    WHERE c.contact_id = @id;
END
GO


------------------------------------------------------
-- CREATE CONTACT
------------------------------------------------------
CREATE PROCEDURE sp_CreateContact

    @first_name NVARCHAR(100),
    @last_name NVARCHAR(100),
    @email NVARCHAR(255) = NULL,
    @job_title NVARCHAR(100) = NULL,
    @phone NVARCHAR(50) = NULL,
    @fax NVARCHAR(50) = NULL,
    @gender NVARCHAR(20) = NULL,
    @address NVARCHAR(255) = NULL,
    @contact_method NVARCHAR(100) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @account_id INT = NULL

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO Contacts (
        first_name,
        last_name,
        email,
        job_title,
        phone,
        fax,
        gender,
        address,
        contact_method,
        description,
        account_id
    )

    OUTPUT INSERTED.contact_id

    VALUES (
        @first_name,
        @last_name,
        @email,
        @job_title,
        @phone,
        @fax,
        @gender,
        @address,
        @contact_method,
        @description,
        @account_id
    );

END
GO


------------------------------------------------------
-- UPDATE CONTACT
------------------------------------------------------
CREATE PROCEDURE sp_UpdateContact

    @id INT,

    @first_name NVARCHAR(100),
    @last_name NVARCHAR(100),
    @email NVARCHAR(255),
    @job_title NVARCHAR(100),
    @phone NVARCHAR(50),
    @fax NVARCHAR(50),
    @gender NVARCHAR(20),
    @address NVARCHAR(255),
    @contact_method NVARCHAR(100),
    @description NVARCHAR(MAX),
    @account_id INT

AS
BEGIN

    SET NOCOUNT ON;

    UPDATE Contacts
    SET
        first_name = @first_name,
        last_name = @last_name,
        email = @email,
        job_title = @job_title,
        phone = @phone,
        fax = @fax,
        gender = @gender,
        address = @address,
        contact_method = @contact_method,
        description = @description,
        account_id = @account_id
    WHERE contact_id = @id;

END
GO


------------------------------------------------------
-- DELETE CONTACT
-- (clears primary_contact_id on any account pointing
--  to this contact, then deletes the contact)
------------------------------------------------------
CREATE PROCEDURE sp_DeleteContact
    @id INT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        UPDATE Accounts
        SET primary_contact_id = NULL
        WHERE primary_contact_id = @id;

        DELETE FROM Contacts
        WHERE contact_id = @id;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO



------------------------------------------------------
-- VIEW: Opportunity list with account/contact/competitor info
------------------------------------------------------
CREATE VIEW vw_OpportunityList
AS
SELECT
    o.*,
    a.account_name,
    con.first_name,
    con.last_name,
    c.name AS competitor_name,
    cp.competitor_product_name
FROM opportunities o
LEFT JOIN accounts a
    ON a.account_id = o.account_id
LEFT JOIN contacts con
    ON con.contact_id = o.primary_contact_id
LEFT JOIN competitor_products cp
    ON cp.competitor_product_id = o.lost_to_competitor_product_id
LEFT JOIN competitors c
    ON c.competitor_id = cp.competitor_id;
GO


------------------------------------------------------
-- GET ALL OPPORTUNITIES
------------------------------------------------------
CREATE PROCEDURE sp_GetAllOpportunities
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_OpportunityList
    ORDER BY opportunity_id DESC;
END
GO


------------------------------------------------------
-- GET OPPORTUNITY BY ID
-- Returns 2 recordsets: [0] opportunity, [1] products
------------------------------------------------------
CREATE PROCEDURE sp_GetOpportunityById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_OpportunityList
    WHERE opportunity_id = @id;

    SELECT
        op.product_id,
        p.product_name,
        op.quantity,
        op.price_per_unit,
        op.manual_discount,
        op.tax_amount
    FROM opportunity_products op
    LEFT JOIN products p
        ON p.product_id = op.product_id
    WHERE op.opportunity_id = @id;
END
GO


------------------------------------------------------
-- CREATE OPPORTUNITY
------------------------------------------------------
CREATE PROCEDURE sp_CreateOpportunity

    @topic NVARCHAR(255) = NULL,
    @account_id INT,
    @primary_contact_id INT,
    @budget_amount DECIMAL(18,2) = 0,
    @purchase_timeframe NVARCHAR(100) = 'Unknown',
    @purchase_process NVARCHAR(100) = 'Unknown',
    @currency NVARCHAR(10) = 'USD',
    @description NVARCHAR(MAX) = NULL,
    @customer_need NVARCHAR(MAX) = NULL,
    @proposed_solution NVARCHAR(MAX) = NULL,
    @status NVARCHAR(50) = 'New'

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO opportunities (
        topic, account_id, primary_contact_id,
        budget_amount, purchase_timeframe, purchase_process,
        currency, description, customer_need,
        proposed_solution, status
    )

    OUTPUT INSERTED.opportunity_id

    VALUES (
        @topic, @account_id, @primary_contact_id,
        @budget_amount, @purchase_timeframe, @purchase_process,
        @currency, @description, @customer_need,
        @proposed_solution, @status
    );

END
GO


------------------------------------------------------
-- ADD OPPORTUNITY PRODUCT
-- (called once per product line item from the route)
------------------------------------------------------
CREATE PROCEDURE sp_AddOpportunityProduct

    @opportunity_id INT,
    @product_id INT,
    @quantity DECIMAL(18,2) = 0,
    @price_per_unit DECIMAL(18,2) = 0,
    @manual_discount DECIMAL(18,2) = 0,
    @tax_amount DECIMAL(18,2) = 0

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO opportunity_products (
        opportunity_id, product_id, quantity,
        price_per_unit, manual_discount, tax_amount
    )
    VALUES (
        @opportunity_id, @product_id, @quantity,
        @price_per_unit, @manual_discount, @tax_amount
    );

END
GO


------------------------------------------------------
-- UPDATE OPPORTUNITY
------------------------------------------------------
CREATE PROCEDURE sp_UpdateOpportunity

    @id INT,

    @topic NVARCHAR(255),
    @account_id INT,
    @primary_contact_id INT,
    @budget_amount DECIMAL(18,2),
    @purchase_timeframe NVARCHAR(100),
    @purchase_process NVARCHAR(100),
    @currency NVARCHAR(10),
    @description NVARCHAR(MAX),
    @customer_need NVARCHAR(MAX),
    @proposed_solution NVARCHAR(MAX),
    @status NVARCHAR(50)

AS
BEGIN

    SET NOCOUNT ON;

    UPDATE opportunities
    SET
        topic = @topic,
        account_id = @account_id,
        primary_contact_id = @primary_contact_id,
        budget_amount = @budget_amount,
        purchase_timeframe = @purchase_timeframe,
        purchase_process = @purchase_process,
        currency = @currency,
        description = @description,
        customer_need = @customer_need,
        proposed_solution = @proposed_solution,
        status = @status
    WHERE opportunity_id = @id;

END
GO


------------------------------------------------------
-- CLEAR OPPORTUNITY PRODUCTS
-- (called before re-inserting products on update)
------------------------------------------------------
CREATE PROCEDURE sp_ClearOpportunityProducts
    @opportunity_id INT
AS
BEGIN

    SET NOCOUNT ON;

    DELETE FROM opportunity_products
    WHERE opportunity_id = @opportunity_id;

END
GO


------------------------------------------------------
-- MARK OPPORTUNITY WON
-- (status update + quote creation + product copy,
--  all in a single transaction). Returns quote_id.
------------------------------------------------------
CREATE PROCEDURE sp_MarkOpportunityWon
    @id INT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM opportunities WHERE opportunity_id = @id)
        BEGIN
            RAISERROR('Opportunity not found', 16, 1);
        END

        UPDATE opportunities
        SET status = 'Won'
        WHERE opportunity_id = @id;

        DECLARE @account_id INT, @topic NVARCHAR(255), @currency NVARCHAR(10);

        SELECT
            @account_id = account_id,
            @topic = topic,
            @currency = ISNULL(currency, 'USD')
        FROM opportunities
        WHERE opportunity_id = @id;

        DECLARE @quote_code NVARCHAR(50) =
            CONCAT('QT-', CONVERT(VARCHAR, SYSDATETIMEOFFSET(), 112), '-', @id);

        DECLARE @quoteIdTable TABLE (quote_id INT);
        DECLARE @quote_id INT;

        INSERT INTO quotes (
            opportunity_id, account_id, topic,
            currency, status, quote_code
        )
        OUTPUT INSERTED.quote_id INTO @quoteIdTable
        VALUES (
            @id, @account_id, @topic,
            @currency, 'Draft', @quote_code
        );

        SELECT @quote_id = quote_id FROM @quoteIdTable;

        INSERT INTO quote_products (
            quote_id, product_id, price_per_unit,
            quantity, manual_discount, tax_amount,
            total_amount, unit_of_measure
        )
        SELECT
            @quote_id,
            op.product_id,
            op.price_per_unit,
            op.quantity,
            ISNULL(op.manual_discount, 0),
            ISNULL(op.tax_amount, 0),
            (op.price_per_unit * op.quantity) - ISNULL(op.manual_discount, 0) + ISNULL(op.tax_amount, 0),
            NULL
        FROM opportunity_products op
        WHERE op.opportunity_id = @id;

        COMMIT TRANSACTION;

        SELECT @quote_id AS quote_id;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO


------------------------------------------------------
-- MARK OPPORTUNITY LOST
------------------------------------------------------
CREATE PROCEDURE sp_MarkOpportunityLost
    @id INT,
    @lost_to_competitor_product_id INT = NULL
AS
BEGIN

    SET NOCOUNT ON;

    UPDATE opportunities
    SET
        status = 'Lost',
        lost_to_competitor_product_id = @lost_to_competitor_product_id
    WHERE opportunity_id = @id;

END
GO


------------------------------------------------------
-- DELETE OPPORTUNITY
-- (guards against converted-lead FK, clears competitor
--  links + products before deleting, all transactional)
------------------------------------------------------
CREATE PROCEDURE sp_DeleteOpportunity
    @id INT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM sales_leads WHERE converted_opportunity_id = @id)
        BEGIN
            RAISERROR('Cannot delete opportunity: linked to a converted lead', 16, 1);
        END

        DELETE FROM opportunity_product_competitors
        WHERE opportunity_id = @id;

        DELETE FROM opportunity_products
        WHERE opportunity_id = @id;

        DELETE FROM opportunities
        WHERE opportunity_id = @id;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO


------------------------------------------------------
-- GET COMPETITORS FOR A PRODUCT
------------------------------------------------------
CREATE PROCEDURE sp_GetProductCompetitors
    @productId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cp.competitor_product_id,
        cp.competitor_product_name,
        c.competitor_id,
        c.name AS competitor_name
    FROM competitor_products cp
    INNER JOIN competitors c
        ON cp.competitor_id = c.competitor_id
    WHERE cp.product_id = @productId
    ORDER BY c.name;
END
GO


------------------------------------------------------
-- GET SELECTED COMPETITORS FOR AN OPPORTUNITY PRODUCT
------------------------------------------------------
CREATE PROCEDURE sp_GetOpportunityProductCompetitors
    @opportunityId INT,
    @productId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        opc.competitor_product_id,
        cp.competitor_product_name,
        c.competitor_id,
        c.name AS competitor_name
    FROM opportunity_product_competitors opc
    INNER JOIN competitor_products cp
        ON opc.competitor_product_id = cp.competitor_product_id
    INNER JOIN competitors c
        ON cp.competitor_id = c.competitor_id
    WHERE opc.opportunity_id = @opportunityId
      AND opc.product_id = @productId
    ORDER BY c.name;
END
GO


------------------------------------------------------
-- CLEAR COMPETITORS FOR AN OPPORTUNITY PRODUCT
-- (called before re-inserting selected competitors)
------------------------------------------------------
CREATE PROCEDURE sp_ClearOpportunityProductCompetitors
    @opportunityId INT,
    @productId INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM opportunity_product_competitors
    WHERE opportunity_id = @opportunityId
      AND product_id = @productId;
END
GO


------------------------------------------------------
-- ADD A COMPETITOR FOR AN OPPORTUNITY PRODUCT
-- (called once per selected competitor_product_id)
------------------------------------------------------
CREATE PROCEDURE sp_AddOpportunityProductCompetitor
    @opportunityId INT,
    @productId INT,
    @competitorProductId INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO opportunity_product_competitors (
        opportunity_id,
        product_id,
        competitor_product_id
    )
    VALUES (
        @opportunityId,
        @productId,
        @competitorProductId
    );
END
GO




------------------------------------------------------
-- GET ALL COMPETITORS
------------------------------------------------------
CREATE PROCEDURE sp_GetAllCompetitors
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM competitors
    ORDER BY competitor_id DESC;
END
GO


------------------------------------------------------
-- GET COMPETITOR BY ID
-- Returns 2 recordsets: [0] competitor, [1] product mappings
------------------------------------------------------
CREATE PROCEDURE sp_GetCompetitorById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM competitors
    WHERE competitor_id = @id;

    SELECT
        cp.competitor_product_id,
        cp.product_id,
        p.product_name,
        cp.competitor_product_name,
        cp.notes
    FROM competitor_products cp
    LEFT JOIN products p
        ON cp.product_id = p.product_id
    WHERE cp.competitor_id = @id;
END
GO


------------------------------------------------------
-- CREATE COMPETITOR
------------------------------------------------------
CREATE PROCEDURE sp_CreateCompetitor

    @name NVARCHAR(255),
    @website NVARCHAR(255) = NULL,
    @currency NVARCHAR(10) = NULL,
    @street_1 NVARCHAR(255) = NULL,
    @street_2 NVARCHAR(255) = NULL,
    @street_3 NVARCHAR(255) = NULL,
    @city NVARCHAR(100) = NULL,
    @state_province NVARCHAR(100) = NULL,
    @zip_postal_code NVARCHAR(20) = NULL,
    @country_region NVARCHAR(100) = NULL,
    @strength NVARCHAR(MAX) = NULL,
    @weakness NVARCHAR(MAX) = NULL

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO competitors (
        name,
        website,
        currency,
        street_1,
        street_2,
        street_3,
        city,
        state_province,
        zip_postal_code,
        country_region,
        strength,
        weakness
    )

    OUTPUT INSERTED.*

    VALUES (
        @name,
        @website,
        @currency,
        @street_1,
        @street_2,
        @street_3,
        @city,
        @state_province,
        @zip_postal_code,
        @country_region,
        @strength,
        @weakness
    );

END
GO


------------------------------------------------------
-- UPDATE COMPETITOR
------------------------------------------------------
CREATE PROCEDURE sp_UpdateCompetitor

    @id INT,
    @name NVARCHAR(255),
    @website NVARCHAR(255),
    @currency NVARCHAR(10),
    @street_1 NVARCHAR(255),
    @street_2 NVARCHAR(255),
    @street_3 NVARCHAR(255),
    @city NVARCHAR(100),
    @state_province NVARCHAR(100),
    @zip_postal_code NVARCHAR(20),
    @country_region NVARCHAR(100),
    @strength NVARCHAR(MAX),
    @weakness NVARCHAR(MAX)

AS
BEGIN

    SET NOCOUNT ON;

    UPDATE competitors
    SET
        name             = @name,
        website          = @website,
        currency         = @currency,
        street_1         = @street_1,
        street_2         = @street_2,
        street_3         = @street_3,
        city             = @city,
        state_province   = @state_province,
        zip_postal_code  = @zip_postal_code,
        country_region   = @country_region,
        strength         = @strength,
        weakness         = @weakness
    WHERE competitor_id  = @id;

END
GO


------------------------------------------------------
-- DELETE COMPETITOR PRODUCT MAPPING
-- Guards against FK references from opportunities and
-- opportunity_product_competitors before deleting
------------------------------------------------------
CREATE PROCEDURE sp_DeleteCompetitorProduct
    @id INT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM opportunities
            WHERE lost_to_competitor_product_id = @id
        )
        BEGIN
            RAISERROR('Cannot delete: linked to one or more opportunities as lost-to competitor', 16, 1);
        END

        DELETE FROM opportunity_product_competitors
        WHERE competitor_product_id = @id;

        DELETE FROM competitor_products
        WHERE competitor_product_id = @id;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO


------------------------------------------------------
-- DELETE COMPETITOR
-- Removes all product mappings first (via the same
-- FK-safe path as sp_DeleteCompetitorProduct), then
-- deletes the competitor itself, all transactional
------------------------------------------------------
CREATE PROCEDURE sp_DeleteCompetitor
    @id INT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM opportunities o
            INNER JOIN competitor_products cp
                ON o.lost_to_competitor_product_id = cp.competitor_product_id
            WHERE cp.competitor_id = @id
        )
        BEGIN
            RAISERROR('Cannot delete: this competitor is linked to one or more opportunities', 16, 1);
        END

        DELETE opc
        FROM opportunity_product_competitors opc
        INNER JOIN competitor_products cp
            ON opc.competitor_product_id = cp.competitor_product_id
        WHERE cp.competitor_id = @id;

        DELETE FROM competitor_products
        WHERE competitor_id = @id;

        DELETE FROM competitors
        WHERE competitor_id = @id;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO


------------------------------------------------------
-- ADD COMPETITOR PRODUCT MAPPING
------------------------------------------------------
CREATE PROCEDURE sp_AddCompetitorProduct

    @competitor_id INT,
    @product_id INT = NULL,
    @competitor_product_name NVARCHAR(255) = NULL,
    @notes NVARCHAR(MAX) = NULL

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO competitor_products (
        competitor_id,
        product_id,
        competitor_product_name,
        notes
    )

    OUTPUT INSERTED.*

    VALUES (
        @competitor_id,
        @product_id,
        @competitor_product_name,
        @notes
    );

END
GO


------------------------------------------------------
-- UPDATE COMPETITOR PRODUCT MAPPING
------------------------------------------------------
CREATE PROCEDURE sp_UpdateCompetitorProduct

    @id INT,
    @product_id INT,
    @competitor_product_name NVARCHAR(255),
    @notes NVARCHAR(MAX)

AS
BEGIN

    SET NOCOUNT ON;

    UPDATE competitor_products
    SET
        product_id              = @product_id,
        competitor_product_name = @competitor_product_name,
        notes                   = @notes
    WHERE competitor_product_id = @id;

END
GO


------------------------------------------------------
-- GET COMPETITORS BY PRODUCT
------------------------------------------------------
CREATE PROCEDURE sp_GetCompetitorsByProduct
    @productId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cp.competitor_product_id,
        cp.competitor_id,
        c.name AS competitor_name,
        cp.competitor_product_name
    FROM competitor_products cp
    INNER JOIN competitors c
        ON c.competitor_id = cp.competitor_id
    WHERE cp.product_id = @productId;
END
GO





------------------------------------------------------
-- GET ALL PRODUCTS
------------------------------------------------------
CREATE PROCEDURE sp_GetAllProducts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        product_id,
        product_name,
        product_code,
        list_price,
        cost_price,
        unit_of_measure,
        valid_from,
        valid_to,
        description,
        created_at,
        updated_at
    FROM products
    ORDER BY product_id DESC;
END
GO


------------------------------------------------------
-- GET PRODUCT BY ID
------------------------------------------------------
CREATE PROCEDURE sp_GetProductById
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        product_id,
        product_name,
        product_code,
        list_price,
        cost_price,
        unit_of_measure,
        valid_from,
        valid_to,
        description,
        created_at,
        updated_at
    FROM products
    WHERE product_id = @id;
END
GO


------------------------------------------------------
-- CREATE PRODUCT
-- (product_code is still generated in JS via
--  generateProductCode() and passed in as a parameter)
------------------------------------------------------
CREATE PROCEDURE sp_CreateProduct

    @product_name NVARCHAR(200),
    @product_code NVARCHAR(100),
    @list_price DECIMAL(18,2) = 0,
    @cost_price DECIMAL(18,2) = 0,
    @unit_of_measure NVARCHAR(50) = NULL,
    @valid_from DATE = NULL,
    @valid_to DATE = NULL,
    @description NVARCHAR(MAX) = NULL

AS
BEGIN

    SET NOCOUNT ON;

    INSERT INTO products (
        product_name,
        product_code,
        list_price,
        cost_price,
        unit_of_measure,
        valid_from,
        valid_to,
        description
    )

    OUTPUT INSERTED.product_id

    VALUES (
        @product_name,
        @product_code,
        @list_price,
        @cost_price,
        @unit_of_measure,
        @valid_from,
        @valid_to,
        @description
    );

END
GO


------------------------------------------------------
-- UPDATE PRODUCT
-- Returns 1 if a row existed and was updated, 0 if not
-- found (lets the JS layer return 404 without a
-- separate SELECT round trip)
------------------------------------------------------
CREATE PROCEDURE sp_UpdateProduct

    @id INT,
    @product_name NVARCHAR(200),
    @product_code NVARCHAR(100),
    @list_price DECIMAL(18,2),
    @cost_price DECIMAL(18,2),
    @unit_of_measure NVARCHAR(50),
    @valid_from DATE,
    @valid_to DATE,
    @description NVARCHAR(MAX)

AS
BEGIN

    SET NOCOUNT ON;

    UPDATE products
    SET
        product_name = @product_name,
        product_code = @product_code,
        list_price = @list_price,
        cost_price = @cost_price,
        unit_of_measure = @unit_of_measure,
        valid_from = @valid_from,
        valid_to = @valid_to,
        description = @description,
        updated_at = SYSDATETIMEOFFSET()
    WHERE product_id = @id;

    SELECT @@ROWCOUNT AS rows_affected;

END
GO


------------------------------------------------------
-- DELETE PRODUCT
-- Guards against FK references from every table that
-- can point at a product before deleting
------------------------------------------------------
CREATE PROCEDURE sp_DeleteProduct
    @id INT
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = @id)
        BEGIN
            SELECT 0 AS rows_affected, 'NOT_FOUND' AS reason;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM opportunity_products WHERE product_id = @id)
           OR EXISTS (SELECT 1 FROM quote_products WHERE product_id = @id)
           OR EXISTS (SELECT 1 FROM order_products WHERE product_id = @id)
           OR EXISTS (SELECT 1 FROM invoice_products WHERE product_id = @id)
           OR EXISTS (SELECT 1 FROM competitor_products WHERE product_id = @id)
        BEGIN
            SELECT 0 AS rows_affected, 'IN_USE' AS reason;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DELETE FROM products
        WHERE product_id = @id;

        COMMIT TRANSACTION;

        SELECT 1 AS rows_affected, NULL AS reason;

    END TRY
    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END
GO


----------------------------

CREATE VIEW vw_Quotes
AS
SELECT
    q.quote_id,
    q.topic,
    q.currency,
    q.status,
    q.total_amount,
    q.created_at,

    a.account_id,
    a.account_name,

    o.opportunity_id,

    c.contact_id,
    c.first_name,
    c.last_name

FROM quotes q
LEFT JOIN accounts a
    ON q.account_id = a.account_id
LEFT JOIN opportunities o
    ON q.opportunity_id = o.opportunity_id
LEFT JOIN contacts c
    ON o.primary_contact_id = c.contact_id;
GO

CREATE VIEW vw_QuoteProducts
AS
SELECT
    qp.quote_product_id,
    qp.quote_id,
    qp.product_id,
    p.product_name,
    qp.unit_of_measure,
    qp.price_per_unit,
    qp.quantity,
    qp.manual_discount,
    qp.tax_amount,
    qp.total_amount
FROM quote_products qp
LEFT JOIN products p
    ON qp.product_id = p.product_id;
GO

CREATE PROCEDURE sp_GetAllQuotes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_Quotes
    ORDER BY quote_id DESC;
END;
GO

CREATE PROCEDURE sp_GetQuoteById
    @QuoteId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM quotes
    WHERE quote_id = @QuoteId;

    SELECT
        qp.*,
        p.product_name
    FROM quote_products qp
    LEFT JOIN products p
        ON qp.product_id = p.product_id
    WHERE qp.quote_id = @QuoteId;
END;
GO



CREATE PROCEDURE sp_CreateQuote
(
    @opportunity_id INT,
    @account_id INT,
    @topic NVARCHAR(255),
    @currency NVARCHAR(50),
    @payment_terms NVARCHAR(255),
    @shipping_method NVARCHAR(255),
    @status NVARCHAR(50),

    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,

    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO quotes
    (
        opportunity_id,
        account_id,
        topic,
        currency,
        payment_terms,
        shipping_method,
        status,

        bill_to_street_1,
        bill_to_street_2,
        bill_to_street_3,
        bill_to_city,
        bill_to_state,
        bill_to_zip,
        bill_to_country,

        ship_to_street_1,
        ship_to_street_2,
        ship_to_street_3,
        ship_to_city,
        ship_to_state,
        ship_to_zip,
        ship_to_country
    )
    OUTPUT INSERTED.quote_id
    VALUES
    (
        @opportunity_id,
        @account_id,
        @topic,
        @currency,
        @payment_terms,
        @shipping_method,
        @status,

        @bill_to_street_1,
        @bill_to_street_2,
        @bill_to_street_3,
        @bill_to_city,
        @bill_to_state,
        @bill_to_zip,
        @bill_to_country,

        @ship_to_street_1,
        @ship_to_street_2,
        @ship_to_street_3,
        @ship_to_city,
        @ship_to_state,
        @ship_to_zip,
        @ship_to_country
    );
END
GO

CREATE PROCEDURE sp_AddQuoteProduct
(
    @quote_id INT,
    @product_id INT,
    @unit_of_measure NVARCHAR(50),
    @price_per_unit DECIMAL(18,2),
    @quantity DECIMAL(18,2),
    @manual_discount DECIMAL(18,2),
    @tax_amount DECIMAL(18,2)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_amount DECIMAL(18,2);

    SET @total_amount =
        (@price_per_unit * @quantity)
        - @manual_discount
        + @tax_amount;

    INSERT INTO quote_products
    (
        quote_id,
        product_id,
        unit_of_measure,
        price_per_unit,
        quantity,
        manual_discount,
        tax_amount,
        total_amount
    )
    VALUES
    (
        @quote_id,
        @product_id,
        @unit_of_measure,
        @price_per_unit,
        @quantity,
        @manual_discount,
        @tax_amount,
        @total_amount
    );
END
GO

CREATE PROCEDURE sp_UpdateQuoteTotal
(
    @quote_id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE quotes
    SET total_amount =
    (
        SELECT ISNULL(SUM(total_amount),0)
        FROM quote_products
        WHERE quote_id = @quote_id
    )
    WHERE quote_id = @quote_id;
END
GO


CREATE PROCEDURE sp_UpdateQuote
(
    @id INT,
    @topic NVARCHAR(255),
    @currency NVARCHAR(50),
    @payment_terms NVARCHAR(255),
    @shipping_method NVARCHAR(255),
    @status NVARCHAR(50),

    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,

    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE quotes
    SET
        topic = @topic,
        currency = @currency,
        payment_terms = @payment_terms,
        shipping_method = @shipping_method,
        status = @status,

        bill_to_street_1 = @bill_to_street_1,
        bill_to_street_2 = @bill_to_street_2,
        bill_to_street_3 = @bill_to_street_3,
        bill_to_city = @bill_to_city,
        bill_to_state = @bill_to_state,
        bill_to_zip = @bill_to_zip,
        bill_to_country = @bill_to_country,

        ship_to_street_1 = @ship_to_street_1,
        ship_to_street_2 = @ship_to_street_2,
        ship_to_street_3 = @ship_to_street_3,
        ship_to_city = @ship_to_city,
        ship_to_state = @ship_to_state,
        ship_to_zip = @ship_to_zip,
        ship_to_country = @ship_to_country
    WHERE quote_id = @id;
END
GO

CREATE PROCEDURE sp_DeleteQuoteProducts
(
    @quote_id INT
)
AS
BEGIN
    DELETE FROM quote_products
    WHERE quote_id = @quote_id;
END
GO


CREATE PROCEDURE sp_DeleteQuote
(
    @id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Delete child records first
    DELETE FROM quote_products
    WHERE quote_id = @id;

    -- Delete quote
    DELETE FROM quotes
    WHERE quote_id = @id;
END
GO


SELECT *
FROM sales_leads
WHERE converted_account_id = 4; -- replace with actual account id


ALTER TABLE sales_leads
ALTER COLUMN converted_account_id INT NULL;

SELECT
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS ChildTable
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.referenced_object_id) = 'accounts';



CREATE OR ALTER VIEW vw_Quotes
AS
SELECT
    q.quote_id,
    q.opportunity_id,
    q.account_id,
    q.topic,
    q.currency,
    q.payment_terms,
    q.shipping_method,
    q.status,
    q.total_amount,
    q.created_at,
    q.bill_to_street_1,
    q.bill_to_street_2,
    q.bill_to_street_3,
    q.bill_to_city,
    q.bill_to_state,
    q.bill_to_zip,
    q.bill_to_country,
    q.ship_to_street_1,
    q.ship_to_street_2,
    q.ship_to_street_3,
    q.ship_to_city,
    q.ship_to_state,
    q.ship_to_zip,
    q.ship_to_country,
    a.account_name,
    c.contact_id,
    c.first_name,
    c.last_name
FROM quotes q
LEFT JOIN accounts a
    ON q.account_id = a.account_id
LEFT JOIN opportunities o
    ON q.opportunity_id = o.opportunity_id
LEFT JOIN contacts c
    ON o.primary_contact_id = c.contact_id;
GO

CREATE OR ALTER VIEW vw_QuoteProducts
AS
SELECT
    qp.quote_product_id,
    qp.quote_id,
    qp.product_id,
    p.product_name,
    qp.unit_of_measure,
    qp.price_per_unit,
    qp.quantity,
    qp.manual_discount,
    qp.tax_amount,
    qp.total_amount
FROM quote_products qp
LEFT JOIN products p
    ON qp.product_id = p.product_id;
GO

CREATE OR ALTER PROCEDURE sp_GetAllQuotes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        quote_id,
        opportunity_id,
        account_id,
        topic,
        currency,
        payment_terms,
        shipping_method,
        status,
        total_amount,
        created_at,
        account_name,
        contact_id,
        first_name,
        last_name
    FROM vw_Quotes
    ORDER BY quote_id DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetQuoteById
    @QuoteId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        quote_id,
        opportunity_id,
        account_id,
        topic,
        currency,
        payment_terms,
        shipping_method,
        status,
        total_amount,
        created_at,
        bill_to_street_1,
        bill_to_street_2,
        bill_to_street_3,
        bill_to_city,
        bill_to_state,
        bill_to_zip,
        bill_to_country,
        ship_to_street_1,
        ship_to_street_2,
        ship_to_street_3,
        ship_to_city,
        ship_to_state,
        ship_to_zip,
        ship_to_country
    FROM quotes
    WHERE quote_id = @QuoteId;

    SELECT
        qp.quote_product_id,
        qp.quote_id,
        qp.product_id,
        p.product_name,
        qp.unit_of_measure,
        qp.price_per_unit,
        qp.quantity,
        qp.manual_discount,
        qp.tax_amount,
        qp.total_amount
    FROM quote_products qp
    LEFT JOIN products p
        ON qp.product_id = p.product_id
    WHERE qp.quote_id = @QuoteId;
END;
GO

CREATE OR ALTER PROCEDURE sp_CreateQuote
(
    @opportunity_id INT,
    @account_id INT,
    @topic NVARCHAR(255),
    @currency NVARCHAR(50),
    @payment_terms NVARCHAR(255),
    @shipping_method NVARCHAR(255),
    @status NVARCHAR(50),
    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,
    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO quotes
    (
        opportunity_id,
        account_id,
        topic,
        currency,
        payment_terms,
        shipping_method,
        status,
        bill_to_street_1,
        bill_to_street_2,
        bill_to_street_3,
        bill_to_city,
        bill_to_state,
        bill_to_zip,
        bill_to_country,
        ship_to_street_1,
        ship_to_street_2,
        ship_to_street_3,
        ship_to_city,
        ship_to_state,
        ship_to_zip,
        ship_to_country
    )
    OUTPUT INSERTED.quote_id
    VALUES
    (
        @opportunity_id,
        @account_id,
        @topic,
        @currency,
        @payment_terms,
        @shipping_method,
        @status,
        @bill_to_street_1,
        @bill_to_street_2,
        @bill_to_street_3,
        @bill_to_city,
        @bill_to_state,
        @bill_to_zip,
        @bill_to_country,
        @ship_to_street_1,
        @ship_to_street_2,
        @ship_to_street_3,
        @ship_to_city,
        @ship_to_state,
        @ship_to_zip,
        @ship_to_country
    );
END
GO

CREATE OR ALTER PROCEDURE sp_AddQuoteProduct
(
    @quote_id INT,
    @product_id INT,
    @unit_of_measure NVARCHAR(50),
    @price_per_unit DECIMAL(18,2),
    @quantity DECIMAL(18,2),
    @manual_discount DECIMAL(18,2),
    @tax_amount DECIMAL(18,2)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_amount DECIMAL(18,2);

    SET @total_amount =
        (@price_per_unit * @quantity)
        - ISNULL(@manual_discount, 0)
        + ISNULL(@tax_amount, 0);

    INSERT INTO quote_products
    (
        quote_id,
        product_id,
        unit_of_measure,
        price_per_unit,
        quantity,
        manual_discount,
        tax_amount,
        total_amount
    )
    VALUES
    (
        @quote_id,
        @product_id,
        @unit_of_measure,
        @price_per_unit,
        @quantity,
        ISNULL(@manual_discount, 0),
        ISNULL(@tax_amount, 0),
        @total_amount
    );
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateQuoteTotal
(
    @quote_id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE quotes
    SET total_amount =
    (
        SELECT ISNULL(SUM(total_amount), 0)
        FROM quote_products
        WHERE quote_id = @quote_id
    )
    WHERE quote_id = @quote_id;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateQuote
(
    @id INT,
    @topic NVARCHAR(255),
    @currency NVARCHAR(50),
    @payment_terms NVARCHAR(255),
    @shipping_method NVARCHAR(255),
    @status NVARCHAR(50),
    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,
    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE quotes
    SET
        topic = @topic,
        currency = @currency,
        payment_terms = @payment_terms,
        shipping_method = @shipping_method,
        status = @status,
        bill_to_street_1 = @bill_to_street_1,
        bill_to_street_2 = @bill_to_street_2,
        bill_to_street_3 = @bill_to_street_3,
        bill_to_city = @bill_to_city,
        bill_to_state = @bill_to_state,
        bill_to_zip = @bill_to_zip,
        bill_to_country = @bill_to_country,
        ship_to_street_1 = @ship_to_street_1,
        ship_to_street_2 = @ship_to_street_2,
        ship_to_street_3 = @ship_to_street_3,
        ship_to_city = @ship_to_city,
        ship_to_state = @ship_to_state,
        ship_to_zip = @ship_to_zip,
        ship_to_country = @ship_to_country
    WHERE quote_id = @id;
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteQuoteProducts
(
    @quote_id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM quote_products
    WHERE quote_id = @quote_id;
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteQuote
(
    @id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM quote_products
    WHERE quote_id = @id;

    DELETE FROM quotes
    WHERE quote_id = @id;
END
GO

--------------------------------------

CREATE OR ALTER PROCEDURE sp_GetAllOrders
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        o.order_id,
        o.order_code,
        o.quote_id,
        o.account_id,
        o.opportunity_id,
        o.topic,
        o.status,
        o.currency,
        o.payment_terms,
        o.shipping_method,
        o.requested_delivery,
        o.total_amount,
        o.created_at,
        a.account_name
    FROM orders o
    LEFT JOIN accounts a
        ON o.account_id = a.account_id
    ORDER BY o.order_id DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_GetOrderById
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        order_id,
        order_code,
        quote_id,
        account_id,
        opportunity_id,
        topic,
        status,
        currency,
        payment_terms,
        shipping_method,
        requested_delivery,
        bill_to_street_1,
        bill_to_street_2,
        bill_to_street_3,
        bill_to_city,
        bill_to_state,
        bill_to_zip,
        bill_to_country,
        ship_to_street_1,
        ship_to_street_2,
        ship_to_street_3,
        ship_to_city,
        ship_to_state,
        ship_to_zip,
        ship_to_country,
        total_amount,
        created_at
    FROM orders
    WHERE order_id = @OrderId;

    SELECT
        op.order_product_id,
        op.order_id,
        op.product_id,
        p.product_name,
        op.unit_of_measure,
        op.price_per_unit,
        op.quantity,
        op.manual_discount,
        op.tax_amount,
        op.total_amount
    FROM order_products op
    LEFT JOIN products p
        ON p.product_id = op.product_id
    WHERE op.order_id = @OrderId;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateOrder
(
    @order_code NVARCHAR(50),
    @quote_id INT,
    @account_id INT,
    @opportunity_id INT = NULL,
    @topic NVARCHAR(255) = NULL,
    @status NVARCHAR(50),
    @currency NVARCHAR(50) = NULL,
    @payment_terms NVARCHAR(255) = NULL,
    @shipping_method NVARCHAR(255) = NULL,
    @requested_delivery NVARCHAR(100) = NULL,
    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,
    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL,
    @total_amount DECIMAL(18,2) = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO orders
    (
        order_code, quote_id, account_id, opportunity_id, topic, status,
        currency, payment_terms, shipping_method, requested_delivery,
        bill_to_street_1, bill_to_street_2, bill_to_street_3,
        bill_to_city, bill_to_state, bill_to_zip, bill_to_country,
        ship_to_street_1, ship_to_street_2, ship_to_street_3,
        ship_to_city, ship_to_state, ship_to_zip, ship_to_country,
        total_amount
    )
    OUTPUT INSERTED.order_id
    VALUES
    (
        @order_code, @quote_id, @account_id, @opportunity_id, @topic, @status,
        @currency, @payment_terms, @shipping_method, @requested_delivery,
        @bill_to_street_1, @bill_to_street_2, @bill_to_street_3,
        @bill_to_city, @bill_to_state, @bill_to_zip, @bill_to_country,
        @ship_to_street_1, @ship_to_street_2, @ship_to_street_3,
        @ship_to_city, @ship_to_state, @ship_to_zip, @ship_to_country,
        @total_amount
    );
END
GO


CREATE OR ALTER PROCEDURE sp_UpdateOrder
(
    @id INT,
    @topic NVARCHAR(255),
    @status NVARCHAR(50),
    @currency NVARCHAR(50),
    @payment_terms NVARCHAR(255),
    @shipping_method NVARCHAR(255),
    @requested_delivery NVARCHAR(100) = NULL,
    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,
    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE orders
    SET
        topic = @topic,
        status = @status,
        currency = @currency,
        payment_terms = @payment_terms,
        shipping_method = @shipping_method,
        requested_delivery = @requested_delivery,
        bill_to_street_1 = @bill_to_street_1,
        bill_to_street_2 = @bill_to_street_2,
        bill_to_street_3 = @bill_to_street_3,
        bill_to_city = @bill_to_city,
        bill_to_state = @bill_to_state,
        bill_to_zip = @bill_to_zip,
        bill_to_country = @bill_to_country,
        ship_to_street_1 = @ship_to_street_1,
        ship_to_street_2 = @ship_to_street_2,
        ship_to_street_3 = @ship_to_street_3,
        ship_to_city = @ship_to_city,
        ship_to_state = @ship_to_state,
        ship_to_zip = @ship_to_zip,
        ship_to_country = @ship_to_country
    WHERE order_id = @id;
END
GO


CREATE OR ALTER PROCEDURE sp_AddOrderProduct
(
    @order_id INT,
    @product_id INT,
    @unit_of_measure NVARCHAR(50),
    @price_per_unit DECIMAL(18,2),
    @quantity DECIMAL(18,2),
    @manual_discount DECIMAL(18,2) = 0,
    @tax_amount DECIMAL(18,2) = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_amount DECIMAL(18,2) =
        (@price_per_unit * @quantity) - ISNULL(@manual_discount, 0) + ISNULL(@tax_amount, 0);

    INSERT INTO order_products
    (
        order_id, product_id, unit_of_measure, price_per_unit,
        quantity, manual_discount, tax_amount, total_amount
    )
    VALUES
    (
        @order_id, @product_id, @unit_of_measure, @price_per_unit,
        @quantity, ISNULL(@manual_discount, 0), ISNULL(@tax_amount, 0), @total_amount
    );
END
GO

CREATE OR ALTER PROCEDURE sp_RecalculateOrderTotal
    @order_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE orders
    SET total_amount =
    (
        SELECT ISNULL(SUM(total_amount), 0)
        FROM order_products
        WHERE order_id = @order_id
    )
    WHERE order_id = @order_id;
END
GO


CREATE OR ALTER PROCEDURE sp_DeleteOrder
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM order_products
    WHERE order_id = @id;

    DELETE FROM orders
    WHERE order_id = @id;
END
GO


-------------------------------------

CREATE OR ALTER PROCEDURE sp_GetAllInvoices
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        i.invoice_id,
        i.invoice_code,
        i.opportunity_id,
        i.account_id,
        i.order_id,
        i.topic,
        i.currency,
        i.due_date,
        i.date_delivered,
        i.payment_terms,
        i.shipping_method,
        i.detail_amount,
        i.total_discount,
        i.total_tax,
        i.total_amount,
        i.status,
        i.created_at,
        a.account_name
    FROM invoices i
    LEFT JOIN accounts a
        ON i.account_id = a.account_id
    ORDER BY i.invoice_id DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_GetInvoiceById
    @InvoiceId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        invoice_id,
        invoice_code,
        opportunity_id,
        account_id,
        order_id,
        topic,
        currency,
        due_date,
        date_delivered,
        payment_terms,
        shipping_method,
        bill_to_street_1,
        bill_to_street_2,
        bill_to_street_3,
        bill_to_city,
        bill_to_state,
        bill_to_zip,
        bill_to_country,
        ship_to_street_1,
        ship_to_street_2,
        ship_to_street_3,
        ship_to_city,
        ship_to_state,
        ship_to_zip,
        ship_to_country,
        detail_amount,
        total_discount,
        total_tax,
        total_amount,
        status,
        created_at,
        updated_at
    FROM invoices
    WHERE invoice_id = @InvoiceId;

    SELECT
        ip.invoice_product_id,
        ip.invoice_id,
        ip.product_id,
        p.product_name,
        ip.unit_of_measure,
        ip.price_per_unit,
        ip.quantity,
        ip.manual_discount,
        ip.tax_amount,
        ip.total_amount
    FROM invoice_products ip
    LEFT JOIN products p
        ON ip.product_id = p.product_id
    WHERE ip.invoice_id = @InvoiceId;
END
GO


CREATE OR ALTER PROCEDURE sp_CreateInvoice
(
    @invoice_code NVARCHAR(50),
    @opportunity_id INT = NULL,
    @account_id INT = NULL,
    @order_id INT = NULL,
    @topic NVARCHAR(255),
    @currency NVARCHAR(50) = 'INR',
    @due_date DATE,
    @date_delivered DATE = NULL,
    @payment_terms NVARCHAR(255) = NULL,
    @shipping_method NVARCHAR(255) = NULL,
    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,
    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL,
    @detail_amount DECIMAL(18,2) = 0,
    @total_discount DECIMAL(18,2) = 0,
    @total_tax DECIMAL(18,2) = 0,
    @total_amount DECIMAL(18,2) = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO invoices
    (
        invoice_code, opportunity_id, account_id, order_id,
        topic, currency, due_date, date_delivered,
        payment_terms, shipping_method,
        bill_to_street_1, bill_to_street_2, bill_to_street_3,
        bill_to_city, bill_to_state, bill_to_zip, bill_to_country,
        ship_to_street_1, ship_to_street_2, ship_to_street_3,
        ship_to_city, ship_to_state, ship_to_zip, ship_to_country,
        detail_amount, total_discount, total_tax, total_amount
    )
    OUTPUT INSERTED.invoice_id
    VALUES
    (
        @invoice_code, @opportunity_id, @account_id, @order_id,
        @topic, @currency, @due_date, @date_delivered,
        @payment_terms, @shipping_method,
        @bill_to_street_1, @bill_to_street_2, @bill_to_street_3,
        @bill_to_city, @bill_to_state, @bill_to_zip, @bill_to_country,
        @ship_to_street_1, @ship_to_street_2, @ship_to_street_3,
        @ship_to_city, @ship_to_state, @ship_to_zip, @ship_to_country,
        @detail_amount, @total_discount, @total_tax, @total_amount
    );
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateInvoice
(
    @invoice_id INT,
    @topic NVARCHAR(255),
    @status NVARCHAR(50),
    @currency NVARCHAR(50),
    @due_date DATE,
    @date_delivered DATE = NULL,
    @payment_terms NVARCHAR(255) = NULL,
    @shipping_method NVARCHAR(255) = NULL,
    @bill_to_street_1 NVARCHAR(255) = NULL,
    @bill_to_street_2 NVARCHAR(255) = NULL,
    @bill_to_street_3 NVARCHAR(255) = NULL,
    @bill_to_city NVARCHAR(100) = NULL,
    @bill_to_state NVARCHAR(100) = NULL,
    @bill_to_zip NVARCHAR(20) = NULL,
    @bill_to_country NVARCHAR(100) = NULL,
    @ship_to_street_1 NVARCHAR(255) = NULL,
    @ship_to_street_2 NVARCHAR(255) = NULL,
    @ship_to_street_3 NVARCHAR(255) = NULL,
    @ship_to_city NVARCHAR(100) = NULL,
    @ship_to_state NVARCHAR(100) = NULL,
    @ship_to_zip NVARCHAR(20) = NULL,
    @ship_to_country NVARCHAR(100) = NULL,
    @detail_amount DECIMAL(18,2) = 0,
    @total_discount DECIMAL(18,2) = 0,
    @total_tax DECIMAL(18,2) = 0,
    @total_amount DECIMAL(18,2) = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE invoices
    SET
        topic = @topic,
        status = @status,
        currency = @currency,
        due_date = @due_date,
        date_delivered = @date_delivered,
        payment_terms = @payment_terms,
        shipping_method = @shipping_method,
        bill_to_street_1 = @bill_to_street_1,
        bill_to_street_2 = @bill_to_street_2,
        bill_to_street_3 = @bill_to_street_3,
        bill_to_city = @bill_to_city,
        bill_to_state = @bill_to_state,
        bill_to_zip = @bill_to_zip,
        bill_to_country = @bill_to_country,
        ship_to_street_1 = @ship_to_street_1,
        ship_to_street_2 = @ship_to_street_2,
        ship_to_street_3 = @ship_to_street_3,
        ship_to_city = @ship_to_city,
        ship_to_state = @ship_to_state,
        ship_to_zip = @ship_to_zip,
        ship_to_country = @ship_to_country,
        detail_amount = @detail_amount,
        total_discount = @total_discount,
        total_tax = @total_tax,
        total_amount = @total_amount,
        updated_at = SYSDATETIMEOFFSET()
    WHERE invoice_id = @invoice_id;
END
GO

CREATE OR ALTER PROCEDURE sp_AddInvoiceProduct
(
    @invoice_id INT,
    @product_id INT,
    @unit_of_measure NVARCHAR(50),
    @price_per_unit DECIMAL(18,2),
    @quantity DECIMAL(18,2),
    @manual_discount DECIMAL(18,2) = 0,
    @tax_amount DECIMAL(18,2) = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_amount DECIMAL(18,2) =
        (@price_per_unit * @quantity) - ISNULL(@manual_discount, 0) + ISNULL(@tax_amount, 0);

    INSERT INTO invoice_products
    (
        invoice_id, product_id, unit_of_measure,
        price_per_unit, quantity, manual_discount,
        tax_amount, total_amount
    )
    VALUES
    (
        @invoice_id, @product_id, @unit_of_measure,
        @price_per_unit, @quantity, ISNULL(@manual_discount, 0),
        ISNULL(@tax_amount, 0), @total_amount
    );
END
GO

CREATE OR ALTER PROCEDURE sp_RecalculateInvoiceTotals
    @invoice_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE invoices
    SET
        detail_amount = ISNULL((
            SELECT SUM(price_per_unit * quantity)
            FROM invoice_products
            WHERE invoice_id = @invoice_id
        ), 0),
        total_discount = ISNULL((
            SELECT SUM(manual_discount)
            FROM invoice_products
            WHERE invoice_id = @invoice_id
        ), 0),
        total_tax = ISNULL((
            SELECT SUM(tax_amount)
            FROM invoice_products
            WHERE invoice_id = @invoice_id
        ), 0),
        total_amount = ISNULL((
            SELECT SUM(total_amount)
            FROM invoice_products
            WHERE invoice_id = @invoice_id
        ), 0)
    WHERE invoice_id = @invoice_id;
END
GO

CREATE OR ALTER PROCEDURE sp_DeleteInvoice
    @invoice_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM invoice_products
    WHERE invoice_id = @invoice_id;

    DELETE FROM invoices
    WHERE invoice_id = @invoice_id;
END
GO


-----------------------------------------
CREATE OR ALTER PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        user_id,
        employee_code,
        name,
        email,
        phone_number,
        department,
        designation,
        role,
        is_active,
        last_login,
        created_at,
        updated_at,
        notes
    FROM users
    ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        user_id,
        employee_code,
        name,
        email,
        phone_number,
        department,
        designation,
        role,
        notes,
        is_active,
        last_login,
        created_at,
        updated_at
    FROM users
    WHERE user_id = @UserId;
END
GO

CREATE OR ALTER PROCEDURE sp_CheckUserPhone
    @Phone NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        user_id
    FROM users
    WHERE phone_number = @Phone;
END
GO

CREATE OR ALTER PROCEDURE sp_CheckUserEmailForCreate
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 user_id
    FROM users
    WHERE email = @Email;
END
GO

CREATE OR ALTER PROCEDURE sp_CheckUserEmailForUpdate
    @Email NVARCHAR(255),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 user_id
    FROM users
    WHERE email = @Email
      AND user_id <> @UserId;
END
GO

CREATE OR ALTER PROCEDURE sp_CreateUser
(
    @name NVARCHAR(255),
    @email NVARCHAR(255),
    @password_hash NVARCHAR(255),
    @role NVARCHAR(50),
    @employee_code NVARCHAR(100) = NULL,
    @phone_number NVARCHAR(50) = NULL,
    @department NVARCHAR(100) = NULL,
    @designation NVARCHAR(100) = NULL,
    @notes NVARCHAR(MAX) = NULL,
    @is_active BIT = 1
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO users
    (
        name,
        email,
        password_hash,
        role,
        employee_code,
        phone_number,
        department,
        designation,
        notes,
        is_active
    )
    VALUES
    (
        @name,
        @email,
        @password_hash,
        @role,
        @employee_code,
        @phone_number,
        @department,
        @designation,
        @notes,
        @is_active
    );

    SELECT SCOPE_IDENTITY() AS user_id;
END
GO


CREATE OR ALTER PROCEDURE sp_UpdateUser
(
    @user_id INT,
    @name NVARCHAR(255),
    @email NVARCHAR(255),
    @role NVARCHAR(50),
    @employee_code NVARCHAR(100) = NULL,
    @phone_number NVARCHAR(50) = NULL,
    @department NVARCHAR(100) = NULL,
    @designation NVARCHAR(100) = NULL,
    @notes NVARCHAR(MAX) = NULL,
    @is_active BIT = 1,
    @password_hash NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE users
    SET
        name = @name,
        email = @email,
        role = @role,
        employee_code = @employee_code,
        phone_number = @phone_number,
        department = @department,
        designation = @designation,
        notes = @notes,
        is_active = @is_active,
        password_hash = COALESCE(@password_hash, password_hash),
        updated_at = SYSDATETIMEOFFSET()
    WHERE user_id = @user_id;
END
GO


CREATE OR ALTER PROCEDURE sp_DeleteUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM users
    WHERE user_id = @UserId;
END
GO

CREATE OR ALTER PROCEDURE sp_CheckUserEmailForUpdate
(
    @Email NVARCHAR(255),
    @UserId INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 user_id
    FROM users
    WHERE email = @Email
      AND user_id <> @UserId;
END
GO

-----------------------------------
CREATE OR ALTER PROCEDURE sp_DashboardOverview
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @account_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*)
         FROM sales_leads sl
         WHERE (@from_date IS NULL OR sl.created_at >= @from_date)
           AND (@to_date IS NULL OR sl.created_at < DATEADD(DAY, 1, @to_date))
        ) AS totalLeads,

        (SELECT COUNT(*)
         FROM sales_leads sl
         WHERE sl.status = 'Qualified'
           AND (@from_date IS NULL OR sl.created_at >= @from_date)
           AND (@to_date IS NULL OR sl.created_at < DATEADD(DAY, 1, @to_date))
        ) AS qualifiedLeads,

        (SELECT COUNT(*)
         FROM opportunities o
         WHERE o.status NOT IN ('Won', 'Lost')
           AND (@from_date IS NULL OR o.created_at >= @from_date)
           AND (@to_date IS NULL OR o.created_at < DATEADD(DAY, 1, @to_date))
           AND (@account_id IS NULL OR o.account_id = @account_id)
        ) AS openOpportunities,

        (SELECT COUNT(*)
         FROM opportunities o
         WHERE o.status = 'Won'
           AND (@from_date IS NULL OR o.created_at >= @from_date)
           AND (@to_date IS NULL OR o.created_at < DATEADD(DAY, 1, @to_date))
           AND (@account_id IS NULL OR o.account_id = @account_id)
        ) AS wonOpportunities,

        (SELECT ISNULL(SUM(i.total_amount), 0)
         FROM invoices i
         JOIN orders ord ON i.order_id = ord.order_id
         WHERE i.status = 'Paid'
           AND (@from_date IS NULL OR i.created_at >= @from_date)
           AND (@to_date IS NULL OR i.created_at < DATEADD(DAY, 1, @to_date))
           AND (@account_id IS NULL OR ord.account_id = @account_id)
        ) AS revenue;
END
GO

CREATE OR ALTER PROCEDURE sp_DashboardLeadStatus
    @from_date DATE = NULL,
    @to_date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sl.status,
        COUNT(*) AS count
    FROM sales_leads sl
    WHERE sl.status IN ('Qualified', 'Disqualified')
      AND (@from_date IS NULL OR sl.created_at >= @from_date)
      AND (@to_date IS NULL OR sl.created_at < DATEADD(DAY, 1, @to_date))
    GROUP BY sl.status;
END
GO

CREATE OR ALTER PROCEDURE sp_DashboardOpportunityStatus
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @account_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        o.status,
        COUNT(*) AS count
    FROM opportunities o
    WHERE (@from_date IS NULL OR o.created_at >= @from_date)
      AND (@to_date IS NULL OR o.created_at < DATEADD(DAY, 1, @to_date))
      AND (@account_id IS NULL OR o.account_id = @account_id)
    GROUP BY o.status;
END
GO

CREATE OR ALTER PROCEDURE sp_DashboardSalesConversion
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @account_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*)
         FROM quotes q
         WHERE (@from_date IS NULL OR q.created_at >= @from_date)
           AND (@to_date IS NULL OR q.created_at < DATEADD(DAY, 1, @to_date))
           AND (@account_id IS NULL OR q.account_id = @account_id)
        ) AS quotes,

        (SELECT COUNT(*)
         FROM orders o
         WHERE (@from_date IS NULL OR o.created_at >= @from_date)
           AND (@to_date IS NULL OR o.created_at < DATEADD(DAY, 1, @to_date))
           AND (@account_id IS NULL OR o.account_id = @account_id)
        ) AS orders_count,

        (SELECT COUNT(*)
         FROM invoices i
         JOIN orders ord ON i.order_id = ord.order_id
         WHERE (@from_date IS NULL OR i.created_at >= @from_date)
           AND (@to_date IS NULL OR i.created_at < DATEADD(DAY, 1, @to_date))
           AND (@account_id IS NULL OR ord.account_id = @account_id)
        ) AS invoices;
END
GO

CREATE OR ALTER PROCEDURE sp_DashboardSalesByAccount
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @account_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.account_id,
        a.account_name,
        SUM(ISNULL(i.total_amount, 0)) AS total_sales
    FROM invoices i
    JOIN orders o   ON i.order_id = o.order_id
    JOIN accounts a ON o.account_id = a.account_id
    WHERE i.status = 'Paid'
      AND (@from_date IS NULL OR i.created_at >= @from_date)
      AND (@to_date IS NULL OR i.created_at < DATEADD(DAY, 1, @to_date))
      AND (@account_id IS NULL OR a.account_id = @account_id)
    GROUP BY a.account_id, a.account_name
    ORDER BY total_sales DESC;
END
GO


CREATE OR ALTER PROCEDURE sp_DashboardSalesByProduct
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @account_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.product_id,
        p.product_name,
        SUM(ISNULL(ip.total_amount, 0)) AS total_sales
    FROM invoice_products ip
    JOIN products p ON ip.product_id = p.product_id
    JOIN invoices i ON ip.invoice_id = i.invoice_id
    JOIN orders o   ON i.order_id = o.order_id
    WHERE i.status = 'Paid'
      AND (@from_date IS NULL OR i.created_at >= @from_date)
      AND (@to_date IS NULL OR i.created_at < DATEADD(DAY, 1, @to_date))
      AND (@account_id IS NULL OR o.account_id = @account_id)
    GROUP BY p.product_id, p.product_name
    ORDER BY total_sales DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_DashboardRecentOpportunities
    @from_date DATE = NULL,
    @to_date DATE = NULL,
    @account_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 5
        opportunity_id,
        topic,
        status,
        total_amount,
        created_at
    FROM opportunities o
    WHERE (@from_date IS NULL OR o.created_at >= @from_date)
      AND (@to_date IS NULL OR o.created_at < DATEADD(DAY, 1, @to_date))
      AND (@account_id IS NULL OR o.account_id = @account_id)
    ORDER BY o.created_at DESC;
END
GO


-----------------------------------------
CREATE PROCEDURE sp_CheckQuoteExists
(
    @opportunity_id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT quote_id
    FROM quotes
    WHERE opportunity_id = @opportunity_id;
END
GO

CREATE PROCEDURE sp_CheckOrderExists
(
    @opportunity_id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT order_id
    FROM orders
    WHERE opportunity_id = @opportunity_id;
END
GO

CREATE PROCEDURE sp_CheckInvoiceExists
(
    @opportunity_id INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT invoice_id
    FROM invoices
    WHERE opportunity_id = @opportunity_id;
END
GO