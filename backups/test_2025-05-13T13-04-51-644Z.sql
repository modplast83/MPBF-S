-- Database backup created on 2025-05-13T13:04:51.751Z

-- Table: public.categories
CREATE TABLE IF NOT EXISTS "public"."categories" (
  "id" text,
  "name" text,
  "code" text
);

-- Data for table: public.categories
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT001', 'Packet Trash Bag', 'PTB');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT002', 'Roll Trash Bag', 'RTB');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT003', 'T-Shirt Bag', 'TSB');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT004', 'Calendar Bag', 'CB');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT005', 'Folded Table Cover', 'FTC');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT006', 'Non-Folded Table Cover', 'N-FTC');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT007', 'Nylon Factory', 'Nyl-Fact');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT008', 'Nylon Bag', 'SampNyl');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT009', 'LD Bag', 'LD Samp');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT010', 'HD Bag', 'HD Samp');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT011', 'Fertilizer Bag', 'FB');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT012', 'Charcoal Bag', 'CHB');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT013', 'Bakery Bag and Cover', 'BBC');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT014', 'Rubber TC', 'RTC');
INSERT INTO "public"."categories" ("id", "name", "code") VALUES ('CAT015', 'Uncategories', 'UC');

-- Table: public.customers
CREATE TABLE IF NOT EXISTS "public"."customers" (
  "id" text,
  "code" text,
  "name" text,
  "name_ar" text,
  "user_id" text,
  "plate_drawer_code" text
);

-- Data for table: public.customers
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID001', 'CID001', '2000 Center', 'مركز 2000', '0U38', 'A-30');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID002', 'CID002', 'Safi Trading Establishment', 'مؤسسة صافي التجارية', '0U38', 'B-61');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID003', 'CID003', 'Saae Carwash', 'Saae غسيل السيارات', '0U38', 'F-17');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID004', 'CID004', 'Quraish', 'قريش', '0U26', NULL);
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID005', 'CID005', 'Qutbah Charcoal', 'قطبة فحم', '0U38', 'E-8');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID006', 'CID006', 'Moon Light', 'ضوء القمر', '0U38', 'A-44');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID007', 'CID007', '3S Shoes', 'أحذية 3S', '0U38', 'B-11');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID008', 'CID008', '621 Shopping Center', '621 مركز تسوق', '0U38', 'E-43');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID009', 'CID009', 'A.A. Aqeel Trading Center (ATE)', 'مركز عقيل التجاري (ATE)', '0U38', 'B-47');
INSERT INTO "public"."customers" ("id", "code", "name", "name_ar", "user_id", "plate_drawer_code") VALUES ('CID010', 'CID010', 'A. Ghani Hauti Couture', 'أ. غني هوتي كوتور', '0U38', 'B-30');

-- Additional tables and data would be included here