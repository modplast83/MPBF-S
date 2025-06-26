# Production Management System

## Overview
This is a comprehensive production management system built with React, TypeScript, Express.js, and PostgreSQL. The application manages manufacturing operations including order processing, production workflow, quality control, HR management, and IoT monitoring for industrial production environments.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management
- **Routing**: React Router for client-side navigation
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with ES modules
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session-based auth
- **File Uploads**: Express-fileupload middleware
- **Email**: SendGrid integration for notifications
- **SMS**: Taqnyat API integration for SMS notifications

## Key Components

### Core Modules
1. **Setup Management**: Categories, products, customers, items, sections, machines, users
2. **Production Workflow**: Order management, job orders, material mixing, quality control
3. **HR Management**: Time attendance, employee tracking, violations, complaints
4. **Quality Assurance**: Quality checks, corrective actions, violations tracking
5. **IoT Integration**: Machine sensors, real-time monitoring, alerts
6. **Dashboard System**: Customizable dashboards with widgets
7. **Notification System**: Email, SMS, and in-app notifications

### Database Schema
- **Users & Permissions**: Role-based access control with section-based permissions
- **Production Entities**: Categories, items, customers, orders, job orders, rolls
- **Quality Management**: Quality check types, quality checks, corrective actions
- **Material Management**: Raw materials, final products, mix materials
- **HR Entities**: Time attendance, employee records, violations, complaints
- **IoT Data**: Machine sensors, sensor data, IoT alerts

## Data Flow

### Authentication Flow
1. User login via Passport.js local strategy
2. Session stored in PostgreSQL using connect-pg-simple
3. User permissions checked against role and section assignments
4. Protected routes validated server-side

### Production Workflow
1. Orders created and assigned to customers
2. Job orders generated from orders with specific quantities
3. Material mixing calculated based on product specifications
4. Quality checks performed at various production stages
5. Real-time monitoring via IoT sensors
6. Notifications sent for bottlenecks or quality issues

### Data Persistence
- Primary database: PostgreSQL via Drizzle ORM
- Session storage: PostgreSQL sessions table
- File uploads: Server filesystem with metadata in database
- Real-time data: In-memory caching for IoT sensor data

## External Dependencies

### Database
- **PostgreSQL**: Primary data storage via Neon serverless
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection**: WebSocket-based connection for serverless compatibility

### Third-Party Services
- **SendGrid**: Email notifications and alerts
- **Taqnyat**: SMS messaging service for production alerts
- **Replit Auth**: Optional OAuth integration for development

### Development Tools
- **ESBuild**: Production bundling and optimization
- **TypeScript**: Full type safety across frontend and backend
- **Prettier**: Code formatting with custom ignore rules
- **Tailwind CSS**: Utility-first styling with professional theme

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: ESBuild bundles Node.js server to `dist/index.js`
- Database: Drizzle pushes schema changes to PostgreSQL
- Assets: Static files served from `attached_assets` directory

### Production Configuration
- **Port Mapping**: Local 5000 → External 80 for main application
- **Environment**: ES modules with proper import/export syntax
- **Database**: Auto-provisioned PostgreSQL with connection pooling
- **Sessions**: Persistent session storage in database
- **CORS**: Configured for cross-origin requests

### Deployment Files
- `build.js`: Custom build script with ES module compatibility
- `deploy-server.js`: Standalone production server
- Multiple deployment scripts for different environments
- Health check endpoints for monitoring

## Recent Changes
- June 25, 2025: Completed comprehensive bug analysis and fixes:
  - Fixed Dialog accessibility warnings by adding missing DialogDescription components
  - Resolved React accessibility compliance issues in JO Mix, ABA Formulas, SMS, and Permissions pages
  - Documented React Beautiful DnD deprecation warnings (library-level, no action needed)
  - Verified server and database connectivity functioning correctly
  - Confirmed API endpoints responding properly with authentication working
  - Created detailed bug analysis report documenting all findings
- June 25, 2025: Fixed ABA Formula creation issues:
  - Changed misleading error message "All materials must be selected" to clearer guidance
  - Fixed typo in validation code (Title → title)
  - Fixed API request parameter order causing fetch errors
  - Updated server-side validation to handle data transformation between frontend and database
  - Added proper data format conversion (aToB number ↔ abRatio text)
  - Fixed database schema mismatch (raw_material_id → material_id)
  - Single material selection now works properly
- June 25, 2025: Added view and print functionality to ABA Formulas:
  - Added view dialog showing complete formula details and material composition
  - Added print function generating formatted reports with formula information
  - Enhanced table with view, print, and edit action buttons
- June 25, 2025: Fixed ABA Formula update validation errors:
  - Resolved duplicate PUT routes causing "Invalid ABA formula data" errors
  - Fixed data transformation between frontend (aToB number) and backend (abRatio text)
  - Added missing deleteAbaFormulaMaterialsByFormula method to database storage
  - Enhanced error logging with detailed validation messages
  - Update route now handles both complete updates (with materials) and partial updates
- June 25, 2025: Completed JO Mix functionality for Job Orders with ABA mixing calculations:
  - Created database schema for JO mixes, mix items, and mix materials tables
  - Added comprehensive API endpoints for creating, viewing, and managing JO mixes
  - Implemented automatic mix capacity splitting (550kg limit per mix)
  - Built professional frontend interface with job order selection and mix preview
  - Added real-time material quantity calculations based on ABA formula percentages
  - Created mix number auto-generation with date-based sequencing
  - Integrated with existing ABA formulas and job orders systems
  - Fixed API parameter order and database type mismatches
  - Added JO Mix to Production sidebar navigation menu
  - Successfully tested with 6 mixes created and properly fetched
  - Added professional print functionality for individual mix reports with detailed information
  - Updated mixer capacity flexibility from 550kg to 600kg for single mix optimization
  - Implemented material quantity rounding to nearest 25 or its multiples for practical mixing
- June 25, 2025: Enhanced JO Mix tables with percentage display:
  - Added Percent% column to JO Mixes table showing each mix percentage of total
  - Added percentage information to Mix Details dialog for each material
  - Updated database schema to store material percentages in JO mix materials
- June 25, 2025: Fixed ABA Formula A:B Ratio field and material validation:
  - Changed A:B Ratio to accept separate A and B values with real-time ratio calculation
  - Added validation to prevent materials from having 0 values in percentages
  - Updated material input fields to have minimum value of 0.01 instead of 0
  - Enhanced form validation with clearer error messages for invalid material percentages
- June 25, 2025: Fixed ABA formula ratio display formatting:
  - Updated Select ABA Formula dropdown to show clean decimal format (0.43:1.00)
  - Enhanced Mix Preview section to show properly formatted A:B ratios
  - Applied consistent decimal formatting throughout JO Mix creation interface
- June 25, 2025: Added comprehensive Arabic translation support:
  - Added complete Arabic translation keys for ABA Formula, JO Mix, and Job Orders pages
  - Included all table headers, form fields, validation messages, and action buttons
  - Enhanced i18n support for production management workflows
- June 25, 2025: Enhanced JO Mix creation interface with Material column:
  - Added Material column to Select Job Orders table after Master Batch column
  - Displays item/material name for better visibility during mix creation
  - Applied consistent center alignment styling across all table elements
- June 25, 2025: Enhanced customer search functionality for bilingual support:
  - Updated customer search in New Order to search both English and Arabic names
  - Improved Fuse.js configuration to include nameAr field for Arabic text search
  - Enhanced search algorithm to handle Arabic text patterns and word matching
  - Updated search placeholder text to indicate bilingual search capability
- June 25, 2025: Enhanced JO Mix Select Job Orders table with advanced functionality:
  - Added Raw Material column displaying category information for better material visibility
  - Implemented comprehensive filtering system for Customer, Raw Material, and Status
  - Added sortable columns with visual indicators for all table headers
  - Enhanced table with interactive sorting and filtering for improved job order selection
- June 26, 2025: Fixed JO Mix table data loading and display issues:
  - Fixed Customer Name column to display actual company names instead of "Unknown Customer"
  - Corrected data mapping to use customer ID from customer product relationship
  - Fixed Raw Material column to show proper category names like "Roll Trash Bag", "T-Shirt Bag"
  - Fixed Size column to display accurate dimension format like "9+9+32", "10+10+28"
  - Resolved Select component error by replacing empty string values with "all"
  - Enhanced data transformation logic to handle complex relationship mappings

## Changelog
- June 25, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.