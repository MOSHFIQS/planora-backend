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

    // Better Auth relations
    sessions Session[]
    accounts Account[]

    // Planora relations
    events         Event[]         @relation("OrganizerEvents")
    participations Participation[]
    invitations    Invitation[]
    reviews        Review[]
    payments       Payment[]
    tickets        Ticket[]

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

enum EventType {
  ONLINE
  OFFLINE
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

enum TicketStatus {
    VALID
    USED
    CANCELED
}

model Category {
    id          String   @id @default(uuid())
    name        String
    description String?
    image       String?

    isDeleted Boolean   @default(false)
    deletedAt DateTime?
    events Event[]

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([name])
    @@map("category")
}

model Event {
     id          String   @id @default(cuid())
     title       String
     description String
     venue       String?
     dateTime    DateTime

     visibility EventVisibility
     type        EventType @default(ONLINE)

     meetingLink String? // for ONLINE events

     fee Float @default(0)

     images String[] 

     categoryId String
     category   Category @relation(fields: [categoryId], references: [id])

     organizerId String
     organizer   User   @relation("OrganizerEvents", fields: [organizerId], references: [id])

     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     participations Participation[]
     invitations    Invitation[]
     reviews        Review[]
     tickets        Ticket[]

     @@index([organizerId])
     @@index([visibility])
     @@index([dateTime])
     @@map("event")
}


model Banner {
    id String @id @default(uuid())

    title       String
    description String?

    image       String
    redirectUrl String?

    position      BannerPosition
    positionOrder Int

    buttonText String?
    altText    String?

    isActive Boolean @default(true)

    isDeleted Boolean   @default(false)
    deletedAt DateTime?

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([position])
    @@index([isActive])
    @@map("banner")
}

model Invitation {
  id String @id @default(cuid())

  eventId String
  userId  String

  status InvitationStatus @default(PENDING)

  createdAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  payment Payment[]

  @@unique([eventId, userId])
  @@index([eventId])
  @@index([status])
  @@map("invitation")
}


model Participation {
  id String @id @default(cuid())

  userId  String
  eventId String

  status ParticipationStatus @default(PENDING)

  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  payment Payment[]
  ticket  Ticket?

  @@unique([userId, eventId])
  @@index([eventId])
  @@index([status])
  @@map("participation")
}

model Payment {
    id            String  @id @default(uuid())
    amount        Float
    transactionId String  @unique @db.Uuid()
    stripeEventId String? @unique

    status PaymentStatus @default(PENDING)

    userId String
    user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

    invoiceUrl         String?
    paymentGatewayData Json?

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    participationId String?
    participation   Participation? @relation(fields: [participationId], references: [id], onDelete: Cascade)

    invitationId String?
    invitation   Invitation? @relation(fields: [invitationId], references: [id], onDelete: Cascade)

    @@index([participationId])
    @@index([invitationId])
    @@index([transactionId])
    @@map("payment")
}


model Review {
  id String @id @default(cuid())

  rating  Int
  comment String?

  userId  String
  eventId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@index([eventId])
  @@map("review")
}

model Ticket {
  id String @id @default(cuid())

  userId  String
  eventId String

  participationId String? @unique

  qrCode String @unique

  status TicketStatus @default(VALID)

  checkedInAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  event         Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participation Participation? @relation(fields: [participationId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([userId])
  @@map("ticket")
}