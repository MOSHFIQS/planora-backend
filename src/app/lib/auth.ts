// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";

export const auth = betterAuth({
     baseURL: envVars.BETTER_AUTH_URL,
     secret: envVars.BETTER_AUTH_SECRET,
     database: prismaAdapter(prisma, {
          provider: "postgresql",
     }),

     emailAndPassword: {
          enabled: true,
     },

     user: {
          additionalFields: {
               role: {
                    type: "string",
                    required: true,
                    defaultValue: Role.USER,
               },
               status: {
                    type: "string",
                    required: true,
                    defaultValue: UserStatus.ACTIVE,
               },
               isDeleted: {
                    type: "boolean",
                    required: true,
                    defaultValue: false,
               },
               deletedAt: {
                    type: "date",
                    required: false, // optional
               },
          },
     },

     session: {
          expiresIn: 60 * 60 * 24, // 1 day in seconds
          updateAge: 60 * 60 * 24, // 1 day in seconds
          cookieCache: {
               enabled: true,
               maxAge: 60 * 60 * 24, // 1 day
          },
     },

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
