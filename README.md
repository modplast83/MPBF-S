# Modern Plastic Bag Factory (MPBF) Management System

A comprehensive production management system for plastic bag manufacturing, offering workflow optimization with multilingual support (English and Arabic) and intelligent material management.

## Key Features

- Production tracking and workflow management
- Customer and order management
- Material calculation and mix formulas
- Quality control and corrective actions
- Warehouse inventory management
- SMS notifications
- Role-based permissions system
- Responsive design (desktop and mobile)

## Technology Stack

- **Frontend:** React with TypeScript
- **Backend:** Node.js with Express
- **Database:** PostgreSQL
- **UI Framework:** Tailwind CSS with Shadcn UI components
- **Internationalization:** i18next (English/Arabic)
- **Database ORM:** Drizzle ORM
- **Authentication:** Custom authentication system

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   # Configure your DATABASE_URL in environment variables
   # Run the database migrations
   node deploy-migration.js
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

When deploying to production, follow these steps:

1. Build the application:
   ```bash
   npm run build
   ```
2. Set up environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Additional variables for SMS, email, etc. if needed

3. Ensure the database is configured:
   ```bash
   node deploy-migration.js
   ```

4. Start the server:
   ```bash
   npm run start
   ```

For more detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Troubleshooting

If you encounter the "relation users not exist" error on deployment:

1. Make sure your DATABASE_URL environment variable is correctly set
2. Run the deployment migration script:
   ```bash
   node deploy-migration.js
   ```
3. Verify the database tables are created successfully

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 Modern Plastic Bag Factory. All rights reserved.