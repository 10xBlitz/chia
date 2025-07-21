# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15+ App Router dental clinic platform built with TypeScript, Supabase backend, and modern React patterns. The platform supports multiple user roles (patients, dentists, admins) with features including clinic management, reservations, quotations, reviews, and real-time chat.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Update Supabase types
npm run update-types

# Run Playwright tests
npx playwright test

# View test reports
npx playwright show-report
```

## Architecture & Key Directories

### App Structure (Next.js App Router)

- `src/app/` - Next.js App Router pages and layouts
  - `(main)/` - Public clinic browsing pages
  - `admin/` - Admin dashboard with customer service and management
  - `auth/` - Authentication flows (login, signup, OAuth)
  - `dentist/` - Dentist dashboard (reservations, quotations, reviews)
  - `patient/` - Patient portal (profile, reservations, reviews, payments)
  - `api/` - API routes for server-side logic

### Core Directories

- `src/components/` - Reusable React components
  - `ui/` - Base UI components (shadcn/ui style)
  - `form-ui/` - Form-specific components
  - `modals/` - Modal components
  - `layout/` - Layout components
- `src/lib/supabase/` - Supabase integration
  - `services/` - Database service functions organized by table
  - `client.ts`, `server.ts` - Supabase client configurations
- `src/hooks/` - Custom React hooks
- `src/stores/` - Zustand state management
- `src/providers/` - React context providers

## Data Layer (Supabase)

### Service Pattern

All database operations are organized in `src/lib/supabase/services/` by table/domain:

- `clinics.services.ts` - Clinic data operations
- `users.services.ts` - User management
- `reservations.services.ts` - Reservation handling
- `quotation.services.ts` - Quotation management
- `reviews.services.ts` - Review operations
- `messages.services.ts` - Chat/messaging
- Additional services for banners, treatments, bids, etc.

### Client vs Server Usage

- Use `src/lib/supabase/client.ts` for client components
- Use `src/lib/supabase/server.ts` for server components and API routes
- Use `src/lib/supabase/admin.ts` for admin operations

## Key Development Patterns

### Data Fetching

- **Server Components**: Use async server components with Supabase server client
- **Client Components**: Always use TanStack Query (`useQuery`, `useInfiniteQuery`) for data fetching
- **Static Pages**: Use `generateStaticParams` and `generateMetadata` for SEO

### Form Handling

- Use `react-hook-form` with Zod validation schemas
- Form UI components are in `src/components/form-ui/`
- All forms should use the consistent form component pattern from `src/components/ui/form.tsx`

### State Management

- Zustand stores for global state (`src/stores/`)
- React Query for server state
- Local state with React hooks for component-specific state

### Styling

- Tailwind CSS for styling
- Custom fonts (Pretendard) in `public/fonts/`
- Mobile-first responsive design

## Testing

- Playwright for E2E testing (configured in `playwright.config.ts`)
- Test files in `tests/` directory
- Run tests with `npx playwright test`

## Important Conventions

### Code Style

- TypeScript everywhere
- Functional components only
- Named exports for utilities
- Descriptive variable names
- English comments for Korean UI text

### Database Operations

- All Supabase queries must go in appropriate service files
- Optimize queries to minimize database load
- Reuse existing service functions when possible

### Form Components

- Always use form components from `src/components/ui/`
- Create new form UI components in that folder if needed
- Follow accessibility best practices

### Internationalization

- Korean text in UI should include English comments for developers
- Consider localization patterns for multi-language support

## Authentication & User Roles

The platform supports three user types:

- **Patients**: Browse clinics, make reservations, get quotations
- **Dentists**: Manage clinic profile, handle reservations and quotations
- **Admins**: Full platform management and customer service

Authentication is handled through Supabase Auth with OAuth support (Kakao, Google, and Apple) and traditional email/password flows.
