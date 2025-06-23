# Copilot Custom Instructions

---

> **File location:** `.github/copilot-instructions.md` > **Supabase service/helper files location:** `src/lib/supabase/services/`

---

## What is this project?

This is a Next.js 15+ App Router project for a dental clinic platform. It uses Supabase for backend data (auth, clinics, reviews, etc.), supports static and dynamic rendering, and includes social/OG meta tags for sharing. The codebase is TypeScript, and the UI is modern and mobile-friendly.

## How should GitHub Copilot help?

- Suggest code in TypeScript/React/Next.js idioms.
- Prefer Next.js App Router patterns (async server components, generateStaticParams, generateMetadata, etc.).
- Use Supabase client/server helpers for data fetching.
- For static pages, use generateStaticParams and static data fetching.
- For dynamic data (e.g., reviews), use client components and React hooks.
- **Always use TanStack Query (useQuery, useInfiniteQuery, etc.) in client components for all data fetching.**
- When suggesting OG/meta tags, use Next.js metadata conventions.
- Use absolute URLs for images in OG tags.
- Follow best practices for accessibility and performance.
- Use concise, readable code and modern React patterns.
- **If there are Korean words in the UI, always add English translations as comments for developers.**
- **If there is Supabase data fetching, put the logic in the lib/supabase/services folder and attach it to the existing services there. Services are categorized by table; each table should have its own service file.**
- **Always be mindful of expensive database calls. Avoid unnecessary or redundant queries, and optimize data fetching to minimize load on the database.**
- **You do not need to use or import types from `src/lib/supabase/types.ts` in your code. That file is for Copilot's internal understanding of the database structure only.**

---

**Supabase Query Placement:**

- All Supabase queries must be placed in the appropriate service/helper file under `src/lib/supabase/services/`.
- If a function for the query already exists, reuse it.
- If no function exists, create a new one in the correct service file (by table/domain).
- When creating new functions, make them reusable (accept parameters, avoid hardcoding, etc.) whenever possible.

## Coding style

- TypeScript everywhere
- Functional components
- Prefer async/await
- Use named exports for utilities
- Use descriptive variable and prop names
- Use comments for non-obvious logic

## What to avoid

- No usage of deprecated Next.js APIs (getStaticProps, getServerSideProps, etc.)
- No direct fetch to API routes for internal data—use Supabase client instead
- No class components
- No inline styles unless necessary
- No magic numbers or strings—use constants or enums

## Form UI Components

- When building forms, always use the form components from `src/components/ui/` (e.g., `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Textarea`, `Button`, etc.).
- If a required form UI component does not exist in `src/components/ui/`, create it in that folder and use it in your implementation.
- All new form UI components should follow the project's coding style and accessibility best practices.

## Example prompt

"Add a new static page for clinic details, using Supabase for data and Next.js metadata for OG tags. Reviews should be loaded dynamically in a client component. All client components must use TanStack Query for fetching. If you add Korean text, include English comments. Any new Supabase fetch logic should go in the appropriate service file in lib/supabase/services."
