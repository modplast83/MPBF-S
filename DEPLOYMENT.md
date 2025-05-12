# Deployment Instructions

This document provides instructions for deploying the MPBF System application, including setting up the database and fixing common issues.

## Fixing "relation users not exist" Error

If you encounter a "relation users not exist" error after deploying the application, it means the database tables haven't been created properly. Follow these steps to fix it:

### 1. Run the Database Migration Script

The application includes a deployment migration script that will create all required tables:

```bash
# Run the deployment migration script
node deploy-migration.js
```

This script:
- Checks if the users table exists
- If not, runs the full SQL migration
- Creates an admin user if needed

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