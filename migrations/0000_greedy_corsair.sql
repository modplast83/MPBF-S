CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	CONSTRAINT "categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "corrective_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quality_check_id" integer NOT NULL,
	"assigned_to" text,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" timestamp,
	"completed_date" timestamp,
	"verified_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "customer_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"category_id" text NOT NULL,
	"item_id" text NOT NULL,
	"size_caption" text,
	"width" double precision,
	"left_f" double precision,
	"right_f" double precision,
	"thickness" double precision,
	"thickness_one" double precision,
	"printing_cylinder" double precision,
	"length_cm" double precision,
	"cutting_length_cm" double precision,
	"raw_material" text,
	"master_batch_id" text,
	"printed" text,
	"cutting_unit" text,
	"unit_weight_kg" double precision,
	"packing" text,
	"punching" text,
	"cover" text,
	"volum" text,
	"knife" text,
	"notes" text,
	CONSTRAINT "customer_products_customer_id_item_id_unique" UNIQUE("customer_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"user_id" text,
	"plate_drawer_code" text,
	CONSTRAINT "customers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "final_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_order_id" integer NOT NULL,
	"quantity" double precision NOT NULL,
	"completed_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'in-stock' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"customer_product_id" integer NOT NULL,
	"quantity" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_id" text,
	CONSTRAINT "job_orders_order_id_customer_product_id_unique" UNIQUE("order_id","customer_product_id")
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"section_id" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "master_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_input_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"input_id" integer NOT NULL,
	"raw_material_id" integer NOT NULL,
	"quantity" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_inputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "mix_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"mix_id" integer NOT NULL,
	"raw_material_id" integer NOT NULL,
	"quantity" double precision NOT NULL,
	"percentage" double precision DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "mix_machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"mix_id" integer NOT NULL,
	"machine_id" text NOT NULL,
	CONSTRAINT "mix_machines_mix_id_machine_id_unique" UNIQUE("mix_id","machine_id")
);
--> statement-breakpoint
CREATE TABLE "mix_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"mix_date" timestamp DEFAULT now() NOT NULL,
	"mix_person" text NOT NULL,
	"order_id" integer,
	"total_quantity" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"customer_id" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"module" text NOT NULL,
	"can_view" boolean DEFAULT false,
	"can_create" boolean DEFAULT false,
	"can_edit" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "permissions_role_module_unique" UNIQUE("role","module")
);
--> statement-breakpoint
CREATE TABLE "plate_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" text,
	"width" double precision NOT NULL,
	"height" double precision NOT NULL,
	"area" double precision NOT NULL,
	"colors" integer DEFAULT 1 NOT NULL,
	"plate_type" text NOT NULL,
	"thickness" double precision,
	"calculated_price" double precision NOT NULL,
	"base_price_per_unit" double precision,
	"color_multiplier" double precision,
	"thickness_multiplier" double precision,
	"customer_discount" double precision,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plate_pricing_parameters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" double precision NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quality_check_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"checklist_items" text[],
	"parameters" text[],
	"target_stage" text NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "quality_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"check_type_id" text NOT NULL,
	"roll_id" text,
	"job_order_id" integer,
	"performed_by" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"checklist_results" text[],
	"parameter_values" text[],
	"issue_severity" text,
	"image_urls" text[]
);
--> statement-breakpoint
CREATE TABLE "raw_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" double precision DEFAULT 0,
	"unit" text NOT NULL,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rolls" (
	"id" text PRIMARY KEY NOT NULL,
	"job_order_id" integer NOT NULL,
	"roll_serial" text NOT NULL,
	"extruding_qty" double precision DEFAULT 0,
	"printing_qty" double precision DEFAULT 0,
	"cutting_qty" double precision DEFAULT 0,
	"current_stage" text DEFAULT 'extrusion' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"waste_qty" double precision DEFAULT 0,
	"waste_percentage" double precision DEFAULT 0,
	"created_by_id" text,
	"printed_by_id" text,
	"cut_by_id" text,
	"created_at" timestamp DEFAULT now(),
	"printed_at" timestamp,
	"cut_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_phone" text NOT NULL,
	"recipient_name" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_id" integer,
	"job_order_id" integer,
	"customer_id" text,
	"sent_by" text,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"error_message" text,
	"message_type" text NOT NULL,
	"twilio_message_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"section_id" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_quality_check_id_quality_checks_id_fk" FOREIGN KEY ("quality_check_id") REFERENCES "public"."quality_checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_master_batch_id_master_batches_id_fk" FOREIGN KEY ("master_batch_id") REFERENCES "public"."master_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_products" ADD CONSTRAINT "final_products_job_order_id_job_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_customer_product_id_customer_products_id_fk" FOREIGN KEY ("customer_product_id") REFERENCES "public"."customer_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_input_items" ADD CONSTRAINT "material_input_items_input_id_material_inputs_id_fk" FOREIGN KEY ("input_id") REFERENCES "public"."material_inputs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_input_items" ADD CONSTRAINT "material_input_items_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_inputs" ADD CONSTRAINT "material_inputs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_items" ADD CONSTRAINT "mix_items_mix_id_mix_materials_id_fk" FOREIGN KEY ("mix_id") REFERENCES "public"."mix_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_items" ADD CONSTRAINT "mix_items_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_machines" ADD CONSTRAINT "mix_machines_mix_id_mix_materials_id_fk" FOREIGN KEY ("mix_id") REFERENCES "public"."mix_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_machines" ADD CONSTRAINT "mix_machines_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_materials" ADD CONSTRAINT "mix_materials_mix_person_users_id_fk" FOREIGN KEY ("mix_person") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_materials" ADD CONSTRAINT "mix_materials_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plate_calculations" ADD CONSTRAINT "plate_calculations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plate_calculations" ADD CONSTRAINT "plate_calculations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_check_type_id_quality_check_types_id_fk" FOREIGN KEY ("check_type_id") REFERENCES "public"."quality_check_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_roll_id_rolls_id_fk" FOREIGN KEY ("roll_id") REFERENCES "public"."rolls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_job_order_id_job_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_job_order_id_job_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_printed_by_id_users_id_fk" FOREIGN KEY ("printed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_cut_by_id_users_id_fk" FOREIGN KEY ("cut_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_job_order_id_job_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;