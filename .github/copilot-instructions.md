# Aptitude Practice Platform (Placement Prep)

This repository implements an aptitude testing and mastery gating platform for students preparing for campus placements.

## Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth (or secure AES-256-GCM encrypted cookies in Mock Mode)
- **Coding Sandbox**: Piston API sandbox (`https://emkc.org/api/v2/piston/execute`) with a local Python spawn fallback for unit tests.
- **AI Question Generation**: Groq Llama 3 API for on-demand question generation.

## Developer Commands

- Run Development Server: `npm run dev`
- Run Typechecking: `npm run typecheck`
- Run Unit Tests (Vitest): `npm run test`
- Generate Prisma Client: `npm run prisma:generate`
- Seed Database: `npm run prisma:seed`
