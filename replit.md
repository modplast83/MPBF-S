# Advanced Production Management System - Architecture Guide

## Overview

This is a comprehensive production management system designed for modern plastic bag factories. The system provides end-to-end production tracking, quality control, inventory management, and business intelligence features built with a modern tech stack.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom Tailwind CSS styling
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom theme configuration

### Backend Architecture
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session management
- **File Handling**: Express-fileupload for document management
- **API Design**: RESTful endpoints with Zod validation

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Code-first schema definitions with migrations
- **Session Storage**: PostgreSQL-backed session store for authentication

## Key Components

### Authentication & Authorization
- Multi-tier user roles (administrator, manager, operator, quality_inspector)
- Section-based permissions system for granular access control
- Secure password hashing with scrypt algorithm
- Session-based authentication with PostgreSQL session store

### Production Management
- **Order Processing**: Complete order lifecycle from creation to delivery
- **Job Order Tracking**: Detailed production job management with status tracking
- **Workflow Management**: Multi-stage production workflow with bottleneck detection
- **Material Management**: Raw material tracking and mix formulation

### Quality Control System
- **Quality Check Types**: Configurable quality inspection templates
- **Real-time Quality Checks**: Digital inspection forms with checklist items
- **Corrective Actions**: Issue tracking and resolution workflows
- **Quality Reporting**: Comprehensive quality metrics and violation tracking

### Inventory & Warehouse
- **Raw Materials**: Inventory tracking with automatic reorder points
- **Final Products**: Finished goods management with batch tracking
- **Roll Management**: Production roll tracking with quality assurance
- **Material Inputs**: Material consumption tracking and costing

### Human Resources
- **Time & Attendance**: Employee clock-in/out with geofencing
- **Training Management**: Skills tracking and certification management
- **Employee Profiles**: Comprehensive staff information management
- **Performance Tracking**: KPI monitoring and evaluation systems

### Communication Systems
- **SMS Integration**: Automated notifications via Twilio
- **Email Services**: SendGrid integration for email communications
- **Push Notifications**: Real-time in-app notification system
- **Alert Management**: Critical event notifications and escalations

### Business Intelligence
- **Dashboard System**: Customizable widgets and metrics visualization
- **Production Analytics**: Real-time production performance monitoring
- **Quality Metrics**: Statistical quality control reporting
- **Financial Reporting**: Cost analysis and profitability tracking

## Data Flow

### Request Processing Flow
1. Client requests hit Express.js middleware stack
2. Authentication middleware validates user sessions
3. Permission middleware checks role-based access
4. Route handlers validate request data with Zod schemas
5. Business logic processes requests through storage layer
6. Database operations execute via Drizzle ORM
7. Response data returns through the same middleware chain

### Real-time Updates
- Production metrics updated via scheduled jobs
- Quality checks trigger immediate notifications
- Bottleneck detection runs continuous monitoring
- Dashboard widgets refresh on data changes

### File Processing
- Document uploads processed through express-fileupload
- Files stored in attached_assets directory
- Image processing for quality inspection photos
- CSV import/export functionality for bulk operations

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Primary database hosting with serverless scaling
- **Connection Pooling**: Efficient database connection management
- **SSL Security**: Encrypted database connections in production

### Communication Services
- **SendGrid**: Email delivery service for notifications
- **Twilio**: SMS messaging for production alerts
- **WebSocket Support**: Real-time communication capabilities

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **TypeScript**: Type safety across the entire codebase
- **ESBuild**: Fast bundling for production builds
- **Vitest**: Testing framework for unit and integration tests

## Deployment Strategy

### Production Build Process
1. Frontend assets built with Vite and optimized for production
2. Backend server bundled with ESBuild as ES modules
3. Database schema applied via Drizzle migrations
4. Environment variables configured for production services
5. Static assets served from dist/public directory

### Environment Configuration
- **Development**: Local database with hot reloading
- **Production**: Neon PostgreSQL with optimized connection pooling
- **Session Management**: PostgreSQL-backed sessions for scalability
- **Security**: Environment-specific security headers and CORS policies

### Scalability Considerations
- Stateless server design for horizontal scaling
- Database connection pooling for concurrent user support
- Efficient indexing strategy for large datasets
- Caching layer ready for Redis integration

## Changelog

```
Changelog:
- June 27, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```