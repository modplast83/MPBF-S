// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  USER: "/api/user",
  
  // Setup
  CATEGORIES: "/api/categories",
  ITEMS: "/api/items",
  CUSTOMERS: "/api/customers",
  CUSTOMER_PRODUCTS: "/api/customer-products",
  SECTIONS: "/api/sections",
  MACHINES: "/api/machines",
  USERS: "/api/users",
  MASTER_BATCHES: "/api/master-batches",
  
  // Production
  ORDERS: "/api/orders",
  JOB_ORDERS: "/api/job-orders",
  ROLLS: "/api/rolls",
  MIX_MATERIALS: "/api/mix-materials",
  MIX_ITEMS: "/api/mix-items",
  
  // Warehouse
  RAW_MATERIALS: "/api/raw-materials",
  FINAL_PRODUCTS: "/api/final-products",
  
  // Quality Management
  QUALITY_CHECK_TYPES: "/api/quality-check-types",
  QUALITY_CHECKS: "/api/quality-checks",
  CORRECTIVE_ACTIONS: "/api/corrective-actions",
  
  // Communications
  SMS_MESSAGES: "/api/sms-messages",
  
  // Demo
  INIT_DEMO_DATA: "/api/init-demo-data",
};

// Stage and status options
export const ROLL_STAGES = [
  { value: "extrusion", label: "Extrusion" },
  { value: "printing", label: "Printing" },
  { value: "cutting", label: "Cutting" },
  { value: "completed", label: "Completed" },
];

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
];

// Sidebar items
export const SIDEBAR_ITEMS = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        path: "/",
        icon: "dashboard",
      },
      {
        title: "Setup",
        path: "/setup",
        icon: "settings",
        subItems: [
          { title: "Categories", path: "/setup/categories" },
          { title: "Products", path: "/setup/products" },
          { title: "Customers", path: "/setup/customers" },
          { title: "Items", path: "/setup/items" },
          { title: "Sections", path: "/setup/sections" },
          { title: "Machines", path: "/setup/machines" },
          { title: "Users", path: "/setup/users" },
        ],
      },
      {
        title: "Production",
        path: "/production",
        icon: "precision_manufacturing",
        subItems: [
          { title: "Orders", path: "/orders" },
          { title: "Workflow", path: "/workflow" },
          { title: "Mix Materials", path: "/production/mix-materials" },
        ],
      },
      {
        title: "Warehouse",
        path: "/warehouse",
        icon: "inventory",
        subItems: [
          { title: "Raw Materials", path: "/warehouse/raw-materials" },
          { title: "Final Products", path: "/warehouse/final-products" },
        ],
      },
      {
        title: "Quality",
        path: "/quality",
        icon: "verified",
        subItems: [
          { title: "Check Types", path: "/quality/check-types" },
          { title: "Quality Checks", path: "/quality/checks" },
          { title: "Corrective Actions", path: "/quality/corrective-actions" },
        ],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Reports",
        path: "/reports",
        icon: "bar_chart",
      },
      {
        title: "Tools",
        path: "/tools",
        icon: "calculate",
        subItems: [
          { title: "Bag Weight Calculator", path: "/tools/bag-weight" },
          { title: "Ink Consumption", path: "/tools/ink-consumption" },
          { title: "Utility Tools", path: "/tools/utilities" },
        ],
      },
      {
        title: "System Settings",
        path: "/system",
        icon: "admin_panel_settings",
        subItems: [
          { title: "Database", path: "/system/database" },
          { title: "Permissions", path: "/system/permissions" },
          { title: "Import & Export", path: "/system/import-export" },
          { title: "SMS Management", path: "/system/sms" },
        ],
      },
    ],
  },
];

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

// Chart colors
export const CHART_COLORS = {
  primary: "rgb(25, 118, 210)",
  secondary: "rgb(156, 39, 176)",
  success: "rgb(76, 175, 80)",
  error: "rgb(244, 67, 54)",
  warning: "rgb(255, 152, 0)",
  info: "rgb(33, 150, 243)",
};
