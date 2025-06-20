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
  MATERIAL_INPUTS: "/api/material-inputs",
  
  // Quality Management
  QUALITY_CHECK_TYPES: "/api/quality-check-types",
  QUALITY_CHECKS: "/api/quality-checks",
  CORRECTIVE_ACTIONS: "/api/corrective-actions",
  
  // Communications
  SMS_MESSAGES: "/api/sms-messages",
  
  // Cliché (Digital Photopolymer Printing Plates)
  PLATE_PRICING_PARAMETERS: "/api/plate-pricing-parameters",
  PLATE_CALCULATIONS: "/api/plate-calculations",
  CALCULATE_PLATE_PRICE: "/api/plate-calculations/calculate",
  
  // ABA Calculator
  ABA_MATERIAL_CONFIGS: "/api/aba-material-configs",
  
  // Database Management
  DATABASE_BACKUP: "/api/database/backup",
  DATABASE_RESTORE: "/api/database/restore",
  DATABASE_BACKUPS: "/api/database/backups",
  
  // Demo
  INIT_DEMO_DATA: "/api/init-demo-data",
  
  // HR Module
  TIME_ATTENDANCE: "/api/time-attendance",
  EMPLOYEE_OF_MONTH: "/api/employee-of-month",
  HR_VIOLATIONS: "/api/hr-violations",
  HR_COMPLAINTS: "/api/hr-complaints",
  
  // Maintenance Module
  MAINTENANCE_REQUESTS: "/api/maintenance-requests",
  MAINTENANCE_ACTIONS: "/api/maintenance-actions",
  MAINTENANCE_SCHEDULE: "/api/maintenance-schedule",
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
  { value: "processing", label: "For Production" },
  { value: "hold", label: "Hold" },
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
          { title: "Quality Check Types", path: "/quality/check-types" },
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
          { title: "Bottleneck Monitor", path: "/production/bottleneck-dashboard" },
          { title: "Production Metrics", path: "/production/metrics-input" },
          { title: "IoT Monitor", path: "/production/iot-monitor" },
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
          { title: "Unified Dashboard", path: "/quality/unified-dashboard" },
          { title: "Training", path: "/quality/training" },
          { title: "Certificates", path: "/quality/certificates" },
        ],
      },
      {
        title: "hr",
        path: "/hr",
        icon: "people",
        subItems: [
          { title: "attendance", path: "/hr/enhanced-attendance" },
          { title: "employee_management", path: "/hr/employee-management" },
          { title: "employee_ranks", path: "/hr/employee-ranks" },
          { title: "overtime_leave", path: "/hr/overtime-leave" },
          { title: "geofence_management", path: "/hr/geofences" },
          { title: "employee_of_the_month", path: "/hr/employee-of-month" },
          { title: "violation_and_complaint", path: "/hr/violations-complaints" },

        ],
      },
      {
        title: "Maintenance",
        path: "/maintenance",
        icon: "build",
        subItems: [
          { title: "Maintenance Requests", path: "/maintenance/requests" },
          { title: "Maintenance Actions", path: "/maintenance/actions" },
          { title: "Maintenance Schedule", path: "/maintenance/schedule" },
          { title: "Dashboard", path: "/maintenance/dashboard" },
        ],
      },
      {
        title: "Mobile Operations",
        path: "/mobile",
        icon: "smartphone",
        subItems: [
          { title: "Operator Tasks", path: "/mobile/tasks" },
          { title: "Quick Updates", path: "/mobile/updates" },
          { title: "Device Management", path: "/mobile/devices" },
        ],
      },
    ],
  },
  {
    title: "Employee",
    items: [
      {
        title: "My Dashboard",
        path: "/employee-dashboard",
        icon: "person",
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
          { title: "Order Design", path: "/tools/order-design" },
          { title: "Bag Weight Calculator", path: "/tools/bag-weight" },
          { title: "Ink Consumption", path: "/tools/ink-consumption" },
          { title: "Mix Colors", path: "/tools/mix-colors" },
          { title: "Utility Tools", path: "/tools/utilities" },
          { title: "Cost", path: "/tools/cost-calculator" },
          { title: "Cliches", path: "/cliches" },
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
          { title: "Server Management", path: "/system/server-restart" },
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
  primary: "rgb(59, 130, 246)",      // Tailwind blue-500
  primaryLight: "rgba(59, 130, 246, 0.2)", // Tailwind blue-500 with opacity
  secondary: "rgb(139, 92, 246)",    // Tailwind purple-500
  success: "rgb(16, 185, 129)",      // Tailwind emerald-500
  successLight: "rgba(16, 185, 129, 0.2)", // Tailwind emerald-500 with opacity
  error: "rgb(239, 68, 68)",         // Tailwind red-500
  warning: "rgb(245, 158, 11)",      // Tailwind amber-500
  info: "rgb(14, 165, 233)",         // Tailwind sky-500
  gray: "rgb(107, 114, 128)",        // Tailwind gray-500
  grayLight: "rgba(243, 244, 246, 0.8)", // Tailwind gray-100 with opacity
};
