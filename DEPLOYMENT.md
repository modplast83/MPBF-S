# Deployment Instructions

This document provides instructions for deploying the MPBF System application, including setting up the database and fixing common issues.

## Fixing "relation users does not exist" Error

If you encounter a "relation users does not exist" error after deploying the application, it means the database tables haven't been created properly in your production environment. Follow these steps to fix it:

### 1. Run the Production Migration Script

The application now includes a special production migration script that will create all required tables even in a constrained production environment:

```bash
# Run the production migration script
node production-migration.js
```

This script:
- Checks if the users table exists
- If not, it tries to run the full SQL migration
- If the SQL file isn't available, it creates the essential authentication tables directly
- Creates an admin user if needed (username: admin, password: admin123)
- Works specifically for Neon PostgreSQL databases

### Important Notes for mpbf.modplastic.com

If you're deploying to the mpbf.modplastic.com production site:

1. Transfer the production-migration.js file to the server
2. Make sure node is installed and available
3. Run the script with the DATABASE_URL environment variable set

### 2. Manual SQL Migration (Alternative)

If the deployment script doesn't work, you can run the SQL migration file directly:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# From the psql prompt, execute the SQL file
\i migrations/0000_greedy_corsair.sql
```

### 3. Deploy After Migration

After successfully running the migration, deploy the application again:

```bash
# Build the application
npm run build

# Start the application
npm run start
```

## Common Deployment Issues

### Database Connection Issues

If you experience database connection issues:

1. Verify your DATABASE_URL environment variable is correctly set
2. Ensure your database server is accessible from your deployment environment
3. Check database user permissions

### Authentication Issues

If users can't login after deployment:

1. Check if the `users` table exists and has the admin user
2. Verify that the session store is properly configured with the PostgreSQL connection
3. Clear browser cookies and cache

## Deployment Checklist

Before deploying:

- Set all required environment variables (DATABASE_URL, etc.)
- Build the application using `npm run build`
- Run database migrations
- Test authentication with the admin user
- Check for any browser console errors

## Contact

If you encounter any issues during deployment that you cannot resolve, please contact the development team for assistance.