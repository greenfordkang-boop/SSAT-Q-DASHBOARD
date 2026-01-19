# SSAT Q-Dashboard - Database Setup Guide

## Overview

This application uses **Supabase** (PostgreSQL) as its database backend. Before you can use the application, you need to set up the required database tables.

## Error: "Could not find the table in the schema cache"

If you see this error, it means the database schema hasn't been applied to your Supabase project yet. Follow the steps below to fix this.

## Setup Instructions

### Step 1: Create or Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Create a new project or use an existing one
4. Wait for the project to be provisioned (this takes 1-2 minutes)

### Step 2: Apply the Database Schema

1. **Open the SQL Editor:**
   - In your Supabase dashboard, navigate to **SQL Editor** in the left sidebar
   - Click **+ New query**

2. **Copy the Schema:**
   - Open the file `supabase-schema.sql` in this repository
   - Copy the entire contents of the file

3. **Execute the Schema:**
   - Paste the SQL code into the SQL Editor
   - Click **Run** (or press Ctrl/Cmd + Enter)
   - Wait for the execution to complete (should take a few seconds)

4. **Verify the Tables:**
   - Navigate to **Table Editor** in the left sidebar
   - You should see the following tables:
     - `ncr_entries`
     - `customer_metrics`
     - `supplier_metrics`
     - `outgoing_metrics`
     - `quick_response_entries`
     - `process_quality_uploads` ⭐ (required for Excel uploads)
     - `process_quality_data` ⭐ (required for Excel uploads)

### Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Click on **API** in the left menu
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` `public` key under "Project API keys")

### Step 4: Configure the Application

#### Option A: Using the Default Configuration (Recommended for production)

The application is pre-configured with a default Supabase project. If you're deploying to production (Vercel), make sure the schema has been applied to the default project.

#### Option B: Using Your Own Supabase Project

1. Run the application locally: `npm run dev`
2. When the app loads, click the **⚙️ Settings** icon in the top navigation
3. Enter your Supabase URL and API Key from Step 3
4. Click **Save Configuration**
5. The app will reload with your custom configuration

#### Option C: Environment Variables (For Vercel Deployment)

If you want to use your own Supabase project in production:

1. Update the default values in `lib/supabaseClient.ts`:
   ```typescript
   const DEFAULT_URL = 'YOUR_SUPABASE_URL';
   const DEFAULT_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

2. Commit and push the changes
3. Redeploy to Vercel

## Database Tables

The schema creates the following tables:

### Core Tables

1. **ncr_entries** - NCR (Non-Conformance Report) tracking
2. **customer_metrics** - Customer quality metrics by month/year
3. **supplier_metrics** - Supplier quality metrics (incoming inspection)
4. **outgoing_metrics** - Outgoing quality metrics
5. **quick_response_entries** - Quick response tracking for defects

### Process Quality Tables (for Excel Upload Feature)

6. **process_quality_uploads** - Upload history and metadata
7. **process_quality_data** - Detailed defect data from Excel files

## Excel Upload Format

The Process Quality Excel upload feature expects the following columns:

| Column Name | Required | Description |
|------------|----------|-------------|
| 고객사 or 거래처 | Yes | Customer name |
| 부품유형 or 공정 | Yes | Part type or process |
| 생산수량 or 생산량 | Yes | Production quantity |
| 불량수량 or 불량량 | Yes | Defect quantity |
| 불량금액 or 금액 | Yes | Defect amount (monetary) |
| 일자 or 날짜 | Yes | Date (YYYY-MM-DD) |

The defect rate is automatically calculated: `(defect_qty / production_qty) * 100`

## Troubleshooting

### "record 'new' has no field 'updated_at'" or "Could not find the 'updated_at' column"

This error means the database triggers for auto-updating timestamps are missing or not properly configured.

**Solution:**
1. Open `verify-triggers.html` in your browser to diagnose the issue
2. Go to Supabase SQL Editor
3. Copy and run the `fix-updated-at-triggers.sql` script
4. Alternatively, re-run the complete `supabase-schema.sql` script

**Quick Fix via Supabase:**
1. Go to your Supabase dashboard → SQL Editor
2. Run this query to verify triggers exist:
   ```sql
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'public'
   ORDER BY event_object_table;
   ```
3. If no triggers are listed, run the `fix-updated-at-triggers.sql` script

### "Could not find the table 'public.process_quality_uploads'"

**Solution:** You haven't applied the database schema yet. Follow Step 2 above.

### "Invalid API key" or Connection Errors

**Solutions:**
1. Check that your Supabase project is active (not paused due to inactivity)
2. Verify your API key is correct (use the `anon` `public` key, not the `service_role` key)
3. Make sure your Project URL is correct and starts with `https://`
4. Try resetting your configuration in the app settings

### Tables Exist But Data Won't Save

**Solutions:**
1. Check your browser console for specific error messages
2. Verify RLS (Row Level Security) is disabled on the tables (the schema does this automatically)
3. Make sure your API key has the correct permissions

### Excel Upload Fails

**Solutions:**
1. Verify the Excel file has data (not empty)
2. Check that column names match the expected format (see table above)
3. Ensure all required columns are present
4. Check that numeric columns contain valid numbers

## Need Help?

If you encounter issues:

1. Check the browser console (F12) for detailed error messages
2. Verify all steps in this guide have been completed
3. Ensure your Supabase project is active and accessible
4. Try applying the schema again (it's safe to run multiple times)

## Security Notes

- The default configuration has RLS (Row Level Security) **disabled** for development ease
- For production deployments, consider enabling RLS and adding appropriate policies
- Never commit your `service_role` key to version control
- The `anon` `public` key is safe to expose in client-side code

## Schema Updates

If the schema file (`supabase-schema.sql`) is updated:

1. Review the changes in the SQL file
2. Re-run the schema in Supabase SQL Editor
3. The `CREATE TABLE IF NOT EXISTS` statements ensure existing tables won't be affected
4. New tables or columns will be added automatically
