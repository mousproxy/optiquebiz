-- =====================================================
-- OPTIGEST - Schéma SQL Complet PostgreSQL
-- Gestion de Magasin d'Optique - Version 1.0
-- =====================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TYPES ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'optician', 'ophthalmologist', 'secretary', 'seller', 'cashier', 'commercial');
CREATE TYPE gender_type AS ENUM ('M', 'F', 'Autre');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'present', 'in_progress', 'completed', 'absent', 'cancelled', 'rescheduled');
CREATE TYPE sale_status AS ENUM ('draft', 'pending', 'completed', 'cancelled', 'refunded', 'partial');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'orange_money', 'mtn_money', 'moov_money', 'transfer', 'check', 'mixed');
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'return');
CREATE TYPE product_category AS ENUM ('frame', 'lens', 'contact_lens', 'accessory', 'service');
CREATE TYPE order_status AS ENUM ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled');
CREATE TYPE campaign_type AS ENUM ('sms', 'email', 'whatsapp');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
CREATE TYPE document_type AS ENUM ('prescription', 'invoice', 'contract', 'photo', 'scan', 'other');
CREATE TYPE journal_entry_type AS ENUM ('debit', 'credit');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE cash_movement_type AS ENUM ('opening', 'in', 'out', 'closing');

-- =====================================================
-- TABLE : PARAMÈTRES SYSTÈME
-- =====================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    label VARCHAR(200),
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : SOCIÉTÉS / MAGASINS
-- =====================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    tax_number VARCHAR(50),
    rccm VARCHAR(50),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Abidjan',
    country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(200),
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'FCFA',
    currency_symbol VARCHAR(5) DEFAULT 'F',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    invoice_prefix VARCHAR(10) DEFAULT 'FAC',
    quote_prefix VARCHAR(10) DEFAULT 'DEV',
    po_prefix VARCHAR(10) DEFAULT 'CMD',
    patient_prefix VARCHAR(10) DEFAULT 'PAT',
    footer_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : DÉPÔTS / MAGASINS
-- =====================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    manager_name VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : UTILISATEURS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    employee_number VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'seller',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    signature_url TEXT,
    default_warehouse_id UUID REFERENCES warehouses(id),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    last_login TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : RÔLES ET PERMISSIONS
-- =====================================================

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    label VARCHAR(200),
    description TEXT,
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role, permission_id)
);

CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, permission_id)
);

-- =====================================================
-- TABLE : PATIENTS
-- =====================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender_type,
    date_of_birth DATE,
    age INTEGER,
    profession VARCHAR(100),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Abidjan',
    phone VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    email VARCHAR(150),
    blood_group VARCHAR(5),
    allergies TEXT,
    insurance_name VARCHAR(100),
    insurance_number VARCHAR(50),
    mutual_name VARCHAR(100),
    mutual_number VARCHAR(50),
    mutual_rate DECIMAL(5,2),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    photo_url TEXT,
    observations TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    referral_source VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_code ON patients(code);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('french', first_name || ' ' || last_name || ' ' || COALESCE(phone, '')));

-- =====================================================
-- TABLE : ANTÉCÉDENTS MÉDICAUX
-- =====================================================

CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    condition VARCHAR(200) NOT NULL,
    diagnosis_date DATE,
    treatment TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : RENDEZ-VOUS
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),
    optician_id UUID REFERENCES users(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER DEFAULT 30,
    reason VARCHAR(200),
    room VARCHAR(50),
    status appointment_status DEFAULT 'scheduled',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    is_first_visit BOOLEAN DEFAULT FALSE,
    waiting_list_position INTEGER,
    cancelled_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

-- =====================================================
-- TABLE : CONSULTATIONS
-- =====================================================

CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Acuité visuelle OD
    va_od_sc VARCHAR(10),
    va_od_cc VARCHAR(10),
    -- Acuité visuelle OG
    va_og_sc VARCHAR(10),
    va_og_cc VARCHAR(10),
    -- Réfraction OD
    od_sph DECIMAL(5,2),
    od_cyl DECIMAL(5,2),
    od_axe INTEGER CHECK (od_axe BETWEEN 0 AND 180),
    od_add DECIMAL(4,2),
    od_prism DECIMAL(4,2),
    od_prism_base VARCHAR(10),
    -- Réfraction OG
    og_sph DECIMAL(5,2),
    og_cyl DECIMAL(5,2),
    og_axe INTEGER CHECK (og_axe BETWEEN 0 AND 180),
    og_add DECIMAL(4,2),
    og_prism DECIMAL(4,2),
    og_prism_base VARCHAR(10),
    -- Vision de près OD/OG
    np_od_sph DECIMAL(5,2),
    np_og_sph DECIMAL(5,2),
    -- Pression oculaire
    iop_od DECIMAL(5,1),
    iop_og DECIMAL(5,1),
    -- Fond d'œil
    fundus_od TEXT,
    fundus_og TEXT,
    -- Autres examens
    keratometry_od VARCHAR(100),
    keratometry_og VARCHAR(100),
    -- Diagnostic et traitement
    diagnosis TEXT,
    treatment TEXT,
    next_appointment DATE,
    comments TEXT,
    signature_url TEXT,
    is_printed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date);

-- =====================================================
-- TABLE : ORDONNANCES
-- =====================================================

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    consultation_id UUID REFERENCES consultations(id),
    doctor_id UUID REFERENCES users(id),
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- OD
    od_sph DECIMAL(5,2),
    od_cyl DECIMAL(5,2),
    od_axe INTEGER,
    od_add DECIMAL(4,2),
    od_prism DECIMAL(4,2),
    od_prism_base VARCHAR(10),
    -- OG
    og_sph DECIMAL(5,2),
    og_cyl DECIMAL(5,2),
    og_axe INTEGER,
    og_add DECIMAL(4,2),
    og_prism DECIMAL(4,2),
    og_prism_base VARCHAR(10),
    -- Mesures
    pupillary_distance_od DECIMAL(4,1),
    pupillary_distance_og DECIMAL(4,1),
    pupillary_distance_total DECIMAL(4,1),
    near_pupillary_distance DECIMAL(4,1),
    height_od DECIMAL(4,1),
    height_og DECIMAL(4,1),
    -- Options
    is_progressive BOOLEAN DEFAULT FALSE,
    is_bifocal BOOLEAN DEFAULT FALSE,
    distance_vision BOOLEAN DEFAULT TRUE,
    near_vision BOOLEAN DEFAULT FALSE,
    -- Commentaires
    comments TEXT,
    validity_months INTEGER DEFAULT 12,
    expiry_date DATE,
    qr_code TEXT,
    is_printed BOOLEAN DEFAULT FALSE,
    is_used BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date);

-- =====================================================
-- TABLE : MARQUES
-- =====================================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    country VARCHAR(50),
    logo_url TEXT,
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : MONTURES
-- =====================================================

CREATE TABLE frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    brand_id UUID REFERENCES brands(id),
    warehouse_id UUID REFERENCES warehouses(id),
    reference VARCHAR(50) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(200),
    collection VARCHAR(100),
    color VARCHAR(50),
    color_code VARCHAR(20),
    material VARCHAR(50),
    gender VARCHAR(20),
    age_group VARCHAR(20) DEFAULT 'adult',
    frame_type VARCHAR(50),
    width DECIMAL(5,1),
    height DECIMAL(5,1),
    bridge DECIMAL(5,1),
    temple DECIMAL(5,1),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    margin_percent DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN purchase_price > 0
        THEN ROUND(((sale_price - purchase_price) / purchase_price * 100)::NUMERIC, 2)
        ELSE 0 END
    ) STORED,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 2,
    photo_url TEXT,
    photo_urls JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frames_barcode ON frames(barcode);
CREATE INDEX idx_frames_brand ON frames(brand_id);
CREATE INDEX idx_frames_search ON frames USING gin(to_tsvector('french', COALESCE(reference, '') || ' ' || COALESCE(name, '') || ' ' || COALESCE(barcode, '')));

-- =====================================================
-- TABLE : VERRES
-- =====================================================

CREATE TABLE lenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    brand_id UUID REFERENCES brands(id),
    warehouse_id UUID REFERENCES warehouses(id),
    reference VARCHAR(50) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    lens_type VARCHAR(50) NOT NULL,
    material VARCHAR(50),
    index_value DECIMAL(4,2),
    treatment VARCHAR(100),
    coating VARCHAR(100),
    color VARCHAR(50),
    sphere_min DECIMAL(5,2),
    sphere_max DECIMAL(5,2),
    cylinder_min DECIMAL(5,2),
    cylinder_max DECIMAL(5,2),
    addition_min DECIMAL(4,2),
    addition_max DECIMAL(4,2),
    thickness VARCHAR(20),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : LENTILLES DE CONTACT
-- =====================================================

CREATE TABLE contact_lenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    brand_id UUID REFERENCES brands(id),
    warehouse_id UUID REFERENCES warehouses(id),
    reference VARCHAR(50) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    lens_subtype VARCHAR(50),
    replacement_frequency VARCHAR(50),
    correction_type VARCHAR(50),
    sphere DECIMAL(5,2),
    cylinder DECIMAL(5,2),
    axis INTEGER,
    addition DECIMAL(4,2),
    base_curve DECIMAL(4,2),
    diameter DECIMAL(4,1),
    water_content DECIMAL(4,1),
    material VARCHAR(100),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : ACCESSOIRES / PRODUITS
-- =====================================================

CREATE TABLE accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    warehouse_id UUID REFERENCES warehouses(id),
    reference VARCHAR(50),
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    brand_name VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'Pièce',
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : SERVICES
-- =====================================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : MOUVEMENTS DE STOCK
-- =====================================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    warehouse_id UUID REFERENCES warehouses(id),
    warehouse_dest_id UUID REFERENCES warehouses(id),
    product_type product_category NOT NULL,
    product_id UUID NOT NULL,
    movement_type movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    reference VARCHAR(100),
    lot_number VARCHAR(50),
    expiry_date DATE,
    reason TEXT,
    notes TEXT,
    related_sale_id UUID,
    related_purchase_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_type, product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);

-- =====================================================
-- TABLE : CLIENTS
-- =====================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(30) UNIQUE NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'individual',
    company_name VARCHAR(200),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Abidjan',
    tax_number VARCHAR(50),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : VENTES
-- =====================================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    warehouse_id UUID REFERENCES warehouses(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    sale_type VARCHAR(20) DEFAULT 'sale',
    patient_id UUID REFERENCES patients(id),
    customer_id UUID REFERENCES customers(id),
    prescription_id UUID REFERENCES prescriptions(id),
    seller_id UUID REFERENCES users(id),
    cashier_id UUID REFERENCES users(id),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_time TIME DEFAULT CURRENT_TIME,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) DEFAULT 0,
    status sale_status DEFAULT 'pending',
    is_ready BOOLEAN DEFAULT FALSE,
    ready_date DATE,
    notes TEXT,
    internal_notes TEXT,
    related_sale_id UUID REFERENCES sales(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_reference ON sales(reference);
CREATE INDEX idx_sales_patient ON sales(patient_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);

-- =====================================================
-- TABLE : LIGNES DE VENTE
-- =====================================================

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_type product_category NOT NULL,
    product_id UUID NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_ref VARCHAR(100),
    eye VARCHAR(5),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- =====================================================
-- TABLE : PAIEMENTS
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    sale_id UUID REFERENCES sales(id),
    reference VARCHAR(50) UNIQUE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_time TIME DEFAULT CURRENT_TIME,
    amount DECIMAL(12,2) NOT NULL,
    method payment_method NOT NULL,
    transaction_ref VARCHAR(100),
    bank_name VARCHAR(100),
    check_number VARCHAR(50),
    notes TEXT,
    cashier_id UUID REFERENCES users(id),
    cash_session_id UUID,
    is_refund BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- =====================================================
-- TABLE : FOURNISSEURS
-- =====================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
    tax_number VARCHAR(50),
    rccm VARCHAR(50),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    payment_terms INTEGER DEFAULT 30,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : COMMANDES FOURNISSEURS
-- =====================================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    warehouse_id UUID REFERENCES warehouses(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    status order_status DEFAULT 'draft',
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id),
    validated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- =====================================================
-- TABLE : LIGNES DE COMMANDE FOURNISSEUR
-- =====================================================

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_type product_category NOT NULL,
    product_id UUID,
    product_name VARCHAR(200) NOT NULL,
    product_ref VARCHAR(100),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : RÉCEPTIONS
-- =====================================================

CREATE TABLE purchase_receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    order_id UUID REFERENCES purchase_orders(id),
    supplier_id UUID REFERENCES suppliers(id),
    reception_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_number VARCHAR(50),
    invoice_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_reception_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reception_id UUID REFERENCES purchase_receptions(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES purchase_order_items(id),
    product_type product_category NOT NULL,
    product_id UUID NOT NULL,
    quantity_received INTEGER NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    lot_number VARCHAR(50),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : CAISSES
-- =====================================================

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    warehouse_id UUID REFERENCES warehouses(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_open BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_id UUID REFERENCES cash_registers(id),
    session_number VARCHAR(30) UNIQUE NOT NULL,
    opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    closing_amount DECIMAL(12,2),
    expected_amount DECIMAL(12,2),
    difference DECIMAL(12,2),
    opened_by UUID REFERENCES users(id),
    closed_by UUID REFERENCES users(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    is_open BOOLEAN DEFAULT TRUE
);

CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES cash_sessions(id),
    register_id UUID REFERENCES cash_registers(id),
    movement_type cash_movement_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2),
    reference VARCHAR(100),
    description VARCHAR(300),
    payment_id UUID REFERENCES payments(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : COMPTABILITÉ
-- =====================================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50),
    account_class VARCHAR(5),
    parent_id UUID REFERENCES accounts(id),
    is_detail BOOLEAN DEFAULT TRUE,
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    journal_type VARCHAR(50) DEFAULT 'general',
    description VARCHAR(300),
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMPTZ,
    period VARCHAR(7),
    related_document_type VARCHAR(50),
    related_document_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_id UUID REFERENCES accounts(id),
    description VARCHAR(300),
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : BANQUES ET TRÉSORERIE
-- =====================================================

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(100),
    account_number VARCHAR(50) NOT NULL,
    iban VARCHAR(50),
    swift VARCHAR(20),
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    value_date DATE,
    description VARCHAR(300),
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2),
    reference VARCHAR(100),
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : RESSOURCES HUMAINES
-- =====================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender_type,
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    end_date DATE,
    position VARCHAR(100),
    department VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'CDI',
    base_salary DECIMAL(12,2),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    national_id VARCHAR(50),
    cnps_number VARCHAR(50),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    worked_hours DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'present',
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days INTEGER,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    period VARCHAR(7) NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    housing_allowance DECIMAL(12,2) DEFAULT 0,
    other_allowances DECIMAL(12,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL,
    cnps_employee DECIMAL(12,2) DEFAULT 0,
    cnps_employer DECIMAL(12,2) DEFAULT 0,
    its DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    bonuses DECIMAL(12,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, period)
);

-- =====================================================
-- TABLE : CRM - CAMPAGNES
-- =====================================================

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(200) NOT NULL,
    campaign_type campaign_type NOT NULL,
    subject VARCHAR(300),
    content TEXT NOT NULL,
    target_segment JSONB DEFAULT '{}',
    target_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    status campaign_status DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id),
    recipient_name VARCHAR(200),
    recipient_contact VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : DOCUMENTS
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    patient_id UUID REFERENCES patients(id),
    document_type document_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_name VARCHAR(200),
    file_size INTEGER,
    mime_type VARCHAR(100),
    related_id UUID,
    related_type VARCHAR(50),
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_patient ON documents(patient_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- =====================================================
-- TABLE : NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    notification_type VARCHAR(50) DEFAULT 'info',
    related_type VARCHAR(50),
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =====================================================
-- TABLE : JOURNAL DES ACTIONS (AUDIT)
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(200),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    description TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =====================================================
-- TABLE : DEVIS
-- =====================================================

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    prescription_id UUID REFERENCES prescriptions(id),
    seller_id UUID REFERENCES users(id),
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    converted_to_sale_id UUID REFERENCES sales(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_type product_category NOT NULL,
    product_id UUID,
    product_name VARCHAR(200) NOT NULL,
    product_ref VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : AVOIRS
-- =====================================================

CREATE TABLE credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    reference VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    related_sale_id UUID REFERENCES sales(id),
    amount DECIMAL(12,2) NOT NULL,
    remaining_amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : RAPPORTS PERSONNALISÉS
-- =====================================================

CREATE TABLE saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(200) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    filters JSONB DEFAULT '{}',
    columns JSONB DEFAULT '[]',
    chart_config JSONB DEFAULT '{}',
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_cron VARCHAR(50),
    last_run TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE : NUMÉROTATION AUTOMATIQUE
-- =====================================================

CREATE TABLE sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    sequence_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20) DEFAULT '',
    suffix VARCHAR(20) DEFAULT '',
    next_value INTEGER DEFAULT 1,
    padding INTEGER DEFAULT 6,
    format VARCHAR(50) DEFAULT '{PREFIX}{NUM}',
    reset_period VARCHAR(20),
    last_reset DATE,
    UNIQUE(company_id, sequence_type)
);

-- =====================================================
-- VUES UTILES
-- =====================================================

CREATE VIEW v_patient_summary AS
SELECT
    p.id,
    p.code,
    p.first_name,
    p.last_name,
    p.phone,
    p.email,
    p.city,
    p.gender,
    p.date_of_birth,
    CASE WHEN p.date_of_birth IS NOT NULL
        THEN EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER
        ELSE NULL END AS age,
    COUNT(DISTINCT c.id) AS consultation_count,
    COUNT(DISTINCT pr.id) AS prescription_count,
    COUNT(DISTINCT s.id) AS sale_count,
    COALESCE(SUM(s.total_amount), 0) AS total_spent,
    MAX(a.appointment_date) AS last_appointment,
    MAX(s.sale_date) AS last_sale,
    p.is_active,
    p.created_at
FROM patients p
LEFT JOIN consultations c ON c.patient_id = p.id
LEFT JOIN prescriptions pr ON pr.patient_id = p.id
LEFT JOIN sales s ON s.patient_id = p.id AND s.status = 'completed'
LEFT JOIN appointments a ON a.patient_id = p.id
GROUP BY p.id;

CREATE VIEW v_daily_stats AS
SELECT
    sale_date,
    COUNT(*) AS sales_count,
    SUM(total_amount) AS total_revenue,
    SUM(paid_amount) AS total_collected,
    SUM(remaining_amount) AS total_pending,
    AVG(total_amount) AS average_sale
FROM sales
WHERE status IN ('completed', 'partial')
GROUP BY sale_date
ORDER BY sale_date DESC;

CREATE VIEW v_stock_alert AS
SELECT
    'frame' AS product_type,
    f.id,
    b.name AS brand_name,
    f.reference,
    f.name,
    f.stock_quantity,
    f.min_stock,
    (f.min_stock - f.stock_quantity) AS shortage
FROM frames f
LEFT JOIN brands b ON b.id = f.brand_id
WHERE f.stock_quantity <= f.min_stock AND f.is_active = TRUE
UNION ALL
SELECT
    'lens' AS product_type,
    l.id,
    b.name AS brand_name,
    l.reference,
    l.name,
    l.stock_quantity,
    l.min_stock,
    (l.min_stock - l.stock_quantity) AS shortage
FROM lenses l
LEFT JOIN brands b ON b.id = l.brand_id
WHERE l.stock_quantity <= l.min_stock AND l.is_active = TRUE
UNION ALL
SELECT
    'accessory' AS product_type,
    a.id,
    a.brand_name,
    a.reference,
    a.name,
    a.stock_quantity,
    a.min_stock,
    (a.min_stock - a.stock_quantity) AS shortage
FROM accessories a
WHERE a.stock_quantity <= a.min_stock AND a.is_active = TRUE;

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction de génération de numéro de séquence
CREATE OR REPLACE FUNCTION get_next_sequence(p_company_id UUID, p_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_seq RECORD;
    v_number VARCHAR;
BEGIN
    SELECT * INTO v_seq FROM sequences WHERE company_id = p_company_id AND sequence_type = p_type FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_number := REPLACE(
        REPLACE(v_seq.format, '{PREFIX}', v_seq.prefix),
        '{NUM}', LPAD(v_seq.next_value::TEXT, v_seq.padding, '0')
    );

    UPDATE sequences SET next_value = next_value + 1 WHERE id = v_seq.id;

    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction de calcul du montant total d'une vente
CREATE OR REPLACE FUNCTION recalc_sale_totals(p_sale_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL;
    v_discount DECIMAL;
    v_tax_rate DECIMAL;
    v_total DECIMAL;
    v_paid DECIMAL;
BEGIN
    SELECT
        COALESCE(SUM(total_price), 0),
        COALESCE(discount_percent, 0),
        COALESCE(tax_rate, 18)
    INTO v_subtotal, v_discount, v_tax_rate
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE si.sale_id = p_sale_id
    GROUP BY s.discount_percent, s.tax_rate;

    v_total := v_subtotal * (1 - v_discount/100);

    SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM payments WHERE sale_id = p_sale_id;

    UPDATE sales SET
        subtotal = v_subtotal,
        discount_amount = v_subtotal * v_discount / 100,
        total_amount = v_total,
        paid_amount = v_paid,
        remaining_amount = v_total - v_paid,
        status = CASE
            WHEN v_paid >= v_total THEN 'completed'
            WHEN v_paid > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX SUPPLÉMENTAIRES
-- =====================================================

CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
