model User {
    id            String  @id @default(cuid())
    name          String
    email         String  @unique
    emailVerified Boolean @default(false)

    role   Role       @default(USER)
    status UserStatus @default(ACTIVE)

    isDeleted Boolean   @default(false)
    deletedAt DateTime?

    image String?

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 🔐 Better Auth relations
    sessions Session[]
    accounts Account[]

    // 🎉 Planora relations
    events         Event[]         @relation("OrganizerEvents")
    participations Participation[]
    invitations    Invitation[]
    reviews        Review[]
    payments       Payment[]

    @@map("user")
}

model Session {
    id        String   @id
    expiresAt DateTime
    token     String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    ipAddress String?
    userAgent String?
    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([token])
    @@index([userId])
    @@map("session")
}

model Account {
    id                    String    @id
    accountId             String
    providerId            String
    userId                String
    user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    accessToken           String?
    refreshToken          String?
    idToken               String?
    accessTokenExpiresAt  DateTime?
    refreshTokenExpiresAt DateTime?
    scope                 String?
    password              String?
    createdAt             DateTime  @default(now())
    updatedAt             DateTime  @updatedAt

    @@index([userId])
    @@map("account")
}

model Verification {
    id         String   @id
    identifier String
    value      String
    expiresAt  DateTime
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt

    @@index([identifier])
    @@map("verification")
}

enum Role {
    USER
    ADMIN
}

enum UserStatus {
    ACTIVE
    SUSPENDED
}

enum EventVisibility {
    PUBLIC
    PRIVATE
}

enum ParticipationStatus {
    PENDING
    APPROVED
    REJECTED
    BANNED
}

enum InvitationStatus {
    PENDING
    ACCEPTED
    DECLINED
}

enum PaymentStatus {
    PENDING
    SUCCESS
    FAILED
    REFUNDED
    CANCELED
    UNPAID
}

model Event {
     id          String          @id @default(cuid())
     title       String
     description String
     venue       String
     dateTime    DateTime
     visibility  EventVisibility
     fee         Float           @default(0)

     organizerId String
     organizer   User   @relation("OrganizerEvents", fields: [organizerId], references: [id])

     image String? // Add this field for event images

     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     participations Participation[]
     invitations    Invitation[]
     reviews        Review[]

     @@index([organizerId])
     @@index([visibility])
     @@index([dateTime])
     @@map("event")
}


model Invitation {
  id          String   @id @default(cuid())

  eventId     String
  userId      String

  status      InvitationStatus @default(PENDING)

  createdAt   DateTime @default(now())

  event       Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  payment     Payment[]

  @@unique([eventId, userId])   // prevent duplicate invites
  @@index([eventId])
  @@index([status])
  @@map("invitation")
}

model Participation {
  id          String   @id @default(cuid())

  userId      String
  eventId     String

  status      ParticipationStatus @default(PENDING)

  createdAt   DateTime @default(now())

  user        User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event       Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  payment     Payment[]

  @@unique([userId, eventId])   // one join per user per event
  @@index([eventId])
  @@index([status])
  @@map("participation")
}
model Payment {
    id                 String        @id @default(uuid())
    amount             Float
    transactionId      String        @db.Uuid() @unique
    stripeEventId      String?       @unique
    status             PaymentStatus @default(PENDING)
    userId             String
    invoiceUrl         String?
    paymentGatewayData Json?
    createdAt          DateTime      @default(now())
    updatedAt          DateTime      @updatedAt

    // Payment for a Participation OR Invitation
    participationId    String?      
    participation      Participation? @relation(fields: [participationId], references: [id], onDelete: Cascade)

    invitationId       String?       
    invitation         Invitation?   @relation(fields: [invitationId], references: [id], onDelete: Cascade)

    user               User  @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([participationId])
    @@index([invitationId])
    @@index([transactionId])
    @@map("payments")
}


model Review {
  id        String   @id @default(cuid())

  rating    Int
  comment   String?

  userId    String
  eventId   String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])  // one review per user per event
  @@index([eventId])
  @@map("review")
}

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client"
  output   = "../../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
