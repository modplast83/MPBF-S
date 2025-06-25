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

## Changelog
- June 25, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.