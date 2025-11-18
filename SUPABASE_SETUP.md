# Supabase Setup Guide for UNN Shuttle Booking System

## Prerequisites
- Supabase account (free tier is sufficient)
- PHP server (XAMPP, WAMP, or any PHP server)

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login to your account
3. Click "New Project"
4. Select your organization
5. Enter project name (e.g., "unn-shuttle-booking")
6. Set database password (save it securely)
7. Choose region closest to you
8. Click "Create new project"

## Step 2: Get Your Credentials
After project creation:
1. Go to Project Settings > API
2. Copy the following:
   - Project URL (looks like https://xxxxxxxx.supabase.co)
   - anon/public key
   - service_role key (keep this secret)

## Step 3: Import Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `database_supabase.sql`
3. Paste it in the SQL Editor
4. Click "Run" to execute the schema

## Step 4: Update API Configuration
1. Open `api/config.php`
2. Replace the placeholder values:
   ```php
   $supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
   $supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
   $supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY'; // Replace with your service key
   ```

## Step 5: Enable RLS (Row Level Security)
For better security, enable RLS on your tables:
1. Go to Authentication > Policies
2. Enable RLS for each table (users, routes, bookings, transactions)
3. Add policies as needed (or disable RLS for now for testing)

## Step 6: Test the API
1. Start your PHP server
2. Test registration: POST to `http://localhost/unn-shuttle/api/auth/register`
3. Test login: POST to `http://localhost/unn-shuttle/api/auth/login`

## Common Issues and Solutions

### CORS Issues
If you get CORS errors, go to:
- Project Settings > API > CORS
- Add your frontend URL (e.g., `http://localhost` or `http://127.0.0.1`)

### RLS Blocking API Calls
If you get 403 errors, disable RLS temporarily:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
```

### Date Format Issues
Supabase expects ISO 8601 date format. The API handles this automatically.

## Migration Complete!
Your UNN Shuttle Booking System is now running on Supabase instead of MySQL. All the same features are available:
- User authentication
- Profile management
- Account funding
- Route browsing
- Booking creation
- Transaction history

## Next Steps
1. Consider implementing proper RLS policies for production
2. Set up Supabase Auth for JWT-based authentication
3. Use Supabase Realtime for live updates
4. Deploy your PHP backend to a cloud service
