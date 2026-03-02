# Xcion

A mock social network built for [Inner Circle Rol](https://www.instagram.com/innercirclerol/)'s TTRPG campaigns. Players interact in-character through a Twitter/X-style platform, and the GM can create and "possess" NPC profiles to drive the narrative. Spanish-language UI.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: React 19, Tailwind CSS 4 + shadcn/ui (New York style)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Auth**: Google OAuth + Email/Password
- **State**: TanStack React Query 5 + Zustand 5
- **Icons**: Lucide React
- **PWA**: Installable via web manifest + service worker

## Features

- Post creation (280 char limit) with up to 4 image uploads
- Infinite scroll feeds (Home, Explore)
- Likes, replies, reposts, bookmarks
- Follow/unfollow users
- User profiles with avatar/banner
- Trigram-based search for posts and profiles
- Onboarding flow for new users (username + display name setup)
- **NPC profiles**: GM-created characters that admins can "possess" to post, like, and follow as — bringing the campaign world to life on the timeline
- Admin role (GM): edit/delete any post, manage user roles, create and control NPCs
- Dark/light theme (dark by default)
- PWA: installable via web manifest
- Responsive: desktop 3-column layout, mobile bottom nav

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Run the database migrations

Run each migration file in order in the Supabase Dashboard SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — profiles, posts, likes, follows, bookmarks, notifications, storage buckets, RLS
2. `supabase/migrations/002_search_indexes.sql` — trigram search indexes
3. `supabase/migrations/003_onboarding_flag.sql` — onboarding flow support
4. `supabase/migrations/004_npc_profiles.sql` — NPC profiles and possession system

Or, if using the Supabase CLI locally:

```bash
npm run db:start
npm run db:reset
```

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

### 7. Make yourself admin (GM)

After creating your account, run this SQL in the Supabase Dashboard to grant GM privileges:

```sql
UPDATE profiles SET role = 'admin' WHERE username = 'your_username';
```

This gives you access to the admin dashboard where you can manage NPCs, moderate posts, and control user roles.

## Scripts

| Script      | Command              | Description                     |
| ----------- | -------------------- | ------------------------------- |
| `dev`       | `next dev`           | Start dev server                |
| `build`     | `next build`         | Production build                |
| `start`     | `next start`         | Serve production build          |
| `lint`      | `eslint`             | Run linter                      |
| `typecheck` | `tsc --noEmit`       | Type checking                   |
| `format`    | `prettier --write .` | Format code                     |
| `db:start`  | `supabase start`     | Start local Supabase            |
| `db:stop`   | `supabase stop`      | Stop local Supabase             |
| `db:reset`  | `supabase db reset`  | Reset DB and run all migrations |
| `db:status` | `supabase status`    | Show Supabase status            |

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, register
│   ├── (main)/             # Authenticated pages
│   │   ├── admin/          # GM dashboard + NPC management
│   │   ├── bookmarks/      # Bookmarked posts
│   │   ├── explore/        # Search + all posts feed
│   │   ├── settings/       # User settings
│   │   └── [username]/     # Profile + post thread
│   ├── (onboarding)/       # Username setup for new users
│   └── auth/callback/      # OAuth callback
├── components/
│   ├── auth/               # Login/register forms
│   ├── layout/             # Sidebar, mobile nav, right panel
│   ├── post/               # PostCard, PostComposer, PostFeed
│   ├── profile/            # ProfileHeader, ProfileTabs, FollowButton
│   ├── providers/          # Auth, Query, Theme, SW providers
│   ├── shared/             # EmptyState, LoadingSkeleton
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks (posts, likes, follows, search, NPCs)
├── lib/                    # Utilities, types, Supabase clients
└── proxy.ts                # Auth proxy (session refresh, route protection)
```

## Build for production

```bash
npm run build
npm start
```
