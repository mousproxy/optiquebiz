-- ============================================================
-- DONNÉES DE DÉMONSTRATION — OptiGest CI
-- À exécuter APRÈS schema.sql
-- ============================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SOCIÉTÉ
-- ============================================================
INSERT INTO companies (id, name, legal_name, tax_number, rccm, address, city, country, phone, email, website, currency, tax_rate, invoice_prefix, po_prefix, quote_prefix)
VALUES (
  uuid_generate_v4(),
  'OptiGest CI',
  'OPTIGEST SARL',
  'CI-2024-12345',
  'CI-ABJ-2024-B-01234',
  'Rue des Jardins, Cocody',
  'Abidjan',
  'Côte d''Ivoire',
  '+225 07 07 07 07 07',
  'contact@optigest.ci',
  'www.optigest.ci',
  'FCFA',
  18.0,
  'FAC',
  'BC',
  'DEV'
);

-- Récupération de l'ID société pour les inserts suivants
DO $$
DECLARE
  v_company_id UUID;
  v_admin_id UUID;
  v_manager_id UUID;
  v_optician_id UUID;
  v_ophtha_id UUID;
  v_secretary_id UUID;
  v_seller_id UUID;
  v_cashier_id UUID;
  v_patient1_id UUID;
  v_patient2_id UUID;
  v_patient3_id UUID;
  v_patient4_id UUID;
  v_patient5_id UUID;
  v_patient6_id UUID;
  v_patient7_id UUID;
  v_patient8_id UUID;
  v_supp1_id UUID;
  v_supp2_id UUID;
  v_supp3_id UUID;
  v_frame1_id UUID;
  v_frame2_id UUID;
  v_frame3_id UUID;
  v_frame4_id UUID;
  v_frame5_id UUID;
  v_lens1_id UUID;
  v_lens2_id UUID;
  v_lens3_id UUID;
  v_contact1_id UUID;
  v_acc1_id UUID;
  v_acc2_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM companies LIMIT 1;

  -- ============================================================
  -- 2. UTILISATEURS
  -- ============================================================
  v_admin_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_admin_id, v_company_id, 'admin', 'Admin', 'Principal', 'admin@optigest.ci', '+225 07 00 00 00 01', 'admin',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);
  -- Mot de passe: Admin2024!

  v_manager_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_manager_id, v_company_id, 'k.ange', 'Kouassi', 'Ange', 'k.ange@optigest.ci', '+225 07 11 22 33 44', 'manager',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);

  v_optician_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_optician_id, v_company_id, 'd.fatoumata', 'Diallo', 'Fatoumata', 'd.fatoumata@optigest.ci', '+225 07 22 33 44 55', 'optician',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);

  v_ophtha_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_ophtha_id, v_company_id, 't.ibrahim', 'Dr. Traoré', 'Ibrahim', 't.ibrahim@optigest.ci', '+225 05 33 44 55 66', 'ophthalmologist',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);

  v_secretary_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_secretary_id, v_company_id, 'n.marie', 'N''Guessan', 'Marie', 'n.marie@optigest.ci', '+225 07 44 55 66 77', 'secretary',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);

  v_seller_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_seller_id, v_company_id, 'k.serge', 'Koffi', 'Serge', 'k.serge@optigest.ci', '+225 07 55 66 77 88', 'seller',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);

  v_cashier_id := uuid_generate_v4();
  INSERT INTO users (id, company_id, username, first_name, last_name, email, phone, role, password_hash, is_active)
  VALUES (v_cashier_id, v_company_id, 'c.mamadou', 'Coulibaly', 'Mamadou', 'c.mamadou@optigest.ci', '+225 07 66 77 88 99', 'cashier',
    '$2a$12$LqG6.qPp7E9HJdGpwPlYt.xAu1D7WQPMKFXSSjE6rHCVHkZD.JVNG', true);

  -- ============================================================
  -- 3. PATIENTS
  -- ============================================================
  v_patient1_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession)
  VALUES (v_patient1_id, v_company_id, 'PAT-000001', 'Ange', 'Kouassi', '1985-03-15', 'M',
    '+225 07 12 34 56 78', 'a.kouassi@email.ci', 'Résidence Les Flamboyants, Cocody', 'Abidjan', 'Ingénieur');

  v_patient2_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession, insurance_name)
  VALUES (v_patient2_id, v_company_id, 'PAT-000002', 'Fatoumata', 'Diallo', '1992-07-22', 'F',
    '+225 05 98 76 54 32', 'f.diallo@email.ci', 'Quartier Plateau, Rue du Commerce', 'Abidjan', 'Comptable', 'CNPS');

  v_patient3_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession)
  VALUES (v_patient3_id, v_company_id, 'PAT-000003', 'Ibrahim', 'Traoré', '1978-11-30', 'M',
    '+225 01 23 45 67 89', 'i.traore@email.ci', 'Yopougon, Sect. 26', 'Abidjan', 'Professeur');

  v_patient4_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession, insurance_name)
  VALUES (v_patient4_id, v_company_id, 'PAT-000004', 'Marie', 'N''Guessan', '2001-06-10', 'F',
    '+225 07 45 67 89 01', 'm.nguessan@email.ci', 'Marcory Zone 4', 'Abidjan', 'Étudiante', 'Mutuelle SIB');

  v_patient5_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession)
  VALUES (v_patient5_id, v_company_id, 'PAT-000005', 'Pascal', 'Ouattara', '1970-02-28', 'M',
    '+225 05 67 89 01 23', 'p.ouattara@email.ci', 'Adjamé Williamsville', 'Abidjan', 'Commerçant');

  v_patient6_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession)
  VALUES (v_patient6_id, v_company_id, 'PAT-000006', 'Aminata', 'Bamba', '1995-09-18', 'F',
    '+225 07 89 01 23 45', 'a.bamba@email.ci', 'Treichville Port-Bouët', 'Abidjan', 'Infirmière');

  v_patient7_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city)
  VALUES (v_patient7_id, v_company_id, 'PAT-000007', 'Serge', 'Koffi', '1988-12-05', 'M',
    '+225 01 90 12 34 56', 's.koffi@email.ci', 'Bingerville Centre', 'Bingerville');

  v_patient8_id := uuid_generate_v4();
  INSERT INTO patients (id, company_id, code, first_name, last_name, date_of_birth, gender, phone, email, address, city, profession)
  VALUES (v_patient8_id, v_company_id, 'PAT-000008', 'Chloé', 'Yao', '2010-04-20', 'F',
    '+225 07 01 23 45 67', 'yao.parent@email.ci', 'Cocody Angré', 'Abidjan', 'Élève');

  -- ============================================================
  -- 4. FOURNISSEURS
  -- ============================================================
  v_supp1_id := uuid_generate_v4();
  INSERT INTO suppliers (id, company_id, company_name, contact_name, email, phone, address, city, country, payment_terms, discount_percent, is_active)
  VALUES (v_supp1_id, v_company_id, 'Luxottica Afrique Distribution', 'M. Jean-Pierre Dupont',
    'jp.dupont@luxottica-ci.com', '+225 20 22 33 44', 'Zone Industrielle, Yopougon', 'Abidjan', 'Côte d''Ivoire', 30, 5.0, true);

  v_supp2_id := uuid_generate_v4();
  INSERT INTO suppliers (id, company_id, company_name, contact_name, email, phone, address, city, country, payment_terms, discount_percent, is_active)
  VALUES (v_supp2_id, v_company_id, 'Essilor Distribution Côte d''Ivoire', 'Mme. Sali Bamba',
    's.bamba@essilor-ci.com', '+225 20 35 46 57', 'Plateau, Av. de la République', 'Abidjan', 'Côte d''Ivoire', 45, 3.0, true);

  v_supp3_id := uuid_generate_v4();
  INSERT INTO suppliers (id, company_id, company_name, contact_name, email, phone, address, city, country, payment_terms, is_active)
  VALUES (v_supp3_id, v_company_id, 'Bausch & Lomb West Africa', 'M. Ibrahima Kouyaté',
    'i.kouyate@bausch-wa.com', '+225 27 57 68 79', 'Marcory Zone 4, Rue des Fleurs', 'Abidjan', 'Côte d''Ivoire', 30, true);

  -- ============================================================
  -- 5. MONTURES
  -- ============================================================
  v_frame1_id := uuid_generate_v4();
  INSERT INTO frames (id, company_id, brand, model_name, reference, color, material, shape, gender, rim_type, lens_width, bridge_size, temple_length, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_frame1_id, v_company_id, 'Ray-Ban', 'Wayfarer Classic', 'RB2140-901-54', 'Noir mat', 'Acétate', 'Rectangulaire',
    'unisex', 'full', 54, 18, 145, 85000, 35000, 8, 3, true);

  v_frame2_id := uuid_generate_v4();
  INSERT INTO frames (id, company_id, brand, model_name, reference, color, material, shape, gender, rim_type, lens_width, bridge_size, temple_length, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_frame2_id, v_company_id, 'Oakley', 'Holbrook', 'OAK-OO9102-55-0855', 'Havane tortoiseshell', 'Acétate', 'Rectangulaire',
    'M', 'full', 55, 18, 140, 95000, 42000, 5, 2, true);

  v_frame3_id := uuid_generate_v4();
  INSERT INTO frames (id, company_id, brand, model_name, reference, color, material, shape, gender, rim_type, lens_width, bridge_size, temple_length, sale_price, purchase_price, stock_quantity, min_stock, is_active, is_featured)
  VALUES (v_frame3_id, v_company_id, 'Silhouette', 'Momentum', 'SIL-5507-FV-6040', 'Argent mat', 'Titane', 'Ronde',
    'unisex', 'rimless', 50, 17, 140, 180000, 85000, 3, 2, true, true);

  v_frame4_id := uuid_generate_v4();
  INSERT INTO frames (id, company_id, brand, model_name, reference, color, material, shape, gender, rim_type, lens_width, bridge_size, temple_length, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_frame4_id, v_company_id, 'Tom Ford', 'FT5634-B', 'TF5634-B-052-54', 'Havane brun', 'Acétate', 'Carrée',
    'F', 'full', 54, 17, 145, 220000, 95000, 4, 2, true);

  v_frame5_id := uuid_generate_v4();
  INSERT INTO frames (id, company_id, brand, model_name, reference, color, material, shape, gender, rim_type, lens_width, bridge_size, temple_length, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_frame5_id, v_company_id, 'Nano Vista', 'Ninja', 'NV-NS0880546', 'Rouge flamboyant', 'TR-90', 'Ovale',
    'child', 'full', 46, 14, 125, 45000, 18000, 12, 5, true);

  -- ============================================================
  -- 6. VERRES
  -- ============================================================
  v_lens1_id := uuid_generate_v4();
  INSERT INTO lenses (id, company_id, brand, product_name, reference, lens_type, index_value, treatment, min_sph, max_sph, min_cyl, max_cyl, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_lens1_id, v_company_id, 'Essilor', 'Varilux Comfort 3F', 'ESS-VAR-CF3-160', 'progressive', 1.60,
    'Crizal Forte UV', -8.0, 4.0, -4.0, 0.0, 75000, 32000, 20, 5, true);

  v_lens2_id := uuid_generate_v4();
  INSERT INTO lenses (id, company_id, brand, product_name, reference, lens_type, index_value, treatment, min_sph, max_sph, min_cyl, max_cyl, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_lens2_id, v_company_id, 'Zeiss', 'Single Vision DriveSafe', 'ZSS-SV-DS-167', 'unifocal', 1.67,
    'DuraVision Platinum UV', -10.0, 6.0, -4.0, 0.0, 55000, 22000, 30, 8, true);

  v_lens3_id := uuid_generate_v4();
  INSERT INTO lenses (id, company_id, brand, product_name, reference, lens_type, index_value, treatment, min_sph, max_sph, min_cyl, max_cyl, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_lens3_id, v_company_id, 'Hoya', 'Hilux Eyas', 'HOY-HIL-EY-150', 'unifocal', 1.50,
    'EX3 anti-lumière bleue', -12.0, 8.0, -6.0, 0.0, 38000, 15000, 25, 8, true);

  -- ============================================================
  -- 7. LENTILLES DE CONTACT
  -- ============================================================
  v_contact1_id := uuid_generate_v4();
  INSERT INTO contact_lenses (id, company_id, brand, product_name, reference, lens_type, is_toric, units_per_box, base_curve, diameter, sale_price, purchase_price, stock_boxes, min_stock, is_active)
  VALUES (v_contact1_id, v_company_id, 'Acuvue', 'Oasys 1-Day', 'ACV-OAS-1D-30', 'daily', false, 30,
    8.5, 14.3, 18000, 8000, 25, 5, true);

  -- ============================================================
  -- 8. ACCESSOIRES
  -- ============================================================
  v_acc1_id := uuid_generate_v4();
  INSERT INTO accessories (id, company_id, name, reference, category, brand, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_acc1_id, v_company_id, 'Étui rigide premium aimant', 'ACC-ETU-PREM-001', 'case', 'Essilor', 3500, 1200, 50, 10, true);

  v_acc2_id := uuid_generate_v4();
  INSERT INTO accessories (id, company_id, name, reference, category, brand, sale_price, purchase_price, stock_quantity, min_stock, is_active)
  VALUES (v_acc2_id, v_company_id, 'Solution nettoyante Optic Clear 100ml', 'ACC-SOL-OC-100', 'solution', 'Bausch & Lomb', 4500, 1800, 35, 10, true);

  -- ============================================================
  -- 9. RENDEZ-VOUS
  -- ============================================================
  INSERT INTO appointments (id, company_id, patient_id, user_id, scheduled_at, duration_minutes, appointment_type, status, notes)
  VALUES
    (uuid_generate_v4(), v_company_id, v_patient1_id, v_ophtha_id,
     NOW() + INTERVAL '1 day' + TIME '09:00', 30, 'consultation', 'confirmed', 'Premier contrôle annuel'),
    (uuid_generate_v4(), v_company_id, v_patient2_id, v_ophtha_id,
     NOW() + INTERVAL '1 day' + TIME '09:30', 30, 'consultation', 'confirmed', 'Suivi myopie progressive'),
    (uuid_generate_v4(), v_company_id, v_patient3_id, v_optician_id,
     NOW() + INTERVAL '1 day' + TIME '10:00', 20, 'fitting', 'pending', 'Retrait et ajustement lunettes'),
    (uuid_generate_v4(), v_company_id, v_patient4_id, v_ophtha_id,
     NOW() + INTERVAL '2 days' + TIME '14:00', 30, 'consultation', 'confirmed', 'Renouvellement ordonnance'),
    (uuid_generate_v4(), v_company_id, v_patient5_id, v_ophtha_id,
     NOW() + INTERVAL '3 days' + TIME '10:30', 45, 'consultation', 'pending', 'Bilan complet — Diabétique');

  -- ============================================================
  -- 10. CONSULTATIONS
  -- ============================================================
  INSERT INTO consultations (id, company_id, patient_id, user_id, consultation_date,
    va_od_sc, va_od_cc, va_og_sc, va_og_cc,
    od_sph, od_cyl, od_axe, og_sph, og_cyl, og_axe,
    od_add, og_add, iop_od, iop_og,
    diagnosis, treatment, comments)
  VALUES
    (uuid_generate_v4(), v_company_id, v_patient1_id, v_ophtha_id, CURRENT_DATE - INTERVAL '60 days',
     '3/10', '10/10', '4/10', '10/10',
     -2.75, -0.50, 90, -3.00, -0.25, 85,
     NULL, NULL, 14.0, 15.0,
     'Myopie bilatérale avec astigmatisme léger',
     'Correction optique complète recommandée. Verres anti-reflets conseillés.',
     'Patient très satisfait de ses précédentes lunettes. Légère aggravation.'),
    (uuid_generate_v4(), v_company_id, v_patient5_id, v_ophtha_id, CURRENT_DATE - INTERVAL '90 days',
     '2/10', '8/10', '3/10', '9/10',
     -4.50, -1.25, 45, -4.00, -1.00, 130,
     2.50, 2.50, 16.0, 17.0,
     'Presbytie associée à myopie et astigmatisme',
     'Verres progressifs indispensables. Contrôle tension oculaire recommandé.',
     'Surveiller la pression — légèrement élevée. RDV dans 3 mois.');

  -- ============================================================
  -- 11. ORDONNANCES
  -- ============================================================
  INSERT INTO prescriptions (id, company_id, patient_id, user_id, reference, prescription_date, expiry_date,
    od_sph, od_cyl, od_axe, og_sph, og_cyl, og_axe, od_add, og_add,
    pupillary_distance_od, pupillary_distance_og,
    validity_months, distance_vision, near_vision, is_progressive)
  VALUES
    (uuid_generate_v4(), v_company_id, v_patient1_id, v_ophtha_id, 'ORD-000001',
     CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days',
     -2.75, -0.50, 90, -3.00, -0.25, 85, NULL, NULL,
     32.0, 33.0, 12, true, false, false),
    (uuid_generate_v4(), v_company_id, v_patient5_id, v_ophtha_id, 'ORD-000002',
     CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days',
     -4.50, -1.25, 45, -4.00, -1.00, 130, 2.50, 2.50,
     31.0, 31.5, 12, true, true, true);

  -- ============================================================
  -- 12. VENTES
  -- ============================================================
  DECLARE
    v_sale1_id UUID := uuid_generate_v4();
    v_sale2_id UUID := uuid_generate_v4();
    v_sale3_id UUID := uuid_generate_v4();
  BEGIN
    -- Vente 1 - Payée complète
    INSERT INTO sales (id, company_id, patient_id, user_id, reference, sale_date, subtotal, discount_percent, discount_amount, total_amount, paid_amount, remaining_amount, status, is_ready, notes)
    VALUES (v_sale1_id, v_company_id, v_patient1_id, v_seller_id, 'FAC-000001',
      CURRENT_DATE - INTERVAL '45 days', 255000, 5, 12750, 242250, 242250, 0, 'completed', true,
      'Monture + verres progressifs Varilux');

    INSERT INTO sale_items (id, sale_id, product_type, product_id, product_name, product_reference, quantity, unit_price, discount_percent, discount_amount, total_price, eye, lens_treatment)
    VALUES
      (uuid_generate_v4(), v_sale1_id, 'frame', v_frame1_id, 'Ray-Ban Wayfarer Classic', 'RB2140-901-54', 1, 85000, 5, 4250, 80750, NULL, NULL),
      (uuid_generate_v4(), v_sale1_id, 'lens', v_lens1_id, 'Essilor Varilux Comfort 3F', 'ESS-VAR-CF3-160', 1, 85000, 5, 4250, 80750, 'OD', 'Crizal Forte UV'),
      (uuid_generate_v4(), v_sale1_id, 'lens', v_lens1_id, 'Essilor Varilux Comfort 3F', 'ESS-VAR-CF3-160', 1, 85000, 5, 4250, 80750, 'OG', 'Crizal Forte UV'),
      (uuid_generate_v4(), v_sale1_id, 'accessory', v_acc1_id, 'Étui rigide premium', 'ACC-ETU-PREM-001', 1, 3500, 5, 175, 3325, NULL, NULL);

    INSERT INTO payments (id, sale_id, payment_method, amount, payment_date, received_by)
    VALUES
      (uuid_generate_v4(), v_sale1_id, 'cash', 100000, CURRENT_DATE - INTERVAL '45 days', v_cashier_id),
      (uuid_generate_v4(), v_sale1_id, 'orange_money', 142250, CURRENT_DATE - INTERVAL '45 days', v_cashier_id);

    -- Vente 2 - Paiement partiel
    INSERT INTO sales (id, company_id, patient_id, user_id, reference, sale_date, subtotal, discount_percent, discount_amount, total_amount, paid_amount, remaining_amount, status, is_ready)
    VALUES (v_sale2_id, v_company_id, v_patient5_id, v_optician_id, 'FAC-000002',
      CURRENT_DATE - INTERVAL '30 days', 370000, 0, 0, 370000, 200000, 170000, 'partial', false);

    INSERT INTO sale_items (id, sale_id, product_type, product_id, product_name, product_reference, quantity, unit_price, discount_percent, discount_amount, total_price, lens_treatment)
    VALUES
      (uuid_generate_v4(), v_sale2_id, 'frame', v_frame3_id, 'Silhouette Momentum', 'SIL-5507-FV-6040', 1, 180000, 0, 0, 180000, NULL),
      (uuid_generate_v4(), v_sale2_id, 'lens', v_lens1_id, 'Essilor Varilux Comfort 3F OD', 'ESS-VAR-CF3-160', 1, 75000, 0, 0, 75000, 'Transitions Signature'),
      (uuid_generate_v4(), v_sale2_id, 'lens', v_lens1_id, 'Essilor Varilux Comfort 3F OG', 'ESS-VAR-CF3-160', 1, 75000, 0, 0, 75000, 'Transitions Signature'),
      (uuid_generate_v4(), v_sale2_id, 'accessory', v_acc2_id, 'Solution Optic Clear 100ml', 'ACC-SOL-OC-100', 1, 4500, 0, 0, 4500, NULL);

    INSERT INTO payments (id, sale_id, payment_method, amount, payment_date, received_by)
    VALUES (uuid_generate_v4(), v_sale2_id, 'cash', 200000, CURRENT_DATE - INTERVAL '30 days', v_cashier_id);

    -- Vente 3 - En attente (aujourd'hui)
    INSERT INTO sales (id, company_id, patient_id, user_id, reference, sale_date, subtotal, discount_percent, discount_amount, total_amount, paid_amount, remaining_amount, status, is_ready)
    VALUES (v_sale3_id, v_company_id, v_patient2_id, v_seller_id, 'FAC-000003',
      CURRENT_DATE, 58500, 10, 5850, 52650, 0, 52650, 'pending', false);

    INSERT INTO sale_items (id, sale_id, product_type, product_id, product_name, product_reference, quantity, unit_price, discount_percent, discount_amount, total_price)
    VALUES
      (uuid_generate_v4(), v_sale3_id, 'frame', v_frame5_id, 'Nano Vista Ninja', 'NV-NS0880546', 1, 45000, 10, 4500, 40500),
      (uuid_generate_v4(), v_sale3_id, 'lens', v_lens3_id, 'Hoya Hilux Eyas OD', 'HOY-HIL-EY-150', 1, 38000, 10, 3800, 34200),
      (uuid_generate_v4(), v_sale3_id, 'lens', v_lens3_id, 'Hoya Hilux Eyas OG', 'HOY-HIL-EY-150', 1, 38000, 10, 3800, 34200);
  END;

  -- ============================================================
  -- 13. COMMANDES FOURNISSEURS
  -- ============================================================
  DECLARE v_po1_id UUID := uuid_generate_v4();
  BEGIN
    INSERT INTO purchase_orders (id, company_id, supplier_id, user_id, reference, order_date, expected_date, total_amount, paid_amount, remaining_amount, status, notes)
    VALUES (v_po1_id, v_company_id, v_supp1_id, v_manager_id, 'BC-000001',
      CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '10 days',
      850000, 500000, 350000, 'sent',
      'Commande réapprovisionnement Ray-Ban + Oakley');

    INSERT INTO purchase_order_items (id, purchase_order_id, product_type, product_id, product_name, product_reference, quantity_ordered, quantity_received, unit_price, total_price)
    VALUES
      (uuid_generate_v4(), v_po1_id, 'frame', v_frame1_id, 'Ray-Ban Wayfarer Classic RB2140', 'RB2140-901-54', 10, 0, 35000, 350000),
      (uuid_generate_v4(), v_po1_id, 'frame', v_frame2_id, 'Oakley Holbrook', 'OAK-OO9102-55-0855', 10, 0, 42000, 420000),
      (uuid_generate_v4(), v_po1_id, 'accessory', v_acc1_id, 'Étui rigide premium', 'ACC-ETU-PREM-001', 50, 0, 1200, 60000),
      (uuid_generate_v4(), v_po1_id, 'accessory', v_acc2_id, 'Solution Optic Clear 100ml', 'ACC-SOL-OC-100', 10, 0, 1800, 18000);
  END;

  -- ============================================================
  -- 14. SESSION CAISSE
  -- ============================================================
  INSERT INTO cash_sessions (id, company_id, user_id, opened_at, opening_amount, current_balance, is_open)
  VALUES (uuid_generate_v4(), v_company_id, v_cashier_id, NOW() - INTERVAL '6 hours', 50000, 292250, true);

  RAISE NOTICE '✅ Données de démonstration insérées avec succès!';
  RAISE NOTICE '📧 Connexion: admin@optigest.ci / Admin2024!';
  RAISE NOTICE '📊 Données créées: 8 patients, 5 montures, 3 verres, 1 lentille, 2 accessoires, 3 ventes, 1 commande fournisseur';
END $$;

-- ============================================================
-- 15. SÉQUENCES DE NUMÉROTATION
-- ============================================================
INSERT INTO sequences (company_id, sequence_type, prefix, next_value, padding)
SELECT id, 'invoice', 'FAC', 3, 6 FROM companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO sequences (company_id, sequence_type, prefix, next_value, padding)
SELECT id, 'prescription', 'ORD', 2, 6 FROM companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO sequences (company_id, sequence_type, prefix, next_value, padding)
SELECT id, 'patient', 'PAT', 8, 6 FROM companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO sequences (company_id, sequence_type, prefix, next_value, padding)
SELECT id, 'purchase', 'BC', 1, 6 FROM companies LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT 'Patients' AS table_name, COUNT(*) AS count FROM patients
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Frames', COUNT(*) FROM frames
UNION ALL SELECT 'Lenses', COUNT(*) FROM lenses
UNION ALL SELECT 'Contact Lenses', COUNT(*) FROM contact_lenses
UNION ALL SELECT 'Accessories', COUNT(*) FROM accessories
UNION ALL SELECT 'Suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'Consultations', COUNT(*) FROM consultations
UNION ALL SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL SELECT 'Sales', COUNT(*) FROM sales
UNION ALL SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders;
