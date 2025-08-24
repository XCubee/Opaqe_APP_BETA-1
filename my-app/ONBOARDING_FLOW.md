# Onboarding Flow for Opaque App

## New User Journey

### 1. Signup Process
- User enters username, email, and password
- Account is created in Supabase Auth
- Basic user data is saved to custom `users` table
- User is redirected to **Onboarding Screen**

### 2. Onboarding Screen
The onboarding screen includes:

#### **Start Your Journey Section**
- Social login options (Gmail, GitHub, LinkedIn, Email)
- Option to import LinkedIn profile

#### **Tell Us About Yourself Section**
- Profile picture placeholder
- Tagline input (e.g., "ML Enthusiast | Seeking Innovators")

#### **Your Core Skills Section**
- Interactive skill selection grid:
  - Frontend, Backend, ML/AI, UI/UX, Hardware, Business, Pitching
- Users can select multiple skills
- Visual feedback for selected skills

#### **Preferred Hackathon Domains Section**
- Domain selection grid:
  - AI, Blockchain, HealthTech, Sustainability, FinTech
- Users can select multiple domains

#### **Availability Status Section**
- Text input for availability (e.g., "Weekends, Evenings after 6 PM")

### 3. After Onboarding
- Profile data is saved to the `users` table
- User is redirected to **Home Page**
- Home page displays user's profile information

## Returning User Journey

### 1. Login Process
- User enters email and password
- Supabase authenticates the user
- App checks if onboarding is complete

### 2. Routing Logic
- **If onboarding incomplete**: Redirect to onboarding screen
- **If onboarding complete**: Redirect to home page

### 3. Profile Editing
- Users can edit their profile from the home page
- "Edit Profile" button takes them back to onboarding
- Existing data is pre-filled in the form

## Database Schema

The `users` table now includes:
- `id` (UUID, Primary Key)
- `username` (Text, Unique)
- `email` (Text, Unique)
- `tagline` (Text)
- `skills` (Text Array)
- `domains` (Text Array)
- `availability` (Text)
- `profile_picture` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Technical Implementation

### Files Created/Modified:
1. **`onboarding.tsx`** - New onboarding screen component
2. **`_layout.tsx`** - Added onboarding route
3. **`login.tsx`** - Updated to redirect to onboarding after signup
4. **`index.tsx`** - Updated to check onboarding completion
5. **`home.tsx`** - Updated to display profile data and edit button
6. **`supabase-setup.sql`** - Updated database schema

### Key Features:
- **Responsive Design**: Matches the design shown in the image
- **Form Validation**: Ensures required fields are filled
- **Data Persistence**: Saves to Supabase database
- **Edit Mode**: Allows users to update existing profiles
- **Smart Routing**: Automatically directs users to appropriate screens

## Testing the Flow

1. **Run the updated SQL setup** in Supabase
2. **Test signup**: Should redirect to onboarding
3. **Complete onboarding**: Should redirect to home
4. **Test login**: Should check onboarding status
5. **Test edit profile**: Should load existing data
6. **Verify data persistence**: Check Supabase tables

## Next Steps

- Add profile picture upload functionality
- Implement social login integration
- Add team matching based on skills/domains
- Create profile completion percentage indicator 