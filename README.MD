# Planora — Backend API

> Production-ready REST API for the Planora event management platform. Handles authentication, role-based authorization, event lifecycle, Stripe payments, QR ticketing, and more.

**Live API:** https://planora-backend-1.vercel.app  
**Frontend Repo:** https://github.com/MOSHFIQS/PLANORA-FRONTEND  
**Backend Repo:** https://github.com/MOSHFIQS/PLANORA-BACKEND

---

## Table of Contents

- [Overview](#overview)
- [Role System](#role-system)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Database Models](#database-models)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Overview

Planora Backend is a Node.js/Express REST API powering the Planora event management platform. It provides secure JWT-based authentication, full CRUD for events, a Stripe payment & webhook pipeline, unique-QR ticket generation, and role-gated endpoints for Users, Organizers, Admins, and Super Admins.

---

## Role System

| Role | Registered By | Permissions |
|---|---|---|
| **USER** | Self (public register) | Join events, manage own profile, view tickets, accept/decline invitations |
| **ORGANIZER** | Self (public register) | All USER permissions + create/edit/delete own events, send private invitations, validate tickets via QR scan |
| **ADMIN** | Super Admin only | Manage users (view, suspend, soft-delete) |
| **SUPER_ADMIN** | Super Admin only | All ADMIN permissions + manage admins, create ADMIN and SUPER_ADMIN accounts |

> The initial Super Admin account is seeded via environment variables (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (ESM) |
| Framework | Express.js v5 |
| Language | TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma v7 |
| Auth | JWT (Access + Refresh Tokens) + Better Auth |
| Payments | Stripe (Charges + Webhooks) |
| Image Storage | Cloudinary |
| Email | Nodemailer (SMTP / Gmail) |
| PDF | PDFKit (invoice generation) |
| Validation | Zod v4 |
| Build | tsup |

---

## Core Features

### Authentication & Security
- JWT access token (1d) + refresh token (7d) rotation
- Better Auth session layer (OAuth-ready)
- Secure HttpOnly cookie handling
- Role-based middleware guards on every protected endpoint
- Soft delete — user data is never hard-deleted

### User Management
- Register as USER or ORGANIZER
- Profile image upload via Cloudinary
- Admin can list, suspend, and soft-delete users
- Super Admin can list, suspend, and soft-delete both users and admins

### Event Management
- Full CRUD for events (Organizer-scoped)
- **Public events** — visible to all; any authenticated user can join
- **Private events** — hidden from browse; Organizer sends targeted invitations to previous participants only
- Online & Offline event types
- Featured event flagging
- Category-based organization
- Banner image support

### Participation & Invitations
- Join free events instantly
- Invitation-only flow for private events (accept / decline)
- Participation status tracking (PENDING → APPROVED / REJECTED)
- Organizer approval flow for gated events

### Payment System
- Stripe Checkout session creation for paid events
- Stripe Webhook listener for payment confirmation
- Payment status tracking (PENDING → PAID → FAILED)
- PDF invoice generation with PDFKit, emailed on successful payment

### Ticket System
- Unique QR-code generated per participation upon payment/join
- Ticket validation endpoint (Organizer only, scoped to own events)
- Check-in status updated on scan

### Reviews
- One review per user per event (enforced at DB level)
- Star rating + comment
- Aggregate rating computed per event

### Notifications
- Email confirmations on registration, payment, and invitation via Nodemailer

---

## Database Models

```
User
 ├── id, name, email, passwordHash, role, status, image, isDeleted
 └── relations → Participation, Invitation, Payment, Ticket, Review, Session

Event
 ├── id, title, description, type (ONLINE/OFFLINE), visibility (PUBLIC/PRIVATE)
 ├── isFeatured, isPaid, price, capacity, date, location, image
 ├── categoryId, organizerId
 └── relations → Participation, Invitation, Payment, Ticket, Review

Category
 └── id, name, slug

Participation
 └── id, userId, eventId, status (PENDING/APPROVED/REJECTED)

Invitation
 └── id, userId, eventId, status (PENDING/ACCEPTED/DECLINED)

Payment
 └── id, userId, eventId, stripeSessionId, amount, status (PENDING/PAID/FAILED)

Ticket
 └── id, userId, eventId, qrCode (unique), isUsed, usedAt

Review
 └── id, userId, eventId, rating, comment  [unique: userId+eventId]

Banner
 └── id, image, link, isActive

Session / Account
 └── Better Auth managed session tables
```

---

## API Reference

Base URL: `https://planora-backend-1.vercel.app/api/v1`

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register USER or ORGANIZER |
| POST | `/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/auth/refresh-token` | Public | Rotate access token |
| POST | `/auth/logout` | Auth | Invalidate session |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin / Super Admin | List all users |
| GET | `/users/:id` | Auth | Get user profile |
| PATCH | `/users/:id` | Owner | Update profile |
| DELETE | `/users/:id` | Admin / Super Admin | Soft delete user |

### Admins
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/admins` | Super Admin | Create ADMIN or SUPER_ADMIN |
| GET | `/admins` | Super Admin | List all admins |
| DELETE | `/admins/:id` | Super Admin | Soft delete admin |

### Events
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/events` | Public | List all public events |
| GET | `/events/:id` | Public | Event detail |
| POST | `/events` | Organizer | Create event |
| PATCH | `/events/:id` | Organizer (owner) | Update event |
| DELETE | `/events/:id` | Organizer (owner) | Delete event |

### Participation
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/participations` | User | Join a public event |
| GET | `/participations/my` | User | My participations |
| PATCH | `/participations/:id` | Organizer | Approve / reject |

### Invitations
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/invitations` | Organizer | Send invitation to past participant |
| GET | `/invitations/my` | User | My invitations |
| PATCH | `/invitations/:id` | User | Accept / decline |

### Payments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/checkout` | User | Create Stripe checkout session |
| POST | `/payments/webhook` | Stripe | Handle payment webhook |
| GET | `/payments/my` | User | My payment history |

### Tickets
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/tickets/my` | User | My tickets with QR codes |
| POST | `/tickets/validate` | Organizer (own event) | Scan & validate QR ticket |

### Reviews
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/reviews` | User (attended) | Submit review |
| GET | `/reviews/event/:id` | Public | Get reviews for event |

### Categories & Banners
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Public | List categories |
| POST | `/categories` | Admin | Create category |
| GET | `/banners` | Public | Active banners |
| POST | `/banners` | Admin | Create banner |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL database (Neon recommended)
- Stripe account
- Cloudinary account
- Gmail app password for SMTP

### Installation

```bash
git clone https://github.com/MOSHFIQS/PLANORA-BACKEND
cd PLANORA-BACKEND
pnpm install
```

### Database Setup

```bash
pnpm run push        # Push schema to database
pnpm run generate    # Generate Prisma client
```

> The Super Admin account is auto-seeded on first run using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.

### Development

```bash
pnpm run dev
```

API runs at `http://localhost:5000`

### Build & Production

```bash
pnpm run build
pnpm run start
```

### Stripe Webhook (local development)

```bash
pnpm run stripe:webhook
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@host/planora?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=1d
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1d

# JWT
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# App
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=465
EMAIL_SENDER_SMTP_USER=your_email@gmail.com
EMAIL_SENDER_SMTP_PASS=your_app_password
EMAIL_SENDER_SMTP_FROM=your_email@gmail.com

# Seed
SUPER_ADMIN_EMAIL=admin@gmail.com
SUPER_ADMIN_PASSWORD=your_super_admin_password
```

---

## Scripts

```bash
pnpm run dev             # Start dev server with hot reload (tsx watch)
pnpm run build           # Compile TypeScript + generate Prisma client
pnpm run start           # Start compiled production server
pnpm run migrate         # Run Prisma migrations
pnpm run push            # Push schema directly to database
pnpm run pull            # Pull schema from database
pnpm run generate        # Regenerate Prisma client
pnpm run studio          # Open Prisma Studio
pnpm run stripe:webhook  # Forward Stripe webhooks to local server
pnpm run lint            # Lint source files
```