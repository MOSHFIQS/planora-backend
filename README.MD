# 🚀 Planora Backend API

Planora Backend is a scalable and production-ready REST API for an event management platform. It handles authentication, event management, payments, ticketing, and more.

---

## 🌐 Live API
https://planora-backend-1.vercel.app

## 📂 Repository
https://github.com/MOSHFIQS/planora-backend

## 📹 Demo Video
https://drive.google.com/file/d/1ZWyYftonzO9oHqp-FAlkMMUPtsi4tSbz/view

---

## 🛠️ Tech Stack

### Core
- Node.js (ESM)
- Express.js (v5)
- TypeScript

### Database
- PostgreSQL (Neon)
- Prisma ORM

### Authentication
- Better Auth (Session + OAuth ready)
- JWT (Access & Refresh Token)

### Services & Integrations
- Stripe (Payments & Webhooks)
- Cloudinary (Image Upload)
- Nodemailer (Email Service)
- PDFKit (Invoice Generation)

### Validation & Utilities
- Zod (Schema Validation)
- UUID
- Cookie Parser
- CORS

---

## 📌 Key Features

### 🔐 Authentication & Security
- JWT-based authentication (Access + Refresh Tokens)
- Session-based authentication (Better Auth)
- Role-based authorization (USER, ADMIN)
- Secure cookie handling

### 👤 User Management
- User roles & status
- Soft delete system
- Profile image support

### 📅 Event Management
- Create / Update / Delete events
- Online & Offline events
- Public / Private visibility
- Featured events
- Category-based organization

### 🎟️ Participation & Invitations
- Join events
- Invitation system
- Approval / rejection flow
- Participation tracking

### 💳 Payment System
- Stripe integration
- Webhook handling
- Payment status tracking
- Invoice generation (PDF)

### 🎫 Ticket System
- Unique QR code per ticket
- Ticket validation
- Event check-in system

### ⭐ Reviews
- One review per user per event
- Rating + comment system

### 🗂️ Additional Features
- Banner management
- Category management
- Email notifications
- Image upload via Cloudinary

---

## 🗄️ Database Models

Main entities:

- User
- Event
- Category
- Participation
- Invitation
- Payment
- Ticket
- Review
- Banner
- Session
- Account

---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="your_postgresql_url"

# Auth
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:5000

ACCESS_TOKEN_SECRET=accesssecret
REFRESH_TOKEN_SECRET=refreshsecret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=1d
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1d

FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
EMAIL_SENDER_SMTP_USER=your_email
EMAIL_SENDER_SMTP_PASS=your_password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=465
EMAIL_SENDER_SMTP_FROM=your_email

# Admin Seed
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=12345678