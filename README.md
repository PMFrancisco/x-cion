# Xcion

A Twitter/X clone built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Auth**: Google OAuth + Email/Password
- **State**: TanStack React Query + Zustand
- **PWA**: @ducanh2912/next-pwa

## Features

- Post creation (280 char limit) with media uploads
- Infinite scroll feeds (Home, Explore)
- Likes, replies, reposts, bookmarks
- Follow/unfollow users
- User profiles with avatar/banner
- Admin role: edit/delete any post, manage user roles
- Dark/light theme (dark by default)
- PWA: installable, offline shell, caching
- Responsive: desktop 3-column layout, mobile bottom nav

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Run the database migration

Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it in the Supabase Dashboard SQL Editor.

### 4. Enable Google OAuth (optional)

In Supabase Dashboard > Authentication > Providers > Google:

- Enable Google provider
- Add your Google OAuth client ID and secret
- Set redirect URL to `http://localhost:3000/auth/callback`

### 5. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Make yourself admin

After creating your account, run this SQL in the Supabase Dashboard:

```sql
UPDATE profiles SET role = 'admin' WHERE username = 'your_username';
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, register
│   ├── (main)/             # Authenticated pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── bookmarks/      # Bookmarked posts
│   │   ├── explore/        # All posts feed
│   │   ├── settings/       # User settings
│   │   └── [username]/     # Profile + post thread
│   └── auth/callback/      # OAuth callback
├── components/
│   ├── auth/               # Login/register forms
│   ├── layout/             # Sidebar, mobile nav, right panel
│   ├── post/               # PostCard, PostComposer, PostFeed
│   ├── profile/            # ProfileHeader, ProfileTabs
│   ├── providers/          # Auth, Query, Theme providers
│   ├── shared/             # Reusable components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
└── lib/                    # Utilities, types, Supabase clients
```

## Build for production

```bash
npx next build --webpack
```

The `--webpack` flag is required for the PWA service worker generation.
