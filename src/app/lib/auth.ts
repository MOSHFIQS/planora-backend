// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { prisma } from "./prisma";
import { sendEmail } from "../utils/email";

export const auth = betterAuth({
     baseURL: envVars.BETTER_AUTH_URL,
     secret: envVars.BETTER_AUTH_SECRET,
     database: prismaAdapter(prisma, {
          provider: "postgresql",
     }),

     emailAndPassword: {
          enabled: true,
          requireEmailVerification: true,
     },

     socialProviders: {
          google: {
               clientId: envVars.GOOGLE_CLIENT_ID,
               clientSecret: envVars.GOOGLE_CLIENT_SECRET,
               mapProfileToUser: () => {
                    return {
                         role: Role.USER,
                         status: UserStatus.ACTIVE,
                         needPasswordChange: false,
                         emailVerified: true,
                         isDeleted: false,
                         deletedAt: null,
                    }
               }
          }
     },

     emailVerification: {
          sendOnSignUp: true,
          sendOnSignIn: true,
          autoSignInAfterVerification: true,
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
               needPasswordChange: {
                    type: "boolean",
                    required: true,
                    defaultValue: false,
               },
               isDeleted: {
                    type: "boolean",
                    required: true,
                    defaultValue: false,
               },
               deletedAt: {
                    type: "date",
                    required: false,
                    defaultValue: null,
               },
          },
     },

     plugins: [
          bearer(),
          emailOTP({
               overrideDefaultEmailVerification: true,
               async sendVerificationOTP({ email, otp, type }) {
                    const user = await prisma.user.findUnique({
                         where: { email }
                    });

                    if (!user) {
                         console.error(`User with email ${email} not found. Cannot send verification OTP.`);
                         return;
                    }

                    if (user.role === Role.SUPERADMIN) {
                         console.log(`User ${email} is a super admin. Skipping OTP.`);
                         return;
                    }

                    const subjects: Record<string, string> = {
                         "email-verification": "Verify your Planora email",
                         "forget-password": "Reset your Planora password",
                    };

                    if (type === "email-verification" && user.emailVerified) return;

                    await sendEmail({
                         to: email,
                         subject: subjects[type] || "Authentication OTP",
                         templateName: "otp",
                         templateData: {
                              name: user.name,
                              otp,
                         }
                    });
               },
               expiresIn: 2 * 60, // 2 minutes
               otpLength: 6,
          })
     ],

     session: {
          expiresIn: 60 * 60 * 24, // 1 day
          updateAge: 60 * 60 * 24,
          cookieCache: {
               enabled: true,
               maxAge: 60 * 60 * 24,
          }
     },

     redirectURLs: {
          signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
     },

     trustedOrigins: [envVars.BETTER_AUTH_URL, envVars.FRONTEND_URL],

     // advanced: {
     //      useSecureCookies: false, // Set to true in production
     //      cookies: {
     //           state: {
     //                attributes: {
     //                     sameSite: "none",
     //                     secure: true,
     //                     httpOnly: true,
     //                     path: "/",
     //                }
     //           },
     //           sessionToken: {
     //                attributes: {
     //                     sameSite: "none",
     //                     secure: true,
     //                     httpOnly: true,
     //                     path: "/",
     //                }
     //           }
     //      }
     // }
});
