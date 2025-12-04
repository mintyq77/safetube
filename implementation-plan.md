**Phase 1: Project Setup & Foundation**

**Tasks:**

1. [✓] Initialize Next.js 14 project with App Router

- [✓] Set up TypeScript configuration

- [✓] Configure ESLint and Prettier

- [✓] Set up project folder structure

2. [✓] Install and configure dependencies

- [✓] Tailwind CSS setup with custom design tokens

- [✓] Install Supabase client library

- [✓] Install YouTube API client

- [✓] Install next-pwa for PWA support

3. [✓] Set up Supabase project

- [✓] Create new Supabase project

- [✓] Configure authentication providers (email/password)

- [✓] Set up database tables (parents, videos)

- [✓] Implement Row Level Security policies

- [✓] Get API keys and configure environment variables

4. [✓] Create environment configuration

- [✓] .env.local file with Supabase credentials

- [✓] YouTube API key configuration

- [✓] Add .env.example for documentation

---

**Phase 2: Parent Authentication & Admin Dashboard**

**Tasks:**

1. [✓] Build authentication pages

- [✓] Create /admin/signup/page.tsx with email/password form

- [✓] Create /admin/login/page.tsx with login form

- [✓] Implement email verification flow

- [✓] Add password validation and error handling

2. [✓] Set up Supabase Auth integration

- [✓] Create auth context/hooks for session management

- [✓] Implement signup functionality with Supabase

- [✓] Implement login functionality

- [✓] Implement logout functionality

- [✓] Handle authentication state persistence

3. [✓] Create admin dashboard layout

- [✓] Build /admin/page.tsx with protected route wrapper

- [✓] Add navigation header with logout button

- [✓] Create responsive layout for video management

- [✓] Add empty state for new users

4. [✓] Implement session management

- [✓] Server-side session validation middleware

- [✓] Client-side auth state management

- [✓] Redirect logic for authenticated/unauthenticated users

---

**Phase 3: Video Management System**

**Tasks:**

1. [✓] YouTube API integration

- [✓] Set up YouTube Data API v3 client

- [✓] Create /api/validate-youtube endpoint

- [✓] Implement URL parsing (extract video ID from various YouTube URL

formats)

- [✓] Fetch video metadata (title, thumbnail, duration)

- [✓] Check "Made for Kids" status

- [✓] Handle API errors and rate limits

2. [✓] Add video functionality

- [✓] Create /api/videos POST endpoint

- [✓] Build "Add Video" form component in admin dashboard

- [✓] Implement URL validation on client-side

- [✓] Call YouTube API to validate and fetch metadata

- [✓] Save video to Supabase with parent_id association

- [✓] Handle duplicate video prevention

- [✓] Show success/error messages

3. [✓] Display video list

- [✓] Create /api/videos GET endpoint

- [✓] Fetch and display parent's video collection

- [✓] Build video card component with thumbnail, title, duration

- [✓] Add loading states

- [✓] Implement empty state

4. [✓] Remove video functionality

- [✓] Create /api/videos/[id] DELETE endpoint

- [✓] Add delete button to video cards

- [✓] Implement confirmation dialog

- [✓] Update UI after deletion

- [✓] Handle deletion errors

---

**Phase 4: Child Experience & Device Linking**

**Tasks:**

1. [✓] Build device linking flow

- [✓] Create /link-device/page.tsx

- [✓] Build email input form

- [✓] Create /api/parent-by-email GET endpoint

- [✓] Look up parent by email in database

- [✓] Store parent_id in localStorage

- [✓] Handle invalid email errors

- [✓] Redirect to home feed after successful linking

2. [✓] Create child home feed

- [✓] Build main /page.tsx (child view)

- [✓] Check for parent_id in localStorage

- [✓] Redirect to link-device if not found

- [✓] Fetch videos for linked parent

3. [✓] Build thumbnail grid

- [✓] Create responsive grid layout (2-3 columns mobile, 4-6 desktop)

- [✓] Design video thumbnail card component

- [✓] Display title below thumbnail

- [✓] Implement touch-friendly tap targets

- [✓] Add loading skeleton states

4. [✓] Implement watch count sorting

- [✓] Query videos sorted by watch_count ASC

- [✓] Show least-watched videos first

- [✓] Handle videos with same watch count (random or by date)

---

**Phase 5: Video Playback & Recommendations**

**Tasks:**

1. [✓] Build video player page

- [✓] Create /watch/[videoId]/page.tsx

- [✓] Fetch video details by ID

- [✓] Implement YouTube IFrame embed

- [✓] Use youtube-nocookie.com domain for privacy

- [✓] Set minimum player size (200x200px per ToS)

- [✓] Make player responsive

2. [✓] Implement watch tracking

- [✓] Create /api/videos/[id]/watch POST endpoint

- [✓] Increment watch_count in database

- [✓] Update last_watched_at timestamp

- [✓] Call endpoint when video starts playing

- [✓] Handle tracking errors gracefully

3. [✓] Build recommendations section

- [✓] Fetch other videos from same parent's collection

- [✓] Exclude currently playing video

- [✓] Sort by watch_count ASC (least watched first)

- [✓] Add randomization option

- [✓] Display as thumbnail grid below player

- [✓] Make recommendations clickable to play next video

4. [✓] Add navigation

- [✓] Add "Home" button to return to feed

- [✓] Implement back navigation

- [✓] Ensure smooth transitions

---

**Phase 6: PWA Configuration & Polish**

**Tasks:**

1. [✓] Configure PWA with next-pwa

- [✓] Install and configure next-pwa (@ducanh2912/next-pwa)

- [✓] Create manifest.json with app metadata

- [✓] Set app name, short_name, description

- [✓] Configure display mode (standalone)

- [✓] Set theme colors and background color

2. [✓] Create app icons

- [✓] Generate icons in multiple sizes (192x192, 512x512, etc.)

- [✓] Create Apple touch icons

- [✓] Add favicon

- [✓] Place in /public directory

3. [✓] Set up service worker

- [✓] Configure caching strategies

- [✓] Cache static assets

- [✓] Handle offline scenarios

- [] Test service worker registration (requires production build)

4. [~] Responsive design polish

- [] Test on iPhone (various sizes)

- [] Test on iPad

- [] Test on Android phones

- [] Test on Android tablets

- [✓] Fix any layout issues

- [✓] Ensure touch targets are adequate size (44x44px minimum)

5. [✓] UX improvements

- [✓] Add loading states throughout

- [✓] Implement error boundaries

- [] Add toast notifications for actions

- [✓] Improve form validation feedback

- [✓] Add accessibility features (ARIA labels, keyboard navigation)

---

**Phase 7: Testing & Deployment**

**Tasks:**

1. [] Testing

- [] Test parent signup/login flow

- [] Test adding valid/invalid YouTube URLs

- [] Test removing videos

- [] Test device linking with valid/invalid emails

- [] Test video playback

- [] Test watch count incrementing

- [] Test PWA installation on iOS

- [] Test PWA installation on Android

- [] Test offline behavior

- [] Cross-browser testing (Chrome, Safari, Firefox)

2. [] Security review

- [] Verify Row Level Security policies work correctly

- [] Test that parents can only see their own videos

- [] Ensure API endpoints are properly protected

- [] Check for XSS vulnerabilities

- [] Validate all user inputs

- [] Review YouTube API ToS compliance

3. [] Deploy to Vercel

- [] Create Vercel project

- [] Connect GitHub repository

- [] Configure environment variables

- [] Set up custom domain (if applicable)

- [] Deploy production build

- [] Verify deployment works correctly

4. [] Post-deployment verification

- [] Test all flows in production

- [] Monitor error logs

- [] Check performance metrics

- [] Verify PWA installation on real devices

---

**Database Migration Scripts Needed**

-- [✓] 1. Create parents table

-- [✓] 2. Create videos table

-- [✓] 3. Enable RLS on videos table

-- [✓] 4. Create RLS policies

-- [✓] 5. Create indexes for performance

---

**Environment Variables Required**

[✓] NEXT*_PUBLIC_*SUPABASE*_URL=*

[✓] *NEXT_*PUBLIC*_SUPABASE_*ANON*_KEY=*

[✓] *SUPABASE_*SERVICE*_ROLE_*KEY=

[✓] YOUTUBE*_API_*KEY=

---

**Key Design Decisions to Address**

1. **Watch count timing**: Increment on video load (simplest for MVP)

2. **Error handling for device linking**: Show error if email doesn't exist

3. **Session persistence**: Store parent_id in localStorage permanently (until

cleared)

4. **Video ordering**: Auto-sort by watch_count only for MVP

5. **Offline behavior**: Show error message, require internet for MVP

---

**Estimated Timeline**

- Phase 1: 1-2 days

- Phase 2: 2-3 days

- Phase 3: 3-4 days

- Phase 4: 2-3 days

- Phase 5: 2-3 days

- Phase 6: 2-3 days

- Phase 7: 2-3 days

**Total: ~3-4 weeks** for MVP