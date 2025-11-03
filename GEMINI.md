# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

Next.js 15 SaaS starter template with authentication, Stripe payments, team management, and dashboard UI. Uses App Router with route groups, Server Actions, and JWT-based sessions.

## Architecture Principles

### API Design
- All data mutations must go through API routes (`/app/api/*`)
- Server Actions should only handle form submissions and redirects
- Direct database access from Server Actions is prohibited

### Data Access Layer
- SQL queries must be abstracted in `/lib/db/queries/*`
- Never write raw SQL in API routes or actions
- Use type-safe query functions

### Type Safety
- Always use TypeScript types from Drizzle schema
- Avoid `any` types
- Use generics for reusable functions

## Authorization Rules

### Team-based Access Control
- All articles must have a `teamId` field
- Only team members can:
  - Create articles
  - Update articles
  - Delete articles
  - View draft/private articles
- Public articles can be viewed by anyone

### Implementation Pattern
```typescript
// Check team membership
const membership = await getTeamMembership(userId, teamId);
if (!membership) {
  return unauthorized();
}
```

## UI Component Guidelines

### Component Library
- Use shadcn/ui components as the foundation
- Custom components should be placed in `/components/ui/*`
- Reusable business components go in `/components/*`

### Styling
- Follow the existing color scheme from SaaS Starter
- Use Tailwind utility classes
- Reference design tokens from `tailwind.config.js`

### Component Structure
```typescript
// Preferred pattern
interface Props {
  // Props definition
}

export function ComponentName({ ...props }: Props) {
  // Implementation
}
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (with Turbopack)
pnpm dev

# Build for production
pnpm build
pnpm start

# Database setup
docker compose up -d postgres # Start local Postgres
pnpm db:setup # Create .env file
pnpm db:migrate # Run Drizzle migrations
pnpm db:seed # Seed with test user (test@test.com / admin123)
pnpm db:generate # Generate new migration from schema changes
pnpm db:studio # Open Drizzle Studio

# Stripe webhook testing (run alongside dev server)
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Architecture

### Route Structure

- **`app/(login)/`**: Unauthenticated routes (`/sign-in`, `/sign-up`) with authentication forms
- **`app/(dashboard)/`**: Authenticated routes requiring session cookies, protected by global middleware
- `/dashboard/*`: Main dashboard with settings, activity logs, team management, articles
- `/pricing`: Stripe Checkout integration
- **`app/(public)/`**: Public marketing pages
- **`app/api/`**: Serverless API routes for Stripe webhooks, teams, users, articles, categories

### Database

- **Drizzle ORM** with Postgres (`postgres.js`)
- Schema in `lib/db/schema.ts`
- Queries in `lib/db/queries.ts` (type-safe)
- Migrations in `lib/db/migrations/`
- Seeding script in `scripts/seed.ts`

### Authentication & Session Management

- **NextAuth.js v5 (Auth.js)** with JWT strategy
- Credentials provider for email/password
- Session managed via httpOnly cookies
- `auth()` helper from `lib/auth/index.ts` to get session
- `middleware.ts` protects `/(dashboard)` routes
- Password hashing with `bcryptjs`

### Payments (Stripe)

- **Stripe Checkout**: Redirect to hosted payment page
- **Webhooks** (`app/api/stripe/webhook/`): Verify signature with `STRIPE_WEBHOOK_SECRET`, handle `checkout.session.completed` and `customer.subscription.*` events
- **Customer Portal**: Users manage subscriptions via Stripe-hosted portal, synced back via webhooks

### Server Actions Pattern

Server Actions live in `actions.ts` files alongside routes:
- **Form actions**: Use `validatedActionWithUser()` wrapper for forms with Zod validation
- **Inline actions**: Use `withTeam()` for actions needing team context
- **Return format**: `{ error?: string, success?: string }` for form state
- Example: `app/(dashboard)/dashboard/articles/actions.ts`

### Activity Logging

Use `ActivityType` enum from `lib/db/schema.ts` for consistent audit events. Log user actions via `activity_logs` inserts in Server Actions.

## Code Style

- TypeScript strict mode, React 19 with Server Components default
- Use `'use client'` only when necessary (forms with `useActionState`, interactive UI)
- Database columns: `lower_snake_case`; TypeScript: `camelCase`; React: `PascalCase`
- Tailwind classes for styling (no CSS modules)
- Follow 2-space indentation, single quotes from existing files
- Import paths use `@/` alias for root

## Common Patterns

### Adding a new authenticated page

1. Create route in `app/(dashboard)/dashboard/your-page/page.tsx`
2. Use `getUser()` from queries to verify auth in Server Component
3. Add activity logging if needed
4. Create `actions.ts` for mutations using `validatedActionWithUser()`

### Adding a new database table

1. Define table/relations in `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Review migration SQL in `lib/db/migrations/`
4. Run `pnpm db:migrate` to apply
5. Add typed queries to a new or existing query file
6. Update seed script if needed

### Server Action with validation

```typescript
import { z } from "zod";

export const yourAction = validatedActionWithUser(
  z.object({ field: z.string() }),
  async (data, formData, user) => {
    // Access validated data.field and user.id
    return { success: 'Done' };
  }
);
```

## Environment Variables

See `.env.example`. Required:
- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `POSTGRES_URL`: Database connection string
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: From Stripe dashboard
- `BASE_URL`: `http://localhost:3000` for dev

## Testing

No automated tests configured. Manually test in `pnpm dev`. Use Stripe test cards (4242 4242 4242 4242) for payments.
