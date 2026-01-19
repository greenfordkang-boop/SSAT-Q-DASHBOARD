<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SSAT Q-Dashboard

A comprehensive quality management dashboard for tracking NCR (Non-Conformance Reports), customer metrics, supplier metrics, and process quality data.

## Features

- **NCR Management** - Track and manage non-conformance reports
- **Customer Quality Metrics** - Monitor customer quality performance
- **Supplier Quality Metrics** - Track incoming inspection results
- **Outgoing Quality Metrics** - Monitor outgoing quality performance
- **Quick Response Tracking** - Fast defect response management
- **Process Quality Dashboard** - Upload and analyze Excel data for process quality metrics

## Prerequisites

- **Node.js** (v16 or higher)
- **Supabase Account** (free tier works fine)

## Quick Start

### 1. Database Setup (IMPORTANT - Required First!)

Before running the app, you **must** set up the Supabase database:

1. Go to [https://supabase.com](https://supabase.com) and create a project
2. Open the **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase-schema.sql` from this repository
4. Paste and execute the SQL script in the SQL Editor
5. Verify the setup using `verify-database.html` (open in browser)

**See [SETUP.md](SETUP.md) for detailed database setup instructions.**

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase Connection

**Option A: Use the app's built-in configuration (easiest)**
1. Run `npm run dev`
2. Click the ⚙️ Settings icon in the app
3. Enter your Supabase URL and API Key
4. Save and reload

**Option B: Edit the default configuration**
1. Open `lib/supabaseClient.ts`
2. Update `DEFAULT_URL` and `DEFAULT_KEY` with your Supabase credentials
3. Save the file

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy (no environment variables needed if using built-in configuration)
4. **Important:** Make sure the database schema is applied to your Supabase project before using the app

## Troubleshooting

### Error: "record 'new' has no field 'updated_at'" or "Could not find the 'updated_at' column"

This error occurs when database triggers for automatically updating timestamps haven't been properly configured.

**Quick Fix:**
1. Open [verify-triggers.html](verify-triggers.html) in your browser
2. Enter your Supabase credentials
3. Click "Check Triggers" to diagnose the issue
4. Follow the on-screen instructions to fix the problem

**Manual Fix:**
1. Go to your Supabase dashboard → SQL Editor
2. Copy the contents of `fix-updated-at-triggers.sql`
3. Paste and run the SQL script
4. Try saving data again

**Alternative Fix:**
1. Re-run the complete `supabase-schema.sql` script
2. This will recreate all triggers and ensure everything is up to date

### Error: "Could not find the table in the schema cache"

This means the database schema hasn't been applied yet. See [SETUP.md](SETUP.md) for instructions.

### Excel Upload Not Working

1. Make sure the `process_quality_uploads` and `process_quality_data` tables exist
2. Verify your Excel file has the required columns (see SETUP.md)
3. Check the browser console for specific error messages

### Database Connection Issues

1. Verify your Supabase project is active (not paused)
2. Check that your API key is correct (use the `anon` `public` key)
3. Make sure your Project URL is correct

## Documentation

- [SETUP.md](SETUP.md) - Detailed database setup guide
- [supabase-schema.sql](supabase-schema.sql) - Complete database schema
- [fix-updated-at-triggers.sql](fix-updated-at-triggers.sql) - Fix for updated_at trigger errors
- [verify-database.html](verify-database.html) - Database table verification tool
- [verify-triggers.html](verify-triggers.html) - Database trigger verification tool

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Excel Parsing:** SheetJS (xlsx)

## Project Structure

```
├── App.tsx                  # Main application component
├── components/              # React components
│   ├── ProcessQuality.tsx   # Process quality dashboard
│   └── ...
├── lib/
│   └── supabaseClient.ts    # Supabase configuration
├── types.ts                 # TypeScript type definitions
├── supabase-schema.sql      # Database schema
└── SETUP.md                 # Setup instructions
```

## Support

For issues and questions:
1. Check [SETUP.md](SETUP.md) for common problems
2. Review the browser console for error messages
3. Verify database tables exist using `verify-database.html`
4. Check database triggers using `verify-triggers.html`
5. Run `fix-updated-at-triggers.sql` if you see timestamp-related errors

## License

This project was created with AI Studio.
