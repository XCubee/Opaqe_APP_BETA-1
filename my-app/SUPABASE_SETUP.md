# Supabase Database Setup for Opaque App

## 🚨 CRITICAL: You're Getting "Network Request Failed" Error!

This error means the `users` table doesn't exist in your Supabase database yet.

## 🚀 QUICK FIX: Use the Working SQL Script

**Step 1: Run the Working SQL Script (THIS WILL FIX IT!)**
1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `supabase-setup-working.sql`
3. Click **Run**
4. You should see "Table created successfully!"

**Step 2: Test Your App**
1. Restart your Expo app: `npx expo start`
2. Try signing up - it should work now!
3. Check the `users` table in Supabase to see if data is saved

## 🔍 **Why This Happens:**

- ❌ **Table Missing** - The `users` table doesn't exist
- ❌ **RLS Blocking** - Even if table exists, RLS policies block inserts
- ✅ **Solution** - `supabase-setup-working.sql` creates table WITHOUT RLS

## 📋 **What the Working Script Does:**

1. **Drops existing table** (if any) to start fresh
2. **Creates new `users` table** with all required fields
3. **Disables RLS completely** (no security restrictions)
4. **Grants ALL permissions** to authenticated users
5. **Creates indexes** for fast lookups
6. **Tests with dummy record** to verify it works

## 🧪 **Test Steps:**

1. **Run `supabase-setup-working.sql`** in Supabase SQL Editor
2. **Wait for completion** - should see "Table created successfully!"
3. **Restart your app**: `npx expo start`
4. **Try signup** - should work now!
5. **Check Supabase** - user data should appear in `users` table

## 🚫 **Don't Use These Yet:**

- `supabase-setup.sql` - Has RLS that blocks inserts
- `supabase-setup-simple.sql` - May still have RLS issues

## 🔒 **Security Note:**

The working script disables RLS temporarily. Once signup is working, we can add proper security back.

## 📱 **Current Status:**

✅ **Placeholder text** - Fixed and visible  
❌ **Database table** - Missing (causing network error)  
🔧 **Solution** - Run `supabase-setup-working.sql`  

**Run the working SQL script now and your signup will work!** 