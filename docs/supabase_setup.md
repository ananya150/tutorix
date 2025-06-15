# Supabase Setup Guide for Tutorix

This guide will walk you through setting up Supabase for the Tutorix project, including creating the database schema and configuring environment variables.

## Prerequisites

- A Supabase account (free tier is sufficient for development)
- Access to your Tutorix project directory

## Step 1: Create a Supabase Project

1. **Sign up/Login to Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for a free account or login if you already have one

2. **Create a New Project**
   - Click on "New Project" in your dashboard
   - Choose your organization (or create one if needed)
   - Fill in the project details:
     - **Name**: `tutorix` (or any name you prefer)
     - **Database Password**: Choose a strong password and save it securely
     - **Region**: Choose the region closest to your users
   - Click "Create new project"

3. **Wait for Project Setup**
   - Supabase will take a few minutes to set up your project
   - Once ready, you'll see your project dashboard

## Step 2: Create the Database Schema

1. **Navigate to SQL Editor**
   - In your Supabase project dashboard, click on the "SQL Editor" tab in the left sidebar
   - This opens the SQL query interface

2. **Execute the Database Setup Script**
   - Copy and paste the following SQL code into the SQL editor:

```sql
-- Create the lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  depth TEXT NOT NULL,
  lesson_plan JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on lesson_id for faster lookups
CREATE INDEX idx_lessons_lesson_id ON lessons(lesson_id);

-- Create an index on created_at for sorting
CREATE INDEX idx_lessons_created_at ON lessons(created_at);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_lessons_updated_at 
    BEFORE UPDATE ON lessons 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) - optional but recommended
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on lessons" ON lessons
    FOR ALL USING (true);
```

3. **Run the Script**
   - Click the "Run" button (or press Ctrl+Enter)
   - You should see success messages for each statement
   - If there are any errors, check the syntax and try again

## Step 3: Verify Table Creation

1. **Check the Table Browser**
   - Navigate to the "Table Editor" tab in the left sidebar
   - You should see the `lessons` table listed
   - Click on it to view the table structure

2. **Verify Table Structure**
   The table should have the following columns:
   - `id` (UUID, Primary Key)
   - `lesson_id` (UUID, Unique)
   - `topic` (Text)
   - `depth` (Text)
   - `lesson_plan` (JSONB)
   - `created_at` (Timestamp with timezone)
   - `updated_at` (Timestamp with timezone)

## Step 4: Get Your API Keys

1. **Navigate to Project Settings**
   - Click on the "Settings" icon in the left sidebar
   - Select "API" from the settings menu

2. **Copy Your API Keys**
   You'll need these three values:
   - **Project URL**: Found in the "Project URL" section
   - **Anon Public Key**: Found in the "Project API keys" section
   - **Service Role Key**: Found in the "Project API keys" section (click "Reveal" to show it)

   ⚠️ **Important**: Keep your Service Role Key secure! It has full access to your database.

## Step 5: Configure Environment Variables

1. **Open Your Project Directory**
   - Navigate to your Tutorix project root directory

2. **Create/Edit .dev.vars File**
   - If `.dev.vars` doesn't exist, create it in the project root
   - Add the following environment variables:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. **Replace the Placeholder Values**
   - Replace `https://your-project-id.supabase.co` with your actual Project URL
   - Replace `your-anon-key-here` with your actual Anon Public Key
   - Replace `your-service-role-key-here` with your actual Service Role Key

**Example .dev.vars file:**
```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 6: Test the Connection

1. **Start Your Development Server**
   ```bash
   pnpm dev
   ```

2. **Test Lesson Creation**
   - Go to your Tutorix application
   - Try creating a lesson with any topic
   - If successful, the lesson should be saved to your Supabase database

3. **Verify in Supabase**
   - Go back to your Supabase Table Editor
   - Check the `lessons` table
   - You should see your test lesson data

## Security Considerations

### Row Level Security (RLS)
The setup script enables RLS with a permissive policy for development. For production, you should:

1. **Create More Restrictive Policies**
   ```sql
   -- Example: Only allow users to access their own lessons
   DROP POLICY IF EXISTS "Allow all operations on lessons" ON lessons;
   
   CREATE POLICY "Users can only access their own lessons" ON lessons
       FOR ALL USING (auth.uid() = user_id);
   ```

2. **Add User Authentication**
   - Implement proper user authentication in your application
   - Add a `user_id` column to the lessons table if needed

### Environment Variables Security
- Never commit `.dev.vars` to version control
- Add `.dev.vars` to your `.gitignore` file
- Use different keys for development and production environments

## Troubleshooting

### Common Issues

1. **"relation 'lessons' does not exist"**
   - Make sure you ran the SQL script successfully
   - Check the Table Editor to verify the table was created

2. **"Invalid API key"**
   - Double-check your API keys in `.dev.vars`
   - Make sure there are no extra spaces or characters
   - Verify you're using the correct keys from your project

3. **Connection timeout**
   - Check your internet connection
   - Verify the Supabase URL is correct
   - Make sure your Supabase project is running (not paused)

4. **RLS Policy Errors**
   - The permissive policy should allow all operations during development
   - If you modify policies, make sure they allow the operations your app needs

### Getting Help

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: Join their community for support
- **Check Supabase Dashboard Logs**: Look for error messages in your project dashboard

## Next Steps

After completing this setup:

1. Your Supabase database is ready for Tutorix
2. Your environment variables are configured
3. You can start developing and testing lesson creation
4. Consider implementing proper authentication for production use

---

🎉 **Congratulations!** Your Supabase database is now set up and ready to store Tutorix lessons! 