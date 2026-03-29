var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import cookieParser from "cookie-parser";
import express from "express";

// src/app/middleware/globalErrorHandler.ts
import status4 from "http-status";
import z from "zod";

// src/generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'model User {\n  id            String  @id @default(cuid())\n  name          String\n  email         String  @unique\n  emailVerified Boolean @default(false)\n\n  role   Role       @default(USER)\n  status UserStatus @default(ACTIVE)\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n\n  image String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Better Auth relations\n  sessions Session[]\n  accounts Account[]\n\n  // Planora relations\n  events         Event[]         @relation("OrganizerEvents")\n  participations Participation[]\n  invitations    Invitation[]\n  reviews        Review[]\n  payments       Payment[]\n  tickets        Ticket[]\n\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Banner {\n  id String @id @default(uuid())\n\n  title       String\n  description String?\n\n  image       String\n  redirectUrl String?\n\n  dateTime DateTime?\n  type     EventType @default(ONLINE)\n\n  position      BannerPosition\n  positionOrder Int\n\n  buttonText String?\n  altText    String?\n\n  isActive Boolean @default(true)\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([position])\n  @@index([isActive])\n  @@map("banner")\n}\n\nmodel Category {\n  id          String  @id @default(uuid())\n  name        String\n  description String?\n  image       String?\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n  events    Event[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([name])\n  @@map("category")\n}\n\nenum Role {\n  USER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  SUSPENDED\n}\n\nenum EventVisibility {\n  PUBLIC\n  PRIVATE\n}\n\nenum EventType {\n  ONLINE\n  OFFLINE\n}\n\nenum ParticipationStatus {\n  PENDING\n  APPROVED\n  REJECTED\n  BANNED\n}\n\nenum InvitationStatus {\n  PENDING\n  ACCEPTED\n  DECLINED\n}\n\nenum PaymentStatus {\n  PENDING\n  SUCCESS\n  FAILED\n  REFUNDED\n  CANCELED\n  UNPAID\n}\n\nenum TicketStatus {\n  VALID\n  USED\n  CANCELED\n}\n\nenum BannerPosition {\n  MAIN\n  SECONDARY\n  THIRD\n}\n\nmodel Event {\n  id          String   @id @default(cuid())\n  title       String\n  description String\n  venue       String?\n  dateTime    DateTime\n\n  visibility EventVisibility\n  type       EventType       @default(ONLINE)\n\n  meetingLink String?\n\n  fee Float @default(0)\n\n  images String[]\n\n  categoryId String?\n  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)\n\n  organizerId String\n  organizer   User   @relation("OrganizerEvents", fields: [organizerId], references: [id])\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  participations Participation[]\n  invitations    Invitation[]\n  reviews        Review[]\n  tickets        Ticket[]\n\n  @@index([organizerId])\n  @@index([visibility])\n  @@index([dateTime])\n  @@map("event")\n}\n\nmodel Invitation {\n  id String @id @default(cuid())\n\n  eventId String\n  userId  String\n\n  status InvitationStatus @default(PENDING)\n\n  createdAt DateTime @default(now())\n\n  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)\n  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  payment Payment[]\n\n  @@unique([eventId, userId])\n  @@index([eventId])\n  @@index([status])\n  @@map("invitation")\n}\n\nmodel Participation {\n  id String @id @default(cuid())\n\n  userId  String\n  eventId String\n\n  status ParticipationStatus @default(PENDING)\n\n  createdAt DateTime @default(now())\n\n  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)\n  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)\n\n  payment Payment[]\n  ticket  Ticket?\n\n  @@unique([userId, eventId])\n  @@index([eventId])\n  @@index([status])\n  @@map("participation")\n}\n\nmodel Payment {\n  id            String  @id @default(uuid())\n  amount        Float\n  transactionId String  @unique @db.Uuid()\n  stripeEventId String? @unique\n\n  status PaymentStatus @default(PENDING)\n\n  userId String\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  invoiceUrl         String?\n  paymentGatewayData Json?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  participationId String?\n  participation   Participation? @relation(fields: [participationId], references: [id], onDelete: Cascade)\n\n  invitationId String?\n  invitation   Invitation? @relation(fields: [invitationId], references: [id], onDelete: Cascade)\n\n  @@index([participationId])\n  @@index([invitationId])\n  @@index([transactionId])\n  @@map("payment")\n}\n\nmodel Review {\n  id String @id @default(cuid())\n\n  rating  Int\n  comment String?\n\n  userId  String\n  eventId String\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)\n  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, eventId])\n  @@index([eventId])\n  @@map("review")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Ticket {\n  id String @id @default(cuid())\n\n  userId  String\n  eventId String\n\n  participationId String? @unique\n\n  qrCode String @unique\n\n  status TicketStatus @default(VALID)\n\n  checkedInAt DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)\n  event         Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)\n  participation Participation? @relation(fields: [participationId], references: [id], onDelete: Cascade)\n\n  @@index([eventId])\n  @@index([userId])\n  @@map("ticket")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"role","kind":"enum","type":"Role"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"events","kind":"object","type":"Event","relationName":"OrganizerEvents"},{"name":"participations","kind":"object","type":"Participation","relationName":"ParticipationToUser"},{"name":"invitations","kind":"object","type":"Invitation","relationName":"InvitationToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"tickets","kind":"object","type":"Ticket","relationName":"TicketToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Banner":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"redirectUrl","kind":"scalar","type":"String"},{"name":"dateTime","kind":"scalar","type":"DateTime"},{"name":"type","kind":"enum","type":"EventType"},{"name":"position","kind":"enum","type":"BannerPosition"},{"name":"positionOrder","kind":"scalar","type":"Int"},{"name":"buttonText","kind":"scalar","type":"String"},{"name":"altText","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"banner"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"events","kind":"object","type":"Event","relationName":"CategoryToEvent"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"category"},"Event":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"venue","kind":"scalar","type":"String"},{"name":"dateTime","kind":"scalar","type":"DateTime"},{"name":"visibility","kind":"enum","type":"EventVisibility"},{"name":"type","kind":"enum","type":"EventType"},{"name":"meetingLink","kind":"scalar","type":"String"},{"name":"fee","kind":"scalar","type":"Float"},{"name":"images","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToEvent"},{"name":"organizerId","kind":"scalar","type":"String"},{"name":"organizer","kind":"object","type":"User","relationName":"OrganizerEvents"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"participations","kind":"object","type":"Participation","relationName":"EventToParticipation"},{"name":"invitations","kind":"object","type":"Invitation","relationName":"EventToInvitation"},{"name":"reviews","kind":"object","type":"Review","relationName":"EventToReview"},{"name":"tickets","kind":"object","type":"Ticket","relationName":"EventToTicket"}],"dbName":"event"},"Invitation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"InvitationStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"event","kind":"object","type":"Event","relationName":"EventToInvitation"},{"name":"user","kind":"object","type":"User","relationName":"InvitationToUser"},{"name":"payment","kind":"object","type":"Payment","relationName":"InvitationToPayment"}],"dbName":"invitation"},"Participation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ParticipationStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ParticipationToUser"},{"name":"event","kind":"object","type":"Event","relationName":"EventToParticipation"},{"name":"payment","kind":"object","type":"Payment","relationName":"ParticipationToPayment"},{"name":"ticket","kind":"object","type":"Ticket","relationName":"ParticipationToTicket"}],"dbName":"participation"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"stripeEventId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"invoiceUrl","kind":"scalar","type":"String"},{"name":"paymentGatewayData","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"participationId","kind":"scalar","type":"String"},{"name":"participation","kind":"object","type":"Participation","relationName":"ParticipationToPayment"},{"name":"invitationId","kind":"scalar","type":"String"},{"name":"invitation","kind":"object","type":"Invitation","relationName":"InvitationToPayment"}],"dbName":"payment"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"event","kind":"object","type":"Event","relationName":"EventToReview"}],"dbName":"review"},"Ticket":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"participationId","kind":"scalar","type":"String"},{"name":"qrCode","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TicketStatus"},{"name":"checkedInAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TicketToUser"},{"name":"event","kind":"object","type":"Event","relationName":"EventToTicket"},{"name":"participation","kind":"object","type":"Participation","relationName":"ParticipationToTicket"}],"dbName":"ticket"}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  BannerScalarFieldEnum: () => BannerScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  EventScalarFieldEnum: () => EventScalarFieldEnum,
  InvitationScalarFieldEnum: () => InvitationScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  ParticipationScalarFieldEnum: () => ParticipationScalarFieldEnum,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TicketScalarFieldEnum: () => TicketScalarFieldEnum,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.3.0",
  engine: "9d6ad21cbbceab97458517b147a6a09ff43aa735"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Banner: "Banner",
  Category: "Category",
  Event: "Event",
  Invitation: "Invitation",
  Participation: "Participation",
  Payment: "Payment",
  Review: "Review",
  Ticket: "Ticket"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  role: "role",
  status: "status",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BannerScalarFieldEnum = {
  id: "id",
  title: "title",
  description: "description",
  image: "image",
  redirectUrl: "redirectUrl",
  dateTime: "dateTime",
  type: "type",
  position: "position",
  positionOrder: "positionOrder",
  buttonText: "buttonText",
  altText: "altText",
  isActive: "isActive",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  description: "description",
  image: "image",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var EventScalarFieldEnum = {
  id: "id",
  title: "title",
  description: "description",
  venue: "venue",
  dateTime: "dateTime",
  visibility: "visibility",
  type: "type",
  meetingLink: "meetingLink",
  fee: "fee",
  images: "images",
  categoryId: "categoryId",
  organizerId: "organizerId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var InvitationScalarFieldEnum = {
  id: "id",
  eventId: "eventId",
  userId: "userId",
  status: "status",
  createdAt: "createdAt"
};
var ParticipationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  eventId: "eventId",
  status: "status",
  createdAt: "createdAt"
};
var PaymentScalarFieldEnum = {
  id: "id",
  amount: "amount",
  transactionId: "transactionId",
  stripeEventId: "stripeEventId",
  status: "status",
  userId: "userId",
  invoiceUrl: "invoiceUrl",
  paymentGatewayData: "paymentGatewayData",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  participationId: "participationId",
  invitationId: "invitationId"
};
var ReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  userId: "userId",
  eventId: "eventId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TicketScalarFieldEnum = {
  id: "id",
  userId: "userId",
  eventId: "eventId",
  participationId: "participationId",
  qrCode: "qrCode",
  status: "status",
  checkedInAt: "checkedInAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/enums.ts
var Role = {
  USER: "USER",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED"
};
var EventVisibility = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE"
};
var ParticipationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  BANNED: "BANNED"
};
var InvitationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED"
};
var PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELED: "CANCELED",
  UNPAID: "UNPAID"
};

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/app/config/env.ts
import dotenv from "dotenv";
import status from "http-status";

// src/app/errorHelpers/AppError.ts
var AppError = class extends Error {
  statusCode;
  constructor(statusCode, message, stack = "") {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var AppError_default = AppError;

// src/app/config/env.ts
dotenv.config();
var loadEnvVariables = () => {
  const requireEnvVariable = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "FRONTEND_URL",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD"
  ];
  requireEnvVariable.forEach((variable) => {
    if (!process.env[variable]) {
      throw new AppError_default(
        status.INTERNAL_SERVER_ERROR,
        `Environment variable ${variable} is required but not set in .env file.`
      );
    }
  });
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE,
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
    },
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    },
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
  };
};
var envVars = loadEnvVariables();

// src/app/errorHelpers/handlePrismaErrors.ts
import status2 from "http-status";
var getStatusCodeFromPrismaError = (errorCode) => {
  if (errorCode === "P2002") {
    return status2.CONFLICT;
  }
  if (["P2025", "P2001", "P2015", "P2018"].includes(errorCode)) {
    return status2.NOT_FOUND;
  }
  if (["P1000", "P6002"].includes(errorCode)) {
    return status2.UNAUTHORIZED;
  }
  if (["P1010", "P6010"].includes(errorCode)) {
    return status2.FORBIDDEN;
  }
  if (errorCode === "P6003") {
    return status2.PAYMENT_REQUIRED;
  }
  if (["P1008", "P2004", "P6004"].includes(errorCode)) {
    return status2.GATEWAY_TIMEOUT;
  }
  if (errorCode === "P5011") {
    return status2.TOO_MANY_REQUESTS;
  }
  if (errorCode === "P6009") {
    return 413;
  }
  if (errorCode.startsWith("P1") || ["P2024", "P2037", "P6008"].includes(errorCode)) {
    return status2.SERVICE_UNAVAILABLE;
  }
  if (errorCode.startsWith("P2")) {
    return status2.BAD_REQUEST;
  }
  if (errorCode.startsWith("P3") || errorCode.startsWith("P4")) {
    return status2.INTERNAL_SERVER_ERROR;
  }
  return status2.INTERNAL_SERVER_ERROR;
};
var formatErrorMeta = (meta) => {
  if (!meta) return "";
  const parts = [];
  if (meta.target) {
    parts.push(`Field(s): ${String(meta.target)}`);
  }
  if (meta.field_name) {
    parts.push(`Field: ${String(meta.field_name)}`);
  }
  if (meta.column_name) {
    parts.push(`Column: ${String(meta.column_name)}`);
  }
  if (meta.table) {
    parts.push(`Table: ${String(meta.table)}`);
  }
  if (meta.model_name) {
    parts.push(`Model: ${String(meta.model_name)}`);
  }
  if (meta.relation_name) {
    parts.push(`Relation: ${String(meta.relation_name)}`);
  }
  if (meta.constraint) {
    parts.push(`Constraint: ${String(meta.constraint)}`);
  }
  if (meta.database_error) {
    parts.push(`Database Error: ${String(meta.database_error)}`);
  }
  return parts.length > 0 ? parts.join(" |") : "";
};
var handlePrismaClientKnownRequestError = (error) => {
  const statusCode = getStatusCodeFromPrismaError(error.code);
  const metaInfo = formatErrorMeta(error.meta);
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred with the database operation.";
  const errorSources = [
    {
      path: error.code,
      message: metaInfo ? `${mainMessage} | ${metaInfo}` : mainMessage
    }
  ];
  if (error.meta?.cause) {
    errorSources.push({
      path: "cause",
      message: String(error.meta.cause)
    });
  }
  return {
    success: false,
    statusCode,
    message: `Prisma Client Known Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientUnknownError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An unknown error occurred with the database operation.";
  const errorSources = [
    {
      path: "Unknown Prisma Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode: status2.INTERNAL_SERVER_ERROR,
    message: `Prisma Client Unknown Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientValidationError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const errorSources = [];
  const fieldMatch = cleanMessage.match(/Argument `(\w+)`/i);
  const fieldName = fieldMatch ? fieldMatch[1] : "Unknown Field";
  const mainMessage = lines.find(
    (line) => !line.includes("Argument") && !line.includes("\u2192") && line.length > 10
  ) || lines[0] || "Invalid query parameters provided to the database operation.";
  errorSources.push({
    path: fieldName,
    message: mainMessage
  });
  return {
    success: false,
    statusCode: status2.BAD_REQUEST,
    message: `Prisma Client Validation Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientInitializationError = (error) => {
  const statusCode = error.errorCode ? getStatusCodeFromPrismaError(error.errorCode) : status2.SERVICE_UNAVAILABLE;
  const cleanMessage = error.message;
  cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred while initializing the Prisma Client.";
  const errorSources = [
    {
      path: error.errorCode || "Initialization Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode,
    message: `Prisma Client Initialization Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientRustPanicError = () => {
  const errorSources = [{
    path: "Rust Engine Crashed",
    message: "The database engine encountered a fatal error and crashed. This is usually due to an internal bug in the Prisma engine or an unexpected edge case in the database operation. Please check the Prisma logs for more details and consider reporting this issue to the Prisma team if it persists."
  }];
  return {
    success: false,
    statusCode: status2.INTERNAL_SERVER_ERROR,
    message: "Prisma Client Rust Panic Error: The database engine crashed due to a fatal error.",
    errorSources
  };
};

// src/app/errorHelpers/handleZodError.ts
import status3 from "http-status";
var handleZodError = (err) => {
  const statusCode = status3.BAD_REQUEST;
  const message = "Zod Validation Error";
  const errorSources = [];
  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => "),
      message: issue.message
    });
  });
  return {
    success: false,
    message,
    errorSources,
    statusCode
  };
};

// src/app/middleware/globalErrorHandler.ts
var globalErrorHandler = async (err, req, res, next) => {
  if (envVars.NODE_ENV === "development") {
    console.log("Error from Global Error Handler", err);
  }
  let errorSources = [];
  let statusCode = status4.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack = void 0;
  if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaClientUnknownError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    const simplifiedError = handlerPrismaClientRustPanicError();
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    const simplifiedError = handlerPrismaClientInitializationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof z.ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError_default) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  } else if (err instanceof Error) {
    statusCode = status4.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  }
  const errorResponse = {
    success: false,
    message,
    errorSources,
    error: envVars.NODE_ENV === "development" ? err : void 0,
    stack: envVars.NODE_ENV === "development" ? stack : void 0
  };
  res.status(statusCode).json(errorResponse);
};

// src/app/middleware/notFound.ts
import status5 from "http-status";
var notFound = (req, res) => {
  res.status(status5.NOT_FOUND).json({
    message: "Route not found!",
    path: req.originalUrl,
    date: Date()
  });
};

// src/app/routes/index.ts
import { Router as Router15 } from "express";

// src/app/module/auth/auth.route.ts
import { Router } from "express";

// src/app/module/auth/auth.controller.ts
import status7 from "http-status";

// src/app/shared/catchAsync.ts
var catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// src/app/shared/sendResponse.ts
var sendResponse = (res, responseData) => {
  const { httpStatusCode, success, message, data, meta } = responseData;
  res.status(httpStatusCode).json({
    success,
    message,
    data,
    meta
  });
};

// src/app/utils/token.ts
import ms from "ms";

// src/app/utils/cookie.ts
var setCookie = (res, key, value, options) => {
  res.cookie(key, value, options);
};
var getCookie = (req, key) => {
  return req.cookies[key];
};
var clearCookie = (res, key, options) => {
  res.clearCookie(key, options);
};
var CookieUtils = {
  setCookie,
  getCookie,
  clearCookie
};

// src/app/utils/jwt.ts
import jwt from "jsonwebtoken";
var createToken = (payload, secret, { expiresIn }) => {
  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};
var verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};
var decodeToken = (token) => {
  const decoded = jwt.decode(token);
  return decoded;
};
var jwtUtils = {
  createToken,
  verifyToken,
  decodeToken
};

// src/app/utils/token.ts
var parseMsValue = (value) => ms(value);
var setCookieOptions = (maxAgeMs) => ({
  maxAge: maxAgeMs
});
var setAccessTokenCookie = (res, token) => {
  CookieUtils.setCookie(res, "accessToken", token, setCookieOptions(parseMsValue(envVars.ACCESS_TOKEN_EXPIRES_IN)));
};
var setRefreshTokenCookie = (res, token) => {
  CookieUtils.setCookie(res, "refreshToken", token, setCookieOptions(parseMsValue(envVars.REFRESH_TOKEN_EXPIRES_IN)));
};
var setBetterAuthSessionCookie = (res, token) => {
  CookieUtils.setCookie(res, "better-auth.session_token", token, setCookieOptions(parseMsValue(envVars.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN)));
};
var getAccessToken = (payload) => {
  return jwtUtils.createToken(payload, envVars.ACCESS_TOKEN_SECRET, {
    expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN
  });
};
var getRefreshToken = (payload) => {
  return jwtUtils.createToken(payload, envVars.REFRESH_TOKEN_SECRET, {
    expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN
  });
};
var tokenUtils = {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
  getAccessToken,
  getRefreshToken
};

// src/app/module/auth/auth.service.ts
import status6 from "http-status";

// src/app/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/app/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
var connectionString = envVars.DATABASE_URL;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/app/lib/auth.ts
var auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.USER
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      deletedAt: {
        type: "date",
        required: false
        // optional
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24,
    // 1 day in seconds
    updateAge: 60 * 60 * 24,
    // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24
      // 1 day
    }
  }
  // Optional: trusted origins for CORS, especially if you deploy frontend separately
  // trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  //  advanced: {
  //       // disableCSRFCheck: true,
  //       useSecureCookies: false,
  //       cookies: {
  //            state: {
  //                 attributes: {
  //                      sameSite: "none",
  //                      secure: true,
  //                      httpOnly: true,
  //                      path: "/",
  //                 },
  //            },
  //            sessionToken: {
  //                 attributes: {
  //                      sameSite: "none",
  //                      secure: true,
  //                      httpOnly: true,
  //                      path: "/",
  //                 },
  //            },
  //       },
  //  },
});

// src/app/module/auth/auth.service.ts
import ms2 from "ms";
var registerUser = async (payload) => {
  const { name, email, password, image } = payload;
  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
      image
    }
  });
  if (!data.user) {
    throw new AppError_default(status6.BAD_REQUEST, "Failed to register user");
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  return {
    ...data,
    accessToken,
    refreshToken
  };
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const data = await auth.api.signInEmail({
    body: {
      email,
      password
    }
  });
  if (data.user.status === UserStatus.SUSPENDED) {
    throw new AppError_default(status6.FORBIDDEN, "User is suspended");
  }
  if (data.user.isDeleted) {
    throw new AppError_default(status6.NOT_FOUND, "User is deleted");
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  return {
    ...data,
    accessToken,
    refreshToken
  };
};
var getNewToken = async (refreshToken, sessionToken) => {
  const session = await prisma.session.findUnique({
    where: {
      token: sessionToken
    },
    include: {
      user: true
    }
  });
  if (!session) {
    throw new AppError_default(status6.UNAUTHORIZED, "Invalid session token");
  }
  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET
  );
  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError_default(status6.UNAUTHORIZED, "Invalid refresh token");
  }
  const data = verifiedRefreshToken.data;
  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified
  });
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified
  });
  const { token } = await prisma.session.update({
    where: {
      token: sessionToken
    },
    data: {
      token: sessionToken,
      expiresAt: new Date(
        Date.now() + ms2(
          envVars.REFRESH_TOKEN_EXPIRES_IN
        )
      ),
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token
  };
};
var AuthService = {
  registerUser,
  loginUser,
  getNewToken
};

// src/app/module/auth/auth.controller.ts
var registerUser2 = catchAsync(async (req, res) => {
  const payload = req.body;
  console.log(payload);
  const result = await AuthService.registerUser(payload);
  console.log(result);
  const { accessToken, refreshToken, token, ...rest } = result;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);
  sendResponse(res, {
    httpStatusCode: status7.CREATED,
    success: true,
    message: "User registered successfully",
    data: {
      token,
      accessToken,
      refreshToken,
      ...rest
    }
  });
});
var loginUser2 = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await AuthService.loginUser(payload);
  const { accessToken, refreshToken, token, ...rest } = result;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);
  sendResponse(res, {
    httpStatusCode: status7.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      token,
      accessToken,
      refreshToken,
      ...rest
    }
  });
});
var getNewToken2 = catchAsync(
  async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log("refreshToken", refreshToken);
    console.log("tokens", req.cookies);
    const betterAuthSessionToken = req.cookies["better-auth.session_token"];
    if (!refreshToken) {
      throw new AppError_default(status7.UNAUTHORIZED, "Refresh token is missing");
    }
    const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);
    const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, sessionToken);
    sendResponse(res, {
      httpStatusCode: status7.OK,
      success: true,
      message: "New tokens generated successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        sessionToken
      }
    });
  }
);
var AuthController = {
  registerUser: registerUser2,
  loginUser: loginUser2,
  getNewToken: getNewToken2
};

// src/app/module/auth/auth.route.ts
var router = Router();
router.post("/register", AuthController.registerUser);
router.post("/login", AuthController.loginUser);
router.post("/refresh-token", AuthController.getNewToken);
var AuthRoutes = router;

// src/app/module/event/event.route.ts
import { Router as Router2 } from "express";

// src/app/middleware/checkAuth.ts
import status8 from "http-status";
var checkAuth = (...authRoles) => {
  return async (req, res, next) => {
    try {
      const sessionToken = CookieUtils.getCookie(
        req,
        "better-auth.session_token"
      );
      console.log("sessionToken", sessionToken);
      if (!sessionToken) {
        throw new Error(
          "Unauthorized access! No session token provided."
        );
      }
      if (sessionToken) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: /* @__PURE__ */ new Date()
            }
          },
          include: {
            user: true
          }
        });
        if (sessionExists && sessionExists.user) {
          const user = sessionExists.user;
          const now = /* @__PURE__ */ new Date();
          const expiresAt = new Date(sessionExists.expiresAt);
          const createdAt = new Date(sessionExists.createdAt);
          const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
          const timeRemaining = expiresAt.getTime() - now.getTime();
          const percentRemaining = timeRemaining / sessionLifeTime * 100;
          if (percentRemaining < 20) {
            res.setHeader("X-Session-Refresh", "true");
            res.setHeader(
              "X-Session-Expires-At",
              expiresAt.toISOString()
            );
            res.setHeader(
              "X-Time-Remaining",
              timeRemaining.toString()
            );
            console.log("Session Expiring Soon!!");
          }
          if (user.status === UserStatus.SUSPENDED) {
            throw new AppError_default(
              status8.UNAUTHORIZED,
              "Unauthorized access! User is not active."
            );
          }
          if (user.isDeleted) {
            throw new AppError_default(
              status8.UNAUTHORIZED,
              "Unauthorized access! User is deleted."
            );
          }
          if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError_default(
              status8.FORBIDDEN,
              "Forbidden access! You do not have permission to access this resource."
            );
          }
          req.user = {
            userId: user.id,
            role: user.role,
            email: user.email
          };
        }
        const accessToken2 = CookieUtils.getCookie(
          req,
          "accessToken"
        );
        if (!accessToken2) {
          throw new AppError_default(
            status8.UNAUTHORIZED,
            "Unauthorized access! No access token provided."
          );
        }
      }
      console.log("req.user", req?.user);
      const accessToken = CookieUtils.getCookie(req, "accessToken");
      if (!accessToken) {
        throw new AppError_default(
          status8.UNAUTHORIZED,
          "Unauthorized access! No access token provided."
        );
      }
      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET
      );
      console.log("verifiedToken", verifiedToken);
      if (!verifiedToken.success) {
        throw new AppError_default(
          status8.UNAUTHORIZED,
          "Unauthorized access! Invalid access token."
        );
      }
      if (authRoles.length > 0 && !authRoles.includes(verifiedToken.data.role)) {
        throw new AppError_default(
          status8.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource."
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// src/app/module/event/event.controller.ts
import status10 from "http-status";

// src/app/module/event/event.service.ts
import status9 from "http-status";

// src/app/utils/QueryBuilder.ts
var QueryBuilder = class {
  constructor(model, queryParams, config2 = {}) {
    this.model = model;
    this.queryParams = queryParams;
    this.config = config2;
    this.query = {
      where: {},
      include: {},
      orderBy: {},
      skip: 0,
      take: 10
    };
    this.countQuery = {
      where: {}
    };
  }
  query;
  countQuery;
  page = 1;
  limit = 10;
  skip = 0;
  sortBy = "createdAt";
  sortOrder = "desc";
  selectFields;
  search() {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;
    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchConditions = searchableFields.map(
        (field) => {
          if (field.includes(".")) {
            const parts = field.split(".");
            if (parts.length === 2) {
              const [relation, nestedField] = parts;
              const stringFilter2 = {
                contains: searchTerm,
                mode: "insensitive"
              };
              return {
                [relation]: {
                  [nestedField]: stringFilter2
                }
              };
            } else if (parts.length === 3) {
              const [relation, nestedRelation, nestedField] = parts;
              const stringFilter2 = {
                contains: searchTerm,
                mode: "insensitive"
              };
              return {
                [relation]: {
                  some: {
                    [nestedRelation]: {
                      [nestedField]: stringFilter2
                    }
                  }
                }
              };
            }
          }
          const stringFilter = {
            contains: searchTerm,
            mode: "insensitive"
          };
          return {
            [field]: stringFilter
          };
        }
      );
      const whereConditions = this.query.where;
      whereConditions.OR = searchConditions;
      const countWhereConditions = this.countQuery.where;
      countWhereConditions.OR = searchConditions;
    }
    return this;
  }
  // /doctors?searchTerm=john&page=1&sortBy=name&specialty=cardiology&appointmentFee[lt]=100 => {}
  // { specialty: 'cardiology', appointmentFee: { lt: '100' } }
  filter() {
    const { filterableFields } = this.config;
    const excludedField = ["searchTerm", "page", "limit", "sortBy", "sortOrder", "fields", "include"];
    const filterParams = {};
    Object.keys(this.queryParams).forEach((key) => {
      if (!excludedField.includes(key)) {
        filterParams[key] = this.queryParams[key];
      }
    });
    const queryWhere = this.query.where;
    const countQueryWhere = this.countQuery.where;
    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key];
      if (value === void 0 || value === "") {
        return;
      }
      const isAllowedField = !filterableFields || filterableFields.length === 0 || filterableFields.includes(key);
      if (key.includes(".")) {
        const parts = key.split(".");
        if (filterableFields && !filterableFields.includes(key)) {
          return;
        }
        if (parts.length === 2) {
          const [relation, nestedField] = parts;
          if (!queryWhere[relation]) {
            queryWhere[relation] = {};
            countQueryWhere[relation] = {};
          }
          const queryRelation = queryWhere[relation];
          const countRelation = countQueryWhere[relation];
          queryRelation[nestedField] = this.parseFilterValue(value);
          countRelation[nestedField] = this.parseFilterValue(value);
          return;
        } else if (parts.length === 3) {
          const [relation, nestedRelation, nestedField] = parts;
          if (!queryWhere[relation]) {
            queryWhere[relation] = {
              some: {}
            };
            countQueryWhere[relation] = {
              some: {}
            };
          }
          const queryRelation = queryWhere[relation];
          const countRelation = countQueryWhere[relation];
          if (!queryRelation.some) {
            queryRelation.some = {};
          }
          if (!countRelation.some) {
            countRelation.some = {};
          }
          const querySome = queryRelation.some;
          const countSome = countRelation.some;
          if (!querySome[nestedRelation]) {
            querySome[nestedRelation] = {};
          }
          if (!countSome[nestedRelation]) {
            countSome[nestedRelation] = {};
          }
          const queryNestedRelation = querySome[nestedRelation];
          const countNestedRelation = countSome[nestedRelation];
          queryNestedRelation[nestedField] = this.parseFilterValue(value);
          countNestedRelation[nestedField] = this.parseFilterValue(value);
          return;
        }
      }
      if (!isAllowedField) {
        return;
      }
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        queryWhere[key] = this.parseRangeFilter(value);
        countQueryWhere[key] = this.parseRangeFilter(value);
        return;
      }
      queryWhere[key] = this.parseFilterValue(value);
      countQueryWhere[key] = this.parseFilterValue(value);
    });
    return this;
  }
  paginate() {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || 10;
    this.page = page;
    this.limit = limit;
    this.skip = (page - 1) * limit;
    this.query.skip = this.skip;
    this.query.take = this.limit;
    return this;
  }
  sort() {
    const sortBy = this.queryParams.sortBy || "createdAt";
    const sortOrder = this.queryParams.sortOrder === "asc" ? "asc" : "desc";
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      if (parts.length === 2) {
        const [relation, nestedField] = parts;
        this.query.orderBy = {
          [relation]: {
            [nestedField]: sortOrder
          }
        };
      } else if (parts.length === 3) {
        const [relation, nestedRelation, nestedField] = parts;
        this.query.orderBy = {
          [relation]: {
            [nestedRelation]: {
              [nestedField]: sortOrder
            }
          }
        };
      } else {
        this.query.orderBy = {
          [sortBy]: sortOrder
        };
      }
    } else {
      this.query.orderBy = {
        [sortBy]: sortOrder
      };
    }
    return this;
  }
  fields() {
    const fieldsParam = this.queryParams.fields;
    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArray = fieldsParam?.split(",").map((field) => field.trim());
      this.selectFields = {};
      fieldsArray?.forEach((field) => {
        if (this.selectFields) {
          this.selectFields[field] = true;
        }
      });
      this.query.select = this.selectFields;
      delete this.query.include;
    }
    return this;
  }
  include(relation) {
    if (this.selectFields) {
      return this;
    }
    this.query.include = { ...this.query.include, ...relation };
    return this;
  }
  dynamicInclude(includeConfig, defaultInclude) {
    if (this.selectFields) {
      return this;
    }
    const result = {};
    defaultInclude?.forEach((field) => {
      if (includeConfig[field]) {
        result[field] = includeConfig[field];
      }
    });
    const includeParam = this.queryParams.include;
    if (includeParam && typeof includeParam === "string") {
      const requestedRelations = includeParam.split(",").map((relation) => relation.trim());
      requestedRelations.forEach((relation) => {
        if (includeConfig[relation]) {
          result[relation] = includeConfig[relation];
        }
      });
    }
    this.query.include = { ...this.query.include, ...result };
    return this;
  }
  selectFixed(select) {
    this.selectFields = select;
    this.query.select = select;
    delete this.query.include;
    return this;
  }
  where(condition) {
    this.query.where = this.deepMerge(this.query.where, condition);
    this.countQuery.where = this.deepMerge(this.countQuery.where, condition);
    return this;
  }
  async execute() {
    const [total, data] = await Promise.all([
      this.model.count(this.countQuery),
      this.model.findMany(this.query)
    ]);
    const totalPages = Math.ceil(total / this.limit);
    return {
      data,
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages
      }
    };
  }
  async count() {
    return await this.model.count(this.countQuery);
  }
  getQuery() {
    return this.query;
  }
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  parseFilterValue(value) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (typeof value === "string" && !isNaN(Number(value)) && value != "") {
      return Number(value);
    }
    if (Array.isArray(value)) {
      return { in: value.map((item) => this.parseFilterValue(item)) };
    }
    return value;
  }
  parseRangeFilter(value) {
    const rangeQuery = {};
    Object.keys(value).forEach((operator) => {
      const operatorValue = value[operator];
      const parsedValue = typeof operatorValue === "string" && !isNaN(Number(operatorValue)) ? Number(operatorValue) : operatorValue;
      switch (operator) {
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "equals":
        case "not":
        case "contains":
        case "startsWith":
        case "endsWith":
          rangeQuery[operator] = parsedValue;
          break;
        case "in":
        case "notIn":
          if (Array.isArray(operatorValue)) {
            rangeQuery[operator] = operatorValue;
          } else {
            rangeQuery[operator] = [parsedValue];
          }
          break;
        default:
          break;
      }
    });
    return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
  }
};

// src/app/module/event/event.constant.ts
var eventSearchableFields = ["title"];
var eventFilterableFields = ["categoryId", "type"];

// src/app/module/event/event.service.ts
var createEvent = async (user, payload) => {
  const categoryExists = await prisma.category.findUnique({
    where: { id: payload.categoryId }
  });
  if (!categoryExists) {
    throw new Error("Category does not exist");
  }
  return prisma.event.create({
    data: {
      ...payload,
      organizerId: user.userId,
      dateTime: new Date(payload.dateTime)
    }
  });
};
var getAllEvents = async (query) => {
  const queryBuilder = new QueryBuilder(
    prisma.event,
    query,
    {
      searchableFields: eventSearchableFields,
      filterableFields: eventFilterableFields
    }
  );
  const result = await queryBuilder.search().filter().where({
    visibility: EventVisibility.PUBLIC
  }).selectFixed({
    id: true,
    title: true,
    dateTime: true,
    type: true,
    fee: true,
    images: true,
    categoryId: true
  }).sort().paginate().execute();
  return result;
};
var getMyEvents = async (user, query) => {
  const queryBuilder = new QueryBuilder(prisma.event, query);
  const result = await queryBuilder.where({
    organizerId: user.userId
  }).sort().paginate().execute();
  return result;
};
var getSingleEventPublic = async (user, eventId) => {
  const participation = await prisma.participation.findFirst({
    where: {
      eventId,
      userId: user.userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          venue: true,
          dateTime: true,
          type: true,
          fee: true,
          images: true,
          meetingLink: true,
          organizerId: true,
          organizer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      ticket: true,
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          invoiceUrl: true,
          transactionId: true
        }
      }
    }
  });
  const isUnlocked = participation && (participation.status === ParticipationStatus.APPROVED || participation.payment?.some(
    (p) => p.status === PaymentStatus.SUCCESS
  ));
  if (isUnlocked) {
    return {
      type: "FULL",
      data: participation
    };
  }
  const event = await prisma.event.findUnique({
    where: {
      id: eventId
    },
    select: {
      id: true,
      title: true,
      venue: true,
      dateTime: true,
      type: true,
      fee: true,
      images: true,
      organizer: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (!event) {
    throw new AppError_default(status9.NOT_FOUND, "Event not found");
  }
  return {
    type: "PUBLIC",
    data: event
  };
};
var organizersSingleEventById = async (id) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      participations: true,
      invitations: true,
      reviews: true
    }
  });
  if (!event) {
    throw new AppError_default(status9.NOT_FOUND, "Event not found");
  }
  return event;
};
var updateEvent = async (id, user, payload) => {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError_default(status9.NOT_FOUND, "Event not found");
  if (event.organizerId !== user.userId && user.role !== Role.ADMIN) {
    throw new AppError_default(status9.FORBIDDEN, "Not authorized");
  }
  if (payload.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: payload.categoryId }
    });
    if (!categoryExists) {
      throw new AppError_default(status9.BAD_REQUEST, "Category does not exist");
    }
  }
  const dataToUpdate = {
    ...payload,
    dateTime: payload.dateTime ? new Date(payload.dateTime) : void 0
  };
  return prisma.event.update({
    where: { id },
    data: dataToUpdate
  });
};
var deleteEvent = async (id, user) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      participations: true
    }
  });
  if (!event) {
    throw new AppError_default(status9.NOT_FOUND, "Event not found");
  }
  if (event.organizerId !== user.userId && user.role !== Role.ADMIN) {
    throw new AppError_default(status9.FORBIDDEN, "Not authorized");
  }
  if (event.participations.length > 0) {
    throw new AppError_default(
      status9.BAD_REQUEST,
      "Cannot delete event. Participants already joined."
    );
  }
  await prisma.event.delete({
    where: { id }
  });
};
var getAllEventsAdmin = async () => {
  return prisma.event.findMany({
    include: {
      organizer: true
    }
  });
};
var EventService = {
  createEvent,
  getAllEvents,
  getSingleEventPublic,
  organizersSingleEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  getAllEventsAdmin
};

// src/app/module/event/event.controller.ts
var createEvent2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new AppError_default(status10.UNAUTHORIZED, "Unauthorized");
  }
  const result = await EventService.createEvent(user, req.body);
  sendResponse(res, {
    httpStatusCode: status10.CREATED,
    success: true,
    message: "Event created successfully",
    data: result
  });
});
var getAllEvents2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await EventService.getAllEvents(query);
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "Events fetched successfully",
    data: result
  });
});
var getSingleEventPublic2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const result = await EventService.getSingleEventPublic(user, id);
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "Event fetched successfully",
    data: result
  });
});
var organizersSingleEventById2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const event = await EventService.organizersSingleEventById(id);
  if (event.organizerId !== userId && userRole !== "ADMIN") {
    throw new AppError_default(status10.UNAUTHORIZED, "You are not authorized to view this event");
  }
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "Event fetched successfully",
    data: event
  });
});
var getMyEvents2 = catchAsync(async (req, res) => {
  const query = req.query;
  const user = req.user;
  if (!user) {
    throw new AppError_default(status10.UNAUTHORIZED, "Unauthorized");
  }
  const result = await EventService.getMyEvents(user, query);
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "My events fetched successfully",
    data: result
  });
});
var updateEvent2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) {
    throw new AppError_default(status10.UNAUTHORIZED, "Unauthorized");
  }
  const result = await EventService.updateEvent(
    id,
    user,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "Event updated successfully",
    data: result
  });
});
var deleteEvent2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) {
    throw new AppError_default(status10.UNAUTHORIZED, "Unauthorized");
  }
  await EventService.deleteEvent(id, user);
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "Event deleted successfully"
  });
});
var getAllEventsAdmin2 = catchAsync(async (req, res) => {
  const result = await EventService.getAllEventsAdmin();
  sendResponse(res, {
    httpStatusCode: status10.OK,
    success: true,
    message: "All events fetched (Admin)",
    data: result
  });
});
var EventController = {
  createEvent: createEvent2,
  getAllEvents: getAllEvents2,
  getSingleEventPublic: getSingleEventPublic2,
  organizersSingleEventById: organizersSingleEventById2,
  getMyEvents: getMyEvents2,
  updateEvent: updateEvent2,
  deleteEvent: deleteEvent2,
  getAllEventsAdmin: getAllEventsAdmin2
};

// src/app/module/event/event.route.ts
var router2 = Router2();
router2.get("/", EventController.getAllEvents);
router2.get("/public/:id", checkAuth(Role.USER, Role.ADMIN), EventController.getSingleEventPublic);
router2.post("/", checkAuth(Role.USER, Role.ADMIN), EventController.createEvent);
router2.get("/me/events", checkAuth(Role.USER, Role.ADMIN), EventController.getMyEvents);
router2.get("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.organizersSingleEventById);
router2.patch("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.updateEvent);
router2.delete("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.deleteEvent);
router2.get("/admin/all", checkAuth(Role.ADMIN), EventController.getAllEventsAdmin);
var EventRoutes = router2;

// src/app/module/participation/participation.route.ts
import { Router as Router3 } from "express";

// src/app/module/participation/participation.controller.ts
import status12 from "http-status";

// src/app/module/participation/participation.service.ts
import status11 from "http-status";
var getMyEvents3 = async (user, query) => {
  if (!user?.userId) {
    throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  }
  const approvedQB = new QueryBuilder(
    prisma.participation,
    query
  ).where({
    userId: user.userId,
    OR: [
      { status: ParticipationStatus.APPROVED },
      {
        payment: {
          some: {
            status: PaymentStatus.SUCCESS
          }
        }
      }
    ]
  }).include({
    event: {
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        dateTime: true,
        type: true,
        fee: true,
        images: true,
        meetingLink: true,
        organizer: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          where: {
            userId: user.userId
          },
          select: {
            id: true
          }
        }
      }
    },
    ticket: true,
    payment: {
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        invoiceUrl: true,
        transactionId: true
      }
    }
  }).sort().paginate();
  const approvedResult = await approvedQB.execute();
  const pendingQB = new QueryBuilder(
    prisma.participation,
    query
  ).where({
    userId: user.userId,
    status: ParticipationStatus.PENDING,
    payment: {
      none: {
        status: PaymentStatus.SUCCESS
      }
    }
  }).include({
    event: {
      select: {
        id: true,
        title: true,
        dateTime: true,
        type: true,
        venue: true,
        fee: true,
        images: true
      }
    }
  }).sort().paginate();
  const pendingResult = await pendingQB.execute();
  const mergedData = [
    ...approvedResult.data,
    ...pendingResult.data
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const total = approvedResult.meta.total + pendingResult.meta.total;
  const limit = approvedResult.meta.limit;
  const page = approvedResult.meta.page;
  return {
    data: mergedData,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getEventParticipants = async (user, eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });
  if (!event) {
    throw new AppError_default(status11.NOT_FOUND, "Event not found");
  }
  const isOrganizer = event.organizerId === user.userId;
  const isAdmin = user.role === "ADMIN";
  if (!isOrganizer && !isAdmin) {
    throw new AppError_default(
      status11.FORBIDDEN,
      "You are not allowed to view participants"
    );
  }
  return prisma.participation.findMany({
    where: { eventId },
    include: {
      user: true
    }
  });
};
var getMyAllEventParticipants = async (user) => {
  if (!user?.userId) {
    throw new AppError_default(status11.UNAUTHORIZED, "Unauthorized");
  }
  const events = await prisma.event.findMany({
    where: { organizerId: user.userId },
    select: {
      id: true,
      title: true,
      dateTime: true,
      participations: {
        select: {
          user: { select: { id: true, name: true, email: true, image: true } },
          status: true
        }
      },
      invitations: {
        select: {
          user: { select: { id: true, name: true, email: true, image: true } },
          status: true
        }
      }
    }
  });
  const usersMap = /* @__PURE__ */ new Map();
  events.forEach((event) => {
    event.participations.forEach((p) => {
      const existingUser = usersMap.get(p.user.id) || { ...p.user, events: [] };
      const eventIndex = existingUser.events.findIndex(
        (e) => e.eventId === event.id
      );
      if (p.status === "APPROVED" || p.status === "PENDING") {
        const invited = p.status === "PENDING";
        if (eventIndex > -1) {
          existingUser.events[eventIndex] = {
            ...existingUser.events[eventIndex],
            participationStatus: p.status,
            invited
          };
        } else {
          existingUser.events.push({
            eventId: event.id,
            title: event.title,
            dateTime: event.dateTime,
            participationStatus: p.status,
            invitationStatus: null,
            invited
          });
        }
        usersMap.set(p.user.id, existingUser);
      }
    });
    event.invitations.forEach((inv) => {
      const existingUser = usersMap.get(inv.user.id) || { ...inv.user, events: [] };
      const eventIndex = existingUser.events.findIndex(
        (e) => e.eventId === event.id
      );
      if (eventIndex > -1) {
        const hasApproved = existingUser.events[eventIndex].participationStatus === "APPROVED";
        existingUser.events[eventIndex] = {
          ...existingUser.events[eventIndex],
          invitationStatus: inv.status,
          invited: hasApproved ? false : true
        };
      } else {
        existingUser.events.push({
          eventId: event.id,
          title: event.title,
          dateTime: event.dateTime,
          participationStatus: null,
          invitationStatus: inv.status,
          invited: true
        });
      }
      usersMap.set(inv.user.id, existingUser);
    });
  });
  return Array.from(usersMap.values());
};
var updateStatus = async (user, participationId, newStatus) => {
  const participation = await prisma.participation.findUnique({
    where: { id: participationId },
    include: { event: true }
  });
  if (!participation) {
    throw new AppError_default(status11.NOT_FOUND, "Participation not found");
  }
  if (participation.event.organizerId !== user.userId && user.role !== "ADMIN") {
    throw new AppError_default(status11.FORBIDDEN, "Not authorized");
  }
  return prisma.participation.update({
    where: { id: participationId },
    data: { status: newStatus }
  });
};
var ParticipationService = {
  getMyEvents: getMyEvents3,
  getMyAllEventParticipants,
  getEventParticipants,
  updateStatus
};

// src/app/module/participation/participation.controller.ts
var getMyEvents4 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await ParticipationService.getMyEvents(user, query);
  sendResponse(res, {
    httpStatusCode: status12.OK,
    success: true,
    message: result.data.length === 0 ? "You have not joined any events yet." : "My events fetched",
    data: result
  });
});
var getEventParticipants2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError_default(status12.UNAUTHORIZED, "Unauthorized");
  const { eventId } = req.params;
  const result = await ParticipationService.getEventParticipants(
    user,
    eventId
  );
  sendResponse(res, {
    httpStatusCode: status12.OK,
    success: true,
    message: "Participants fetched",
    data: result
  });
});
var getMyAllEventParticipants2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError_default(status12.UNAUTHORIZED, "Unauthorized");
  const result = await ParticipationService.getMyAllEventParticipants(user);
  sendResponse(res, {
    httpStatusCode: status12.OK,
    success: true,
    message: "All participants of your events fetched",
    data: result
  });
});
var updateStatus2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError_default(status12.UNAUTHORIZED, "Unauthorized");
  const { id } = req.params;
  const { status: newStatus } = req.body;
  if (!Object.values(ParticipationStatus).includes(newStatus)) {
    throw new AppError_default(status12.BAD_REQUEST, "Invalid status value");
  }
  const result = await ParticipationService.updateStatus(
    user,
    id,
    newStatus
  );
  sendResponse(res, {
    httpStatusCode: status12.OK,
    success: true,
    message: `Participation ${newStatus.toLowerCase()}`,
    data: result
  });
});
var ParticipationController = {
  getMyEvents: getMyEvents4,
  getMyAllEventParticipants: getMyAllEventParticipants2,
  getEventParticipants: getEventParticipants2,
  updateStatus: updateStatus2
};

// src/app/module/participation/participation.route.ts
var router3 = Router3();
router3.get(
  "/my-events",
  checkAuth(Role.USER, Role.ADMIN),
  ParticipationController.getMyEvents
);
router3.get(
  "/event/:eventId",
  checkAuth(Role.USER, Role.ADMIN),
  ParticipationController.getEventParticipants
);
router3.get(
  "/my-all-participants",
  checkAuth(Role.USER, Role.ADMIN),
  ParticipationController.getMyAllEventParticipants
);
router3.patch(
  "/:id/status",
  checkAuth(Role.USER, Role.ADMIN),
  ParticipationController.updateStatus
);
var ParticipationRoutes = router3;

// src/app/module/invitation/invitation.route.ts
import { Router as Router4 } from "express";

// src/app/module/invitation/invitation.controller.ts
import status14 from "http-status";

// src/app/module/invitation/invitation.service.ts
import status13 from "http-status";
var sendInvitation = async (user, eventId, targetUserId) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError_default(status13.NOT_FOUND, "Event not found");
  if (event.visibility !== EventVisibility.PRIVATE) {
    throw new AppError_default(status13.BAD_REQUEST, "Invitations only for private events");
  }
  if (event.organizerId !== user.userId && user.role !== "ADMIN") {
    throw new AppError_default(status13.FORBIDDEN, "Not authorized");
  }
  if (event.organizerId === targetUserId) {
    throw new AppError_default(status13.BAD_REQUEST, "Organizer cannot invite self");
  }
  const existingParticipation = await prisma.participation.findUnique({
    where: { userId_eventId: { userId: targetUserId, eventId } }
  });
  if (existingParticipation) {
    throw new AppError_default(status13.BAD_REQUEST, "User already joined");
  }
  const existingInvitation = await prisma.invitation.findFirst({
    where: { userId: targetUserId, eventId }
  });
  if (existingInvitation) {
    throw new AppError_default(status13.BAD_REQUEST, "User has already been invited");
  }
  return prisma.invitation.create({
    data: {
      eventId,
      userId: targetUserId
    }
  });
};
var getEventInvitations = async (user, eventId) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError_default(status13.NOT_FOUND, "Event not found");
  if (event.organizerId !== user.userId && user.role !== "ADMIN") {
    throw new AppError_default(status13.FORBIDDEN, "Not authorized");
  }
  return prisma.invitation.findMany({
    where: { eventId },
    include: { user: true }
  });
};
var getMyInvitations = async (user, query) => {
  if (!user?.userId) {
    throw new AppError_default(status13.UNAUTHORIZED, "Unauthorized");
  }
  const queryBuilder = new QueryBuilder(
    prisma.invitation,
    query
  );
  const result = await queryBuilder.where({
    userId: user.userId
  }).include({
    event: {
      select: {
        id: true,
        title: true,
        dateTime: true,
        type: true,
        fee: true,
        images: true
      }
    }
  }).sort().paginate().execute();
  return result;
};
var cancelInvitation = async (user, invitationId) => {
  if (!user?.userId) {
    throw new AppError_default(status13.UNAUTHORIZED, "Unauthorized");
  }
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId }
  });
  if (!invitation) {
    throw new AppError_default(status13.NOT_FOUND, "Invitation not found");
  }
  if (invitation.userId !== user.userId) {
    throw new AppError_default(status13.FORBIDDEN, "You are not allowed to cancel this invitation");
  }
  return prisma.invitation.delete({
    where: { id: invitationId }
  });
};
var InvitationService = {
  sendInvitation,
  getEventInvitations,
  getMyInvitations,
  cancelInvitation
};

// src/app/module/invitation/invitation.controller.ts
var sendInvitation2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError_default(status14.UNAUTHORIZED, "Unauthorized");
  const { eventId, userId } = req.body;
  const result = await InvitationService.sendInvitation(
    user,
    eventId,
    userId
  );
  sendResponse(res, {
    httpStatusCode: status14.CREATED,
    success: true,
    message: "Invitation sent",
    data: result
  });
});
var getEventInvitations2 = catchAsync(async (req, res) => {
  const user = req.user;
  const { eventId } = req.params;
  const result = await InvitationService.getEventInvitations(
    user,
    eventId
  );
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "Event invitations fetched",
    data: result
  });
});
var getMyInvitations2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await InvitationService.getMyInvitations(user, query);
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "My invitations fetched",
    data: result
  });
});
var cancelInvitation2 = catchAsync(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const result = await InvitationService.cancelInvitation(
    user,
    id
  );
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "Invitation canceled",
    data: result
  });
});
var InvitationController = {
  sendInvitation: sendInvitation2,
  getEventInvitations: getEventInvitations2,
  getMyInvitations: getMyInvitations2,
  cancelInvitation: cancelInvitation2
};

// src/app/module/invitation/invitation.route.ts
var router4 = Router4();
router4.post(
  "/send",
  checkAuth(Role.USER, Role.ADMIN),
  InvitationController.sendInvitation
);
router4.get(
  "/event/:eventId",
  checkAuth(Role.USER, Role.ADMIN),
  InvitationController.getEventInvitations
);
router4.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN),
  InvitationController.cancelInvitation
);
router4.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN),
  InvitationController.getMyInvitations
);
var InvitationRoutes = router4;

// src/app/module/review/review.route.ts
import { Router as Router5 } from "express";

// src/app/module/review/review.controller.ts
import status16 from "http-status";

// src/app/module/review/review.service.ts
import status15 from "http-status";
var createReview = async (user, payload) => {
  const event = await prisma.event.findUnique({
    where: { id: payload.eventId }
  });
  if (!event) throw new AppError_default(status15.NOT_FOUND, "Event not found");
  if (event.organizerId === user.userId) {
    throw new AppError_default(status15.BAD_REQUEST, "Organizer cannot review own event");
  }
  const participation = await prisma.participation.findUnique({
    where: {
      userId_eventId: {
        userId: user.userId,
        eventId: payload.eventId
      }
    }
  });
  if (!participation || participation.status !== ParticipationStatus.APPROVED) {
    throw new AppError_default(status15.FORBIDDEN, "You did not attend this event");
  }
  const existing = await prisma.review.findUnique({
    where: {
      userId_eventId: {
        userId: user.userId,
        eventId: payload.eventId
      }
    }
  });
  if (existing) {
    throw new AppError_default(status15.BAD_REQUEST, "Already reviewed");
  }
  return prisma.review.create({
    data: {
      userId: user.userId,
      eventId: payload.eventId,
      rating: payload.rating,
      comment: payload.comment
    }
  });
};
var updateReview = async (user, reviewId, payload) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });
  if (!review) throw new AppError_default(status15.NOT_FOUND, "Review not found");
  if (review.userId !== user.userId) {
    throw new AppError_default(status15.FORBIDDEN, "Not authorized");
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: payload
  });
};
var deleteReview = async (user, reviewId) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      event: true
      // needed to check organizer
    }
  });
  if (!review) {
    throw new AppError_default(status15.NOT_FOUND, "Review not found");
  }
  const isOwner = review.userId === user.userId;
  const isOrganizer = review.event.organizerId === user.userId;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isOrganizer && !isAdmin) {
    throw new AppError_default(status15.FORBIDDEN, "Not authorized");
  }
  return prisma.review.delete({
    where: { id: reviewId }
  });
};
var getEventReviews = async (eventId) => {
  return prisma.review.findMany({
    where: { eventId },
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" }
  });
};
var getMyReviews = async (user) => {
  return prisma.review.findMany({
    where: { userId: user.userId },
    include: {
      event: true,
      user: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};
var getOrganizerEventReviewsByEventId = async (user, eventId) => {
  try {
    if (!user?.userId) {
      throw new AppError_default(status15.UNAUTHORIZED, "Unauthorized access");
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    if (!event) {
      throw new AppError_default(status15.NOT_FOUND, "Event not found");
    }
    if (event.organizerId !== user.userId) {
      throw new AppError_default(status15.FORBIDDEN, "You are not the organizer of this event");
    }
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    return reviews;
  } catch (error) {
    if (error instanceof AppError_default) throw error;
    throw new AppError_default(
      status15.INTERNAL_SERVER_ERROR,
      "Failed to fetch event reviews"
    );
  }
};
var ReviewService = {
  createReview,
  updateReview,
  deleteReview,
  getEventReviews,
  getMyReviews,
  getOrganizerEventReviewsByEventId
};

// src/app/module/review/review.controller.ts
var createReview2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ReviewService.createReview(user, req.body);
  sendResponse(res, {
    httpStatusCode: status16.CREATED,
    success: true,
    message: "Review created",
    data: result
  });
});
var updateReview2 = catchAsync(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const result = await ReviewService.updateReview(user, id, req.body);
  sendResponse(res, {
    httpStatusCode: status16.OK,
    success: true,
    message: "Review updated",
    data: result
  });
});
var deleteReview2 = catchAsync(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const result = await ReviewService.deleteReview(user, id);
  sendResponse(res, {
    httpStatusCode: status16.OK,
    success: true,
    message: "Review deleted",
    data: result
  });
});
var getEventReviews2 = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await ReviewService.getEventReviews(eventId);
  sendResponse(res, {
    httpStatusCode: status16.OK,
    success: true,
    message: "Event reviews fetched",
    data: result
  });
});
var getMyReviews2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ReviewService.getMyReviews(user);
  sendResponse(res, {
    httpStatusCode: status16.OK,
    success: true,
    message: "My reviews fetched",
    data: result
  });
});
var getOrganizerEventReviewsByEventId2 = catchAsync(
  async (req, res) => {
    const user = req.user;
    const { eventId } = req.params;
    const result = await ReviewService.getOrganizerEventReviewsByEventId(
      user,
      eventId
    );
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Event reviews fetched",
      data: result
    });
  }
);
var ReviewController = {
  createReview: createReview2,
  updateReview: updateReview2,
  deleteReview: deleteReview2,
  getEventReviews: getEventReviews2,
  getMyReviews: getMyReviews2,
  getOrganizerEventReviewsByEventId: getOrganizerEventReviewsByEventId2
};

// src/app/module/review/review.route.ts
var router5 = Router5();
router5.post(
  "/",
  checkAuth(Role.USER, Role.ADMIN),
  ReviewController.createReview
);
router5.patch(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN),
  ReviewController.updateReview
);
router5.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN),
  ReviewController.deleteReview
);
router5.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN),
  ReviewController.getMyReviews
);
router5.get(
  "/event/:eventId",
  ReviewController.getEventReviews
);
router5.get(
  "/organizer/events/:eventId",
  checkAuth(Role.USER, Role.ADMIN),
  ReviewController.getOrganizerEventReviewsByEventId
);
var ReviewRoutes = router5;

// src/app/module/payment/payment.route.ts
import { Router as Router6 } from "express";

// src/app/module/payment/payment.controller.ts
import status18 from "http-status";

// src/app/module/payment/payment.service.ts
import status17 from "http-status";
import { v4 as uuidv4 } from "uuid";

// src/app/config/stripe.config.ts
import Stripe from "stripe";
var stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY);

// src/app/module/payment/payment.service.ts
var createStripeSession = async (paymentId, amount) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: { name: "Event Ticket" },
          unit_amount: amount * 100
        },
        quantity: 1
      }
    ],
    metadata: { paymentId },
    // expire after 30 min
    expires_at: Math.floor(Date.now() / 1e3) + 30 * 60,
    success_url: `${process.env.FRONTEND_URL}/dashboard`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard`
  });
  return session;
};
var initiatePayment = async (user, payload) => {
  if (!payload.eventId && !payload.invitationId) {
    throw new AppError_default(status17.BAD_REQUEST, "Invalid payment target");
  }
  let amount = 0;
  let participationId;
  if (payload.eventId) {
    const existingParticipation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.userId,
          eventId: payload.eventId
        }
      }
    });
    if (existingParticipation?.status === ParticipationStatus.APPROVED) {
      throw new AppError_default(
        status17.BAD_REQUEST,
        "You already joined this event"
      );
    }
  }
  if (payload.invitationId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: payload.invitationId }
    });
    if (invitation?.status === InvitationStatus.ACCEPTED) {
      throw new AppError_default(
        status17.BAD_REQUEST,
        "Invitation already accepted"
      );
    }
  }
  const successPayment = await prisma.payment.findFirst({
    where: {
      userId: user.userId,
      status: PaymentStatus.SUCCESS,
      ...payload.eventId && {
        participation: {
          eventId: payload.eventId
        }
      },
      ...payload.invitationId && {
        invitationId: payload.invitationId
      }
    }
  });
  if (successPayment) {
    throw new AppError_default(status17.BAD_REQUEST, "Payment already completed");
  }
  const existingPendingPayment = await prisma.payment.findFirst({
    where: {
      userId: user.userId,
      status: PaymentStatus.PENDING,
      ...payload.eventId && {
        participation: {
          eventId: payload.eventId
        }
      },
      ...payload.invitationId && {
        invitationId: payload.invitationId
      }
    },
    include: {
      participation: true
    }
  });
  if (existingPendingPayment) {
    const session2 = await createStripeSession(
      existingPendingPayment.id,
      existingPendingPayment.amount
    );
    return {
      paymentId: existingPendingPayment.id,
      paymentUrl: session2.url
    };
  }
  if (payload.eventId) {
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: payload.eventId }
    });
    if (event.organizerId === user.userId) {
      throw new AppError_default(
        status17.BAD_REQUEST,
        "Organizer cannot join own event"
      );
    }
    let participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: user.userId,
          eventId: event.id
        }
      }
    });
    if (event.fee === 0) {
      if (!participation) {
        participation = await prisma.participation.create({
          data: {
            userId: user.userId,
            eventId: event.id,
            status: ParticipationStatus.APPROVED
          }
        });
        await prisma.ticket.create({
          data: {
            userId: user.userId,
            eventId: event.id,
            participationId: participation.id,
            qrCode: uuidv4()
          }
        });
      }
      return { message: "Joined successfully (free event)" };
    }
    if (!participation) {
      participation = await prisma.participation.create({
        data: {
          userId: user.userId,
          eventId: event.id,
          status: ParticipationStatus.PENDING
        }
      });
    }
    participationId = participation.id;
    amount = event.fee;
  }
  if (payload.invitationId) {
    const invitation = await prisma.invitation.findUniqueOrThrow({
      where: { id: payload.invitationId },
      include: { event: true }
    });
    if (invitation.userId !== user.userId) {
      throw new AppError_default(status17.FORBIDDEN, "Not your invitation");
    }
    if (invitation.event.fee === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED }
        });
        let participation2 = await tx.participation.findFirst({
          where: {
            userId: user.userId,
            eventId: invitation.eventId
          }
        });
        if (!participation2) {
          participation2 = await tx.participation.create({
            data: {
              userId: user.userId,
              eventId: invitation.eventId,
              status: ParticipationStatus.APPROVED
            }
          });
          await tx.ticket.create({
            data: {
              userId: user.userId,
              eventId: invitation.eventId,
              participationId: participation2.id,
              qrCode: uuidv4()
            }
          });
        }
      });
      return { message: "Joined successfully (free invitation)" };
    }
    let participation = await prisma.participation.findFirst({
      where: {
        userId: user.userId,
        eventId: invitation.eventId
      }
    });
    if (!participation) {
      participation = await prisma.participation.create({
        data: {
          userId: user.userId,
          eventId: invitation.eventId,
          status: ParticipationStatus.PENDING
        }
      });
    }
    participationId = participation.id;
    amount = invitation.event.fee;
  }
  const payment = await prisma.payment.create({
    data: {
      amount,
      transactionId: uuidv4(),
      userId: user.userId,
      participationId,
      invitationId: payload.invitationId,
      status: PaymentStatus.PENDING
    }
  });
  const session = await createStripeSession(payment.id, amount);
  return {
    paymentId: payment.id,
    paymentUrl: session.url
  };
};
var handleStripeWebhookEvent = async (event) => {
  const existing = await prisma.payment.findFirst({
    where: { stripeEventId: event.id }
  });
  if (existing) return { message: "Already processed" };
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      if (!paymentId) return { message: "Missing paymentId" };
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          participation: { include: { event: true } },
          invitation: { include: { event: true } }
        }
      });
      if (!payment) return { message: "Payment not found" };
      if (payment.status === PaymentStatus.SUCCESS) {
        return { message: "Already paid, skipping duplicate" };
      }
      const eventData = payment.participation?.event || payment.invitation?.event;
      if (!eventData) return { message: "Event not found" };
      if (eventData.dateTime < /* @__PURE__ */ new Date()) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.CANCELED,
            stripeEventId: event.id
          }
        });
        return { message: "Event expired, payment canceled" };
      }
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.SUCCESS,
            stripeEventId: event.id,
            paymentGatewayData: session
          }
        });
        if (payment.participationId) {
          await tx.participation.update({
            where: { id: payment.participationId },
            data: { status: ParticipationStatus.APPROVED }
          });
          const existingTicket = await tx.ticket.findFirst({
            where: {
              participationId: payment.participationId
            }
          });
          if (!existingTicket) {
            await tx.ticket.create({
              data: {
                userId: payment.userId,
                eventId: payment.participation.eventId,
                participationId: payment.participationId,
                qrCode: uuidv4()
              }
            });
          }
        }
        if (payment.invitationId && payment.invitation) {
          let participation = await tx.participation.findFirst({
            where: {
              userId: payment.userId,
              eventId: payment.invitation.eventId
            }
          });
          if (!participation) {
            participation = await tx.participation.create({
              data: {
                userId: payment.userId,
                eventId: payment.invitation.eventId,
                status: ParticipationStatus.APPROVED
              }
            });
          }
          const existingTicket = await tx.ticket.findFirst({
            where: {
              participationId: participation.id
            }
          });
          if (!existingTicket) {
            await tx.ticket.create({
              data: {
                userId: payment.userId,
                eventId: payment.invitation.eventId,
                participationId: participation.id,
                qrCode: uuidv4()
              }
            });
          }
          await tx.invitation.update({
            where: { id: payment.invitationId },
            data: { status: InvitationStatus.ACCEPTED }
          });
        }
      });
      break;
    }
    case "payment_intent.payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      if (!paymentId) return;
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          stripeEventId: event.id
        }
      });
      break;
    }
    default:
      break;
  }
  return { message: "Webhook processed" };
};
var getMyPayments = async (user, query) => {
  if (!user?.userId) {
    throw new AppError_default(status17.UNAUTHORIZED, "Unauthorized");
  }
  const queryBuilder = new QueryBuilder(
    prisma.payment,
    query
  );
  const result = await queryBuilder.where({
    userId: user.userId
  }).include({
    participation: {
      include: {
        event: true
      }
    },
    invitation: {
      include: {
        event: true
      }
    }
  }).sort().paginate().execute();
  return result;
};
var getOrganizerPayments = async (user, query) => {
  if (!user?.userId) {
    throw new AppError_default(status17.UNAUTHORIZED, "Unauthorized");
  }
  const queryBuilder = new QueryBuilder(
    prisma.payment,
    query
  );
  const result = await queryBuilder.where({
    OR: [
      {
        participation: {
          event: {
            organizerId: user.userId
          }
        }
      },
      {
        invitation: {
          event: {
            organizerId: user.userId
          }
        }
      }
    ]
  }).include({
    user: true,
    participation: {
      include: {
        event: true
      }
    },
    invitation: {
      include: {
        event: true
      }
    }
  }).sort().paginate().execute();
  return result;
};
var getAllPayments = async (user, query) => {
  if (user.role !== "ADMIN") {
    throw new AppError_default(status17.UNAUTHORIZED, "Unauthorized access");
  }
  const queryBuilder = new QueryBuilder(
    prisma.payment,
    query
  );
  const result = await queryBuilder.include({
    user: true,
    participation: {
      include: {
        event: true
      }
    },
    invitation: {
      include: {
        event: true
      }
    }
  }).sort().paginate().execute();
  return result;
};
var PaymentService = {
  initiatePayment,
  handleStripeWebhookEvent,
  getMyPayments,
  getOrganizerPayments,
  getAllPayments
};

// src/app/module/payment/payment.controller.ts
var initiatePayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await PaymentService.initiatePayment(user, req.body);
  sendResponse(res, {
    success: true,
    httpStatusCode: status18.OK,
    message: "Payment session created",
    data: result
  });
});
var handleStripeWebhookEvent2 = catchAsync(
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      req.body,
      // RAW BODY
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET
    );
    const result = await PaymentService.handleStripeWebhookEvent(event);
    sendResponse(res, {
      success: true,
      httpStatusCode: status18.OK,
      message: "Webhook processed",
      data: result
    });
  }
);
var getMyPayments2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await PaymentService.getMyPayments(user, query);
  sendResponse(res, {
    httpStatusCode: status18.OK,
    success: true,
    message: "My payments fetched",
    data: result
  });
});
var getOrganizerPayments2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await PaymentService.getOrganizerPayments(user, query);
  sendResponse(res, {
    httpStatusCode: status18.OK,
    success: true,
    message: "Organizer payments fetched",
    data: result
  });
});
var getAllPayments2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await PaymentService.getAllPayments(user, query);
  sendResponse(res, {
    httpStatusCode: status18.OK,
    success: true,
    message: "All payments fetched",
    data: result
  });
});
var PaymentController = {
  initiatePayment: initiatePayment2,
  handleStripeWebhookEvent: handleStripeWebhookEvent2,
  getMyPayments: getMyPayments2,
  getOrganizerPayments: getOrganizerPayments2,
  getAllPayments: getAllPayments2
};

// src/app/module/payment/payment.route.ts
var router6 = Router6();
router6.post(
  "/pay",
  checkAuth(Role.USER, Role.ADMIN),
  PaymentController.initiatePayment
);
router6.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN),
  PaymentController.getMyPayments
);
router6.get(
  "/organizer",
  checkAuth(Role.USER, Role.ADMIN),
  PaymentController.getOrganizerPayments
);
router6.get(
  "/admin",
  checkAuth(Role.ADMIN),
  PaymentController.getAllPayments
);
var PaymentRoutes = router6;

// src/app/module/file/file.route.ts
import { Router as Router7 } from "express";

// src/app/module/file/file.controller.ts
import status21 from "http-status";

// src/app/module/file/file.service.ts
import status20 from "http-status";

// src/app/config/cloudinary.config.ts
import { v2 as cloudinary } from "cloudinary";
import status19 from "http-status";
cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
});
var deleteFileFromCloudinary = async (url) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
    const match = url.match(regex);
    if (match?.[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image"
      });
      console.log(`Image ${publicId} deleted from cloudinary`);
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw new AppError_default(
      status19.INTERNAL_SERVER_ERROR,
      "Failed to delete image from Cloudinary"
    );
  }
};
var cloudinaryUpload = cloudinary;

// src/app/module/file/file.service.ts
var uploadImage = async (files) => {
  if (!files || files.length === 0) {
    throw new AppError_default(status20.BAD_REQUEST, "No file uploaded");
  }
  if (files.length === 1) {
    return {
      url: files[0].path
    };
  }
  return files.map((file) => ({
    url: file.path
  }));
};
var deleteImage = async (urls) => {
  if (!urls) {
    throw new AppError_default(status20.BAD_REQUEST, "Image URL is required");
  }
  if (Array.isArray(urls)) {
    await Promise.all(
      urls.map((url) => deleteFileFromCloudinary(url))
    );
    return null;
  }
  await deleteFileFromCloudinary(urls);
  return null;
};
var FileService = {
  uploadImage,
  deleteImage
};

// src/app/module/file/file.controller.ts
var uploadImage2 = catchAsync(async (req, res) => {
  const files = req.files;
  if (files?.length > 10) {
    throw new AppError_default(status21.BAD_REQUEST, "Maximum 10 images are allowed");
  }
  const result = await FileService.uploadImage(files);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "Image uploaded successfully",
    data: result
  });
});
var deleteImage2 = catchAsync(async (req, res) => {
  const { url } = req.body;
  const result = await FileService.deleteImage(url);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "Image deleted successfully",
    data: result
  });
});
var FileController = {
  uploadImage: uploadImage2,
  deleteImage: deleteImage2
};

// src/app/config/multer.config.ts
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
var storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => {
    const originalName = file.originalname;
    const extension = originalName.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new AppError_default(400, "Only image files are allowed");
    }
    const fileNameWithoutExtension = originalName.split(".").slice(0, -1).join(".").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const uniqueName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileNameWithoutExtension;
    return {
      folder: "planora/images",
      public_id: uniqueName,
      resource_type: "image"
      // force image only
    };
  }
});
var multerUpload = multer({ storage });

// src/app/module/file/file.route.ts
var router7 = Router7();
router7.post(
  "/upload-image",
  multerUpload.array("file", 10),
  // supports 1 or many
  FileController.uploadImage
);
router7.delete(
  "/delete-image",
  FileController.deleteImage
);
var FileRoutes = router7;

// src/app/module/admin/admin.route.ts
import { Router as Router8 } from "express";

// src/app/module/admin/admin.controller.ts
import status23 from "http-status";

// src/app/module/admin/admin.service.ts
import status22 from "http-status";
var getAllUsers = async (user, query) => {
  if (user.role !== "ADMIN") {
    throw new AppError_default(status22.UNAUTHORIZED, "Unauthorized access");
  }
  const queryBuilder = new QueryBuilder(
    prisma.user,
    query
  );
  const result = await queryBuilder.where({
    isDeleted: false,
    role: "USER"
  }).sort().paginate().execute();
  return result;
};
var getAllAdmins = async (user, query) => {
  if (user.role !== "ADMIN") {
    throw new AppError_default(status22.UNAUTHORIZED, "Unauthorized access");
  }
  const queryBuilder = new QueryBuilder(
    prisma.user,
    query
  );
  const result = await queryBuilder.where({
    isDeleted: false,
    role: "ADMIN"
  }).sort().paginate().execute();
  return result;
};
var getSingleUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  if (!user || user.isDeleted) {
    throw new AppError_default(status22.NOT_FOUND, "User not found");
  }
  return user;
};
var updateUserStatus = async (id, statusValue, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError_default(status22.UNAUTHORIZED, "You are not authorized");
  }
  if (user.userId === id) {
    throw new AppError_default(status22.BAD_REQUEST, "You cannot suspended yourself");
  }
  return prisma.user.update({
    where: { id },
    data: { status: statusValue }
  });
};
var deleteUser = async (id, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError_default(status22.UNAUTHORIZED, "You are not authorized");
  }
  if (user.userId === id) {
    throw new AppError_default(status22.BAD_REQUEST, "You cannot delete yourself");
  }
  return prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: /* @__PURE__ */ new Date()
    }
  });
};
var updateUserRole = async (id, role, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError_default(status22.UNAUTHORIZED, "You are not authorized");
  }
  if (user.userId === id) {
    throw new AppError_default(status22.BAD_REQUEST, "You cannot change your own role");
  }
  const targetUser = await prisma.user.findUnique({
    where: { id }
  });
  if (!targetUser || targetUser.isDeleted) {
    throw new AppError_default(status22.NOT_FOUND, "User not found");
  }
  return prisma.user.update({
    where: { id },
    data: { role }
  });
};
var getAdminStats = async () => {
  const totalUsers = await prisma.user.count();
  const totalAdmins = await prisma.user.count({
    where: { role: "ADMIN" }
  });
  const totalNormalUsers = await prisma.user.count({
    where: { role: "USER" }
  });
  const activeUsers = await prisma.user.count({
    where: {
      status: "ACTIVE",
      role: "USER"
    }
  });
  const suspendedUsers = await prisma.user.count({
    where: {
      status: "SUSPENDED",
      role: "USER"
    }
  });
  const totalEvents = await prisma.event.count();
  const upcomingEvents = await prisma.event.count({
    where: {
      dateTime: { gt: /* @__PURE__ */ new Date() }
    }
  });
  const totalParticipants = await prisma.participation.count();
  const approvedParticipants = await prisma.participation.count({
    where: { status: ParticipationStatus.APPROVED }
  });
  const totalInvites = await prisma.invitation.count();
  const acceptedInvites = await prisma.invitation.count({
    where: { status: InvitationStatus.ACCEPTED }
  });
  const totalPayments = await prisma.payment.count();
  const successfulPayments = await prisma.payment.count({
    where: { status: PaymentStatus.SUCCESS }
  });
  const totalRevenue = await prisma.payment.aggregate({
    where: { status: PaymentStatus.SUCCESS },
    _sum: { amount: true }
  });
  const totalReviews = await prisma.review.count();
  return {
    users: {
      totalUsers,
      activeUsers,
      totalAdmins,
      totalNormalUsers,
      suspendedUsers
    },
    events: {
      totalEvents,
      upcomingEvents
    },
    participation: {
      totalParticipants,
      approvedParticipants
    },
    invitations: {
      totalInvites,
      acceptedInvites
    },
    payments: {
      totalPayments,
      successfulPayments,
      totalRevenue: totalRevenue._sum.amount || 0
    },
    reviews: {
      totalReviews
    }
  };
};
var AdminService = {
  getAllUsers,
  getAllAdmins,
  getSingleUser,
  updateUserStatus,
  deleteUser,
  updateUserRole,
  getAdminStats
};

// src/app/module/admin/admin.controller.ts
var getAllUsers2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError_default(status23.UNAUTHORIZED, "Unauthorized");
  const query = req.query;
  const result = await AdminService.getAllUsers(user, query);
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Users fetched",
    data: result
  });
});
var getAllAdmins2 = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError_default(status23.UNAUTHORIZED, "Unauthorized");
  const query = req.query;
  const result = await AdminService.getAllAdmins(user, query);
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Admins fetched",
    data: result
  });
});
var updateUserStatus2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status: statusValue } = req.body;
  const user = req.user;
  if (!user) throw new AppError_default(status23.UNAUTHORIZED, "Unauthorized");
  const result = await AdminService.updateUserStatus(id, statusValue, user);
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "User status updated",
    data: result
  });
});
var deleteUser2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) throw new AppError_default(status23.UNAUTHORIZED, "Unauthorized");
  const result = await AdminService.deleteUser(id, user);
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "User deleted",
    data: result
  });
});
var updateUserRole2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = req.user;
  if (!user) throw new AppError_default(status23.UNAUTHORIZED, "Unauthorized");
  const result = await AdminService.updateUserRole(
    id,
    role,
    user
  );
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "User role updated",
    data: result
  });
});
var getAdminStats2 = catchAsync(async (req, res) => {
  const result = await AdminService.getAdminStats();
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Admin stats fetched",
    data: result
  });
});
var AdminController = {
  getAllUsers: getAllUsers2,
  getAllAdmins: getAllAdmins2,
  updateUserStatus: updateUserStatus2,
  deleteUser: deleteUser2,
  updateUserRole: updateUserRole2,
  getAdminStats: getAdminStats2
};

// src/app/module/admin/admin.route.ts
var router8 = Router8();
router8.get("/users", checkAuth(Role.ADMIN), AdminController.getAllUsers);
router8.get("/admins", checkAuth(Role.ADMIN), AdminController.getAllAdmins);
router8.patch("/users/:id/status", checkAuth(Role.ADMIN), AdminController.updateUserStatus);
router8.delete("/users/:id", checkAuth(Role.ADMIN), AdminController.deleteUser);
router8.patch(
  "/users/:id/role",
  checkAuth(Role.ADMIN),
  AdminController.updateUserRole
);
router8.get("/stats", checkAuth(Role.ADMIN), AdminController.getAdminStats);
var AdminRoutes = router8;

// src/app/module/user/user.route.ts
import { Router as Router9 } from "express";

// src/app/module/user/user.controller.ts
import status24 from "http-status";

// src/app/module/user/user.service.ts
var getUserStats = async (user) => {
  const userId = user.userId;
  const totalJoined = await prisma.participation.count({
    where: { userId }
  });
  const approvedJoined = await prisma.participation.count({
    where: { userId, status: ParticipationStatus.APPROVED }
  });
  const pendingJoined = await prisma.participation.count({
    where: { userId, status: ParticipationStatus.PENDING }
  });
  const totalInvitesReceived = await prisma.invitation.count({
    where: { userId }
  });
  const acceptedInvites = await prisma.invitation.count({
    where: { userId, status: InvitationStatus.ACCEPTED }
  });
  const pendingInvites = await prisma.invitation.count({
    where: { userId, status: InvitationStatus.PENDING }
  });
  const totalPayments = await prisma.payment.count({
    where: { userId }
  });
  const successfulPayments = await prisma.payment.count({
    where: { userId, status: PaymentStatus.SUCCESS }
  });
  const totalSpent = await prisma.payment.aggregate({
    where: { userId, status: PaymentStatus.SUCCESS },
    _sum: { amount: true }
  });
  const totalReviews = await prisma.review.count({
    where: { userId }
  });
  const totalEventsCreated = await prisma.event.count({
    where: { organizerId: userId }
  });
  const totalParticipantsInMyEvents = await prisma.participation.count({
    where: {
      event: { organizerId: userId },
      status: ParticipationStatus.APPROVED
    }
  });
  const totalInvitesSent = await prisma.invitation.count({
    where: {
      event: { organizerId: userId }
    }
  });
  const acceptedInvitesOnMyEvents = await prisma.invitation.count({
    where: {
      event: { organizerId: userId },
      status: InvitationStatus.ACCEPTED
    }
  });
  const totalReviewsOnMyEvents = await prisma.review.count({
    where: {
      event: { organizerId: userId }
    }
  });
  return {
    participation: {
      totalJoined,
      approvedJoined,
      pendingJoined
    },
    invitations: {
      totalInvitesReceived,
      acceptedInvites,
      pendingInvites
    },
    payments: {
      totalPayments,
      successfulPayments,
      totalSpent: totalSpent._sum.amount || 0
    },
    reviews: {
      totalReviews
    },
    organizer: {
      totalEventsCreated,
      totalParticipantsInMyEvents,
      totalInvitesSent,
      acceptedInvitesOnMyEvents,
      totalReviewsOnMyEvents
    }
  };
};
var UserService = {
  getUserStats
};

// src/app/module/user/user.controller.ts
var getMyStats = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await UserService.getUserStats(user);
  sendResponse(res, {
    httpStatusCode: status24.OK,
    success: true,
    message: "User stats fetched",
    data: result
  });
});
var UserController = {
  getMyStats
};

// src/app/module/user/user.route.ts
var router9 = Router9();
router9.get("/stats", checkAuth(Role.USER, Role.ADMIN), UserController.getMyStats);
var UserRoutes = router9;

// src/app/module/profile/profile.route.ts
import { Router as Router10 } from "express";

// src/app/module/profile/profile.controller.ts
import status26 from "http-status";

// src/app/module/profile/profile.service.ts
import status25 from "http-status";
var getMyProfile = async (user) => {
  const foundUser = await prisma.user.findUnique({
    where: {
      id: user.userId
    }
  });
  if (!foundUser) {
    throw new AppError_default(status25.NOT_FOUND, "User not found");
  }
  return foundUser;
};
var updateProfile = async (user, payload) => {
  return prisma.user.update({
    where: { id: user.userId },
    data: payload
  });
};
var ProfileService = {
  getMyProfile,
  updateProfile
};

// src/app/module/profile/profile.controller.ts
var getMyProfile2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProfileService.getMyProfile(user);
  sendResponse(res, {
    httpStatusCode: status26.OK,
    success: true,
    message: "Profile fetched",
    data: result
  });
});
var updateProfile2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProfileService.updateProfile(user, req.body);
  sendResponse(res, {
    httpStatusCode: status26.OK,
    success: true,
    message: "Profile updated",
    data: result
  });
});
var ProfileController = {
  getMyProfile: getMyProfile2,
  updateProfile: updateProfile2
};

// src/app/module/profile/profile.route.ts
var router10 = Router10();
router10.get("/me", checkAuth(Role.USER, Role.ADMIN), ProfileController.getMyProfile);
router10.patch("/me", checkAuth(Role.USER, Role.ADMIN), ProfileController.updateProfile);
var ProfileRoutes = router10;

// src/app/module/category/category.route.ts
import { Router as Router11 } from "express";

// src/app/module/category/category.controller.ts
import status28 from "http-status";

// src/app/module/category/category.service.ts
import status27 from "http-status";
var createCategory = async (payload) => {
  return prisma.category.create({
    data: payload
  });
};
var getAllCategories = async () => {
  return prisma.category.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" }
  });
};
var getSingleCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id }
  });
  if (!category || category.isDeleted) {
    throw new AppError_default(status27.NOT_FOUND, "Category not found");
  }
  return category;
};
var updateCategory = async (id, payload) => {
  await getSingleCategory(id);
  return prisma.category.update({
    where: { id },
    data: payload
  });
};
var deleteCategory = async (id) => {
  await getSingleCategory(id);
  return prisma.category.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: /* @__PURE__ */ new Date()
    }
  });
};
var CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory
};

// src/app/module/category/category.controller.ts
var createCategory2 = catchAsync(async (req, res) => {
  const result = await CategoryService.createCategory(req.body);
  sendResponse(res, {
    httpStatusCode: status28.CREATED,
    success: true,
    message: "Category created",
    data: result
  });
});
var getAllCategories2 = catchAsync(async (req, res) => {
  const result = await CategoryService.getAllCategories();
  sendResponse(res, {
    httpStatusCode: status28.OK,
    success: true,
    message: "Categories fetched",
    data: result
  });
});
var getSingleCategory2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.getSingleCategory(id);
  sendResponse(res, {
    httpStatusCode: status28.OK,
    success: true,
    message: "Category fetched",
    data: result
  });
});
var updateCategory2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.updateCategory(id, req.body);
  sendResponse(res, {
    httpStatusCode: status28.OK,
    success: true,
    message: "Category updated",
    data: result
  });
});
var deleteCategory2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id);
  sendResponse(res, {
    httpStatusCode: status28.OK,
    success: true,
    message: "Category deleted",
    data: result
  });
});
var CategoryController = {
  createCategory: createCategory2,
  getAllCategories: getAllCategories2,
  getSingleCategory: getSingleCategory2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2
};

// src/app/module/category/category.route.ts
var router11 = Router11();
router11.get("/", CategoryController.getAllCategories);
router11.get("/:id", CategoryController.getSingleCategory);
router11.post("/", checkAuth(Role.ADMIN), CategoryController.createCategory);
router11.patch("/:id", checkAuth(Role.ADMIN), CategoryController.updateCategory);
router11.delete("/:id", checkAuth(Role.ADMIN), CategoryController.deleteCategory);
var CategoryRoutes = router11;

// src/app/module/banner/banner.route.ts
import { Router as Router12 } from "express";

// src/app/module/banner/banner.controller.ts
import status30 from "http-status";

// src/app/module/banner/banner.service.ts
import status29 from "http-status";
var createBanner = async (payload) => {
  return prisma.banner.create({
    data: payload
  });
};
var getAllBanners = async () => {
  return prisma.banner.findMany({
    where: { isDeleted: false },
    orderBy: { positionOrder: "asc" }
  });
};
var getActiveBanners = async () => {
  return prisma.banner.findMany({
    where: {
      isDeleted: false,
      isActive: true
    },
    orderBy: { positionOrder: "asc" }
  });
};
var getBannerById = async (id) => {
  const banner = await prisma.banner.findUnique({
    where: { id }
  });
  if (!banner || banner.isDeleted) {
    throw new AppError_default(status29.NOT_FOUND, "Banner not found");
  }
  return banner;
};
var updateBanner = async (id, payload) => {
  await getBannerById(id);
  return prisma.banner.update({
    where: { id },
    data: payload
  });
};
var deleteBanner = async (id) => {
  await getBannerById(id);
  return prisma.banner.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: /* @__PURE__ */ new Date()
    }
  });
};
var updateBannerStatus = async (id, isActive) => {
  const banner = await prisma.banner.findUnique({
    where: { id }
  });
  if (!banner || banner.isDeleted) {
    throw new AppError_default(status29.NOT_FOUND, "Banner not found");
  }
  return prisma.banner.update({
    where: { id },
    data: { isActive }
  });
};
var BannerService = {
  createBanner,
  getAllBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  updateBannerStatus
};

// src/app/module/banner/banner.controller.ts
var createBanner2 = catchAsync(async (req, res) => {
  const result = await BannerService.createBanner(req.body);
  sendResponse(res, {
    httpStatusCode: status30.CREATED,
    success: true,
    message: "Banner created",
    data: result
  });
});
var getAllBanners2 = catchAsync(async (req, res) => {
  const result = await BannerService.getAllBanners();
  sendResponse(res, {
    httpStatusCode: status30.OK,
    success: true,
    message: "Banners fetched",
    data: result
  });
});
var getActiveBanners2 = catchAsync(async (req, res) => {
  const result = await BannerService.getActiveBanners();
  sendResponse(res, {
    httpStatusCode: status30.OK,
    success: true,
    message: "Active banners fetched",
    data: result
  });
});
var updateBanner2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BannerService.updateBanner(id, req.body);
  sendResponse(res, {
    httpStatusCode: status30.OK,
    success: true,
    message: "Banner updated",
    data: result
  });
});
var getBannerById2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BannerService.getBannerById(id);
  sendResponse(res, {
    httpStatusCode: status30.OK,
    success: true,
    message: "Banner fetched",
    data: result
  });
});
var deleteBanner2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BannerService.deleteBanner(id);
  sendResponse(res, {
    httpStatusCode: status30.OK,
    success: true,
    message: "Banner deleted",
    data: result
  });
});
var updateBannerStatus2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    throw new AppError_default(status30.BAD_REQUEST, "isActive must be boolean");
  }
  const result = await BannerService.updateBannerStatus(id, isActive);
  sendResponse(res, {
    httpStatusCode: status30.OK,
    success: true,
    message: "Banner status updated",
    data: result
  });
});
var BannerController = {
  createBanner: createBanner2,
  getAllBanners: getAllBanners2,
  getBannerById: getBannerById2,
  getActiveBanners: getActiveBanners2,
  updateBanner: updateBanner2,
  deleteBanner: deleteBanner2,
  updateBannerStatus: updateBannerStatus2
};

// src/app/module/banner/banner.route.ts
var router12 = Router12();
router12.get("/", BannerController.getAllBanners);
router12.get("/active", BannerController.getActiveBanners);
router12.get("/:id", BannerController.getBannerById);
router12.post("/", checkAuth(Role.ADMIN), BannerController.createBanner);
router12.patch("/:id", checkAuth(Role.ADMIN), BannerController.updateBanner);
router12.delete("/:id", checkAuth(Role.ADMIN), BannerController.deleteBanner);
router12.patch(
  "/:id/status",
  checkAuth(Role.ADMIN),
  BannerController.updateBannerStatus
);
var BannerRoutes = router12;

// src/app/module/public/public.route.ts
import { Router as Router13 } from "express";

// src/app/module/public/public.controller.ts
import status31 from "http-status";

// src/app/module/public/public.service.ts
var getStats = async () => {
  const now = /* @__PURE__ */ new Date();
  const [
    totalActiveUsers,
    totalEventsDone,
    totalTicketsCreated
  ] = await Promise.all([
    prisma.user.count({
      where: {
        status: "ACTIVE",
        isDeleted: false
      }
    }),
    prisma.event.count({
      where: {
        dateTime: {
          lt: now
          // past events
        }
      }
    }),
    prisma.ticket.count()
  ]);
  return {
    totalActiveUsers,
    totalEventsDone,
    totalTicketsCreated
  };
};
var PublicService = {
  getStats
};

// src/app/module/public/public.controller.ts
var getStats2 = catchAsync(async (req, res) => {
  const result = await PublicService.getStats();
  sendResponse(res, {
    httpStatusCode: status31.OK,
    success: true,
    message: "User stats fetched",
    data: result
  });
});
var PublicController = {
  getStats: getStats2
};

// src/app/module/public/public.route.ts
var router13 = Router13();
router13.get("/stats", PublicController.getStats);
var PublicRoutes = router13;

// src/app/module/ticket/ticket.route.ts
import { Router as Router14 } from "express";

// src/app/module/ticket/ticket.controller.ts
import status33 from "http-status";

// src/app/module/ticket/ticket.service.ts
import status32 from "http-status";
var getUserTickets = async (userId, query) => {
  if (!userId) {
    throw new AppError_default(status32.BAD_REQUEST, "UserId is required");
  }
  const queryBuilder = new QueryBuilder(
    prisma.ticket,
    query
  );
  const result = await queryBuilder.where({
    userId
  }).include({
    event: true
  }).sort().paginate().execute();
  return result;
};
var getEventTickets = async (eventId) => {
  return prisma.ticket.findMany({
    where: { eventId },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });
};
var checkIn = async (qrCode, organizerId) => {
  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: { event: true, user: true }
  });
  if (!ticket) throw new AppError_default(status32.BAD_REQUEST, "Invalid ticket");
  if (ticket.status === "USED") {
    throw new AppError_default(status32.BAD_REQUEST, "Ticket already used");
  }
  if (ticket.event.organizerId !== organizerId) {
    throw new AppError_default(status32.FORBIDDEN, "Unauthorized");
  }
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "USED", checkedInAt: /* @__PURE__ */ new Date() }
  });
  return {
    user: {
      id: ticket.user.id,
      name: ticket.user.name,
      email: ticket.user.email
    },
    event: {
      id: ticket.event.id,
      title: ticket.event.title,
      dateTime: ticket.event.dateTime
    }
  };
};
var TicketService = {
  getUserTickets,
  getEventTickets,
  checkIn
};

// src/app/module/ticket/ticket.controller.ts
var getMyTickets = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await TicketService.getUserTickets(user.userId, query);
  sendResponse(res, {
    httpStatusCode: status33.OK,
    success: true,
    message: "My tickets fetched",
    data: result
  });
});
var getEventTickets2 = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const result = await TicketService.getEventTickets(eventId);
  sendResponse(res, {
    httpStatusCode: status33.OK,
    success: true,
    message: "Event tickets fetched",
    data: result
  });
});
var checkInTicket = catchAsync(async (req, res) => {
  const { qrCode } = req.body;
  const organizerId = req.user.userId;
  const result = await TicketService.checkIn(qrCode, organizerId);
  sendResponse(res, {
    httpStatusCode: status33.OK,
    success: true,
    message: "Ticket checked in",
    data: result
  });
});
var TicketController = {
  getMyTickets,
  getEventTickets: getEventTickets2,
  checkInTicket
};

// src/app/module/ticket/ticket.route.ts
var router14 = Router14();
router14.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN),
  TicketController.getMyTickets
);
router14.get(
  "/event/:eventId",
  checkAuth(Role.ADMIN, Role.USER),
  TicketController.getEventTickets
);
router14.post(
  "/check-in",
  checkAuth(Role.ADMIN, Role.USER),
  TicketController.checkInTicket
);
var TicketRoutes = router14;

// src/app/routes/index.ts
var router15 = Router15();
router15.use("/auth", AuthRoutes);
router15.use("/event", EventRoutes);
router15.use("/participation", ParticipationRoutes);
router15.use("/invitation", InvitationRoutes);
router15.use("/review", ReviewRoutes);
router15.use("/payment", PaymentRoutes);
router15.use("/file", FileRoutes);
router15.use("/admin", AdminRoutes);
router15.use("/user", UserRoutes);
router15.use("/profile", ProfileRoutes);
router15.use("/category", CategoryRoutes);
router15.use("/banner", BannerRoutes);
router15.use("/public", PublicRoutes);
router15.use("/ticket", TicketRoutes);
var IndexRoutes = router15;

// src/app.ts
import cors from "cors";
var app = express();
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.PROD_CLIENT_URL
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", IndexRoutes);
app.get("/", async (req, res) => {
  res.status(201).json({
    success: true,
    message: "API is working"
  });
});
app.use(globalErrorHandler);
app.use(notFound);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
