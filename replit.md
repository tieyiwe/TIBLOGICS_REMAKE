# TIBLOGICS Remake

## Overview
TIBLOGICS is an AI implementation and digital solutions agency website serving North America and Francophone Africa. This is a full-stack Next.js 14 application with an admin dashboard, booking system, command center, and AI-powered tools.

## Architecture

**Framework:** Next.js 14 (App Router)  
**Language:** TypeScript  
**Styling:** Tailwind CSS + Radix UI components  
**Database:** PostgreSQL (Replit hosted) via Prisma ORM  
**Auth:** NextAuth.js (credentials-based, single admin)  
**Charts:** Recharts  
**Animations:** Framer Motion  
**Email:** Resend  
**Payments:** Stripe  
**AI:** Anthropic Claude SDK  

## Project Structure

```
app/
  (admin)/admin/       # Admin dashboard pages
    appointments/      # Appointment management
    command-center/    # Project command center (kanban, timeline, list, sync)
    prospects/         # Prospects/leads management
    revenue/           # Revenue dashboard
    scanner-leads/     # Website scanner leads
    settings/          # Admin settings
    tools/             # Tool analytics
  (public)/            # Public-facing pages
    page.tsx           # Homepage
    about/             # About page
    book/              # 3-step booking wizard
    contact/           # Contact page
    services/          # Services grid with pricing
    tools/             # AI tools (advisor, calculator, scanner)
  api/                 # API routes
    admin/             # Admin APIs (projects, cc-webhook, sync-history)
    appointments/      # Booking APIs
    auth/              # NextAuth
    claude/            # AI advisor + float assistant
    prospects/         # Prospects CRUD
    scanner-leads/     # Scanner leads CRUD
    stripe/            # Checkout + webhooks
    tool-usage/        # Tool usage tracking
components/
  admin/               # AdminHeader, AdminSidebar, MetricCard, RevenueChart
  public/              # Nav, Hero, Footer, AIBanner, TIBSFloat, etc.
lib/
  auth.ts              # NextAuth config
  claude.ts            # Anthropic Claude client
  prisma.ts            # Prisma client singleton
  stripe.ts            # Stripe client
  resend.ts            # Resend email client
  utils.ts             # Utility functions
prisma/
  schema.prisma        # Database schema
  seed.ts              # Seed 15 Command Center projects
```

## Database Models
- `Appointment` — Booking appointments
- `Prospect` — CRM prospects/leads
- `ScannerLead` — Website scanner results
- `ToolUsage` — Tool usage analytics
- `AdminSettings` — Key-value admin config
- `BlockedDate` — Calendar blocked dates
- `Project` + `ProjectTask` — Command Center projects
- `CommandCenterSync` — Sync history log

## Key Features
- **Homepage** — Hero, services preview, Africa section, products grid, booking section
- **Admin Dashboard** — Appointments, prospects (Kanban), scanner leads, revenue charts, tool analytics
- **Command Center** — Project management with Kanban, Timeline (Gantt), List view, Sync from Claude Code
- **AI Tools** — TIBS Advisor (chatbot), Website Scanner, AI Cost Calculator
- **Booking Wizard** — 3-step flow with Stripe payment + Zoom link
- **TIBS Float** — Floating AI assistant button throughout site

## Environment Variables Required
See `.env.example` for full list. Key variables:
- `DATABASE_URL` — Auto-set by Replit
- `NEXTAUTH_SECRET` — Auth encryption key
- `NEXTAUTH_URL` — App URL
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` — Admin login
- `ANTHROPIC_API_KEY` — For Claude AI features
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — For payments
- `RESEND_API_KEY` / `FROM_EMAIL` / `TIWE_EMAIL` — For transactional email

## Development
- **Dev server:** `npm run dev` (port 5000, host 0.0.0.0)
- **DB push:** `npx prisma db push`
- **DB seed:** `npm run db:seed`
- **DB studio:** `npx prisma studio`

## Deployment
Configured for Replit Autoscale:
- Build: `npm run build`
- Run: `npm run start`

## Admin Access
- URL: `/admin/login`
- Email: Set via `ADMIN_EMAIL` env var
- Password: Set via `ADMIN_PASSWORD` env var
