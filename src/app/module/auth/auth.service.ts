import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { tokenUtils } from "../../utils/token";
import { IChangePasswordPayload, IRegisterUserPayload } from "./auth.interface";
import { AuditAction, UserStatus } from "../../../generated/prisma/enums";
import {
     ILoginUserPayload,

} from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";
import ms from "ms";
import { JwtPayload } from "jsonwebtoken";
import { jwtUtils } from "../../utils/jwt";
import { AuditLogService } from "../audit/audit.service";

const registerUser = async (payload: IRegisterUserPayload) => {
     const { name, email, password, image, role } = payload;

     const data = await auth.api.signUpEmail({
          body: {
               name,
               email,
               password,
               image,
               role,
          },
     });

     if (!data.user) {
          throw new AppError(status.BAD_REQUEST, "Failed to register user");
     }

     //if payload.role is user then log action as user else log as organizer


     await AuditLogService.logAction(
          AuditAction.REGISTER,
          role || "USER",
          data.user.id,
          data.user.id,
          "User self-registered"
     );

     const accessToken = tokenUtils.getAccessToken({
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          status: data.user.status,
          needPasswordChange: data.user.needPasswordChange,
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
     });

     const refreshToken = tokenUtils.getRefreshToken({
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          status: data.user.status,
          needPasswordChange: data.user.needPasswordChange,
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
     });

     return {
          ...data,
          accessToken,
          refreshToken,
     };
};

const loginUser = async (payload: ILoginUserPayload) => {
     const { email, password } = payload;

     const data = await auth.api.signInEmail({
          body: {
               email,
               password,
          },
     });

     if (data.user.status === UserStatus.SUSPENDED) {
          throw new AppError(status.FORBIDDEN, "User is suspended");
     }

     if (data.user.isDeleted) {
          throw new AppError(status.NOT_FOUND, "User is deleted");
     }

     await AuditLogService.logAction(
          AuditAction.LOGIN,
          data.user.role,
          data.user.id,
          data.user.id,
          "User logged in"
     );

     const accessToken = tokenUtils.getAccessToken({
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          status: data.user.status,
          needPasswordChange: data.user.needPasswordChange,
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
     });

     const refreshToken = tokenUtils.getRefreshToken({
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          status: data.user.status,
          needPasswordChange: data.user.needPasswordChange,
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
     });

     return {
          ...data,
          accessToken,
          refreshToken,
     };
};


const getNewToken = async (refreshToken: string, sessionToken: string) => {
     const isSessionTokenExists = await prisma.session.findUnique({
          where: {
               token: sessionToken,
          },
          include: {
               user: true,
          },
     });

     if (!isSessionTokenExists) {
          throw new AppError(status.UNAUTHORIZED, "Invalid session token");
     }

     const verifiedRefreshToken = jwtUtils.verifyToken(
          refreshToken,
          envVars.REFRESH_TOKEN_SECRET,
     );

     if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
          throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
     }

     const data = verifiedRefreshToken.data as JwtPayload;

     const newAccessToken = tokenUtils.getAccessToken({
          userId: data.userId,
          role: data.role,
          name: data.name,
          email: data.email,
          status: data.status,
          needPasswordChange: data.needPasswordChange,
          isDeleted: data.isDeleted,
          emailVerified: data.emailVerified,
     });

     const newRefreshToken = tokenUtils.getRefreshToken({
          userId: data.userId,
          role: data.role,
          name: data.name,
          email: data.email,
          status: data.status,
          needPasswordChange: data.needPasswordChange,
          isDeleted: data.isDeleted,
          emailVerified: data.emailVerified,
     });

     const { token } = await prisma.session.update({
          where: {
               token: sessionToken,
          },
          data: {
               token: sessionToken,
               expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
               updatedAt: new Date(),
          },
     });

     return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          sessionToken: token,
          user: {
               id: isSessionTokenExists.user.id,
               name: isSessionTokenExists.user.name,
               email: isSessionTokenExists.user.email,
               role: isSessionTokenExists.user.role,
               image: isSessionTokenExists.user.image,
          },
     };
};

const changePassword = async (
     payload: IChangePasswordPayload,
     userId: string,
) => {
     const { currentPassword, newPassword } = payload;

     // Find the user's most recent active session (same pattern as checkAuth middleware)
     const session = await prisma.session.findFirst({
          where: {
               userId,
               expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          include: { user: true },
     });

     if (!session) {
          throw new AppError(status.UNAUTHORIZED, "No active session found");
     }

     // Find the credential account — Google-only accounts won't have one
     const credentialAccount = await prisma.account.findFirst({
          where: {
               userId,
               providerId: "credential",
          },
     });

     if (!credentialAccount || !credentialAccount.password) {
          throw new AppError(
               status.BAD_REQUEST,
               "Your account was created via Google. Please use the 'Forgot Password' button to set a password for the first time.",
          );
     }

     // Verify current password using Better Auth's own password utilities
     const ctx = await auth.$context;
     const isValidPassword = await ctx.password.verify({
          hash: credentialAccount.password,
          password: currentPassword,
     });

     if (!isValidPassword) {
          throw new AppError(status.UNAUTHORIZED, "Current password is incorrect");
     }

     // Hash the new password using the same algorithm
     const hashedNewPassword = await ctx.password.hash(newPassword);

     // Update the password directly in the Account table
     await prisma.account.update({
          where: { id: credentialAccount.id },
          data: {
               password: hashedNewPassword,
               updatedAt: new Date(),
          },
     });

     // Mark needPasswordChange as false if needed
     if (session.user.needPasswordChange) {
          await prisma.user.update({
               where: { id: userId },
               data: { needPasswordChange: false },
          });
     }

     // Revoke all OTHER sessions for security (keep the current one)
     await prisma.session.deleteMany({
          where: {
               userId,
               id: { not: session.id },
          },
     });

     const accessToken = tokenUtils.getAccessToken({
          userId: session.user.id,
          role: session.user.role,
          name: session.user.name,
          email: session.user.email,
          status: session.user.status,
          needPasswordChange: false,
          isDeleted: session.user.isDeleted,
          emailVerified: session.user.emailVerified,
     });

     const refreshToken = tokenUtils.getRefreshToken({
          userId: session.user.id,
          role: session.user.role,
          name: session.user.name,
          email: session.user.email,
          status: session.user.status,
          needPasswordChange: false,
          isDeleted: session.user.isDeleted,
          emailVerified: session.user.emailVerified,
     });

     return {
          token: session.token,
          accessToken,
          refreshToken,
     };
};

const logoutUser = async (userId: string) => {
     // Delete all sessions for this user directly — works for both email and Google accounts
     await prisma.session.deleteMany({
          where: { userId },
     });

     return { success: true };
};

const verifyEmail = async (email: string, otp: string) => {
     const result = await auth.api.verifyEmailOTP({
          body: {
               email,
               otp,
          },
     });

     if (result.status && !result.user.emailVerified) {
          await prisma.user.update({
               where: {
                    email,
               },
               data: {
                    emailVerified: true,
               },
          });
     }
};

const forgetPassword = async (email: string) => {
     const isUserExist = await prisma.user.findUnique({
          where: {
               email,
          },
     });

     if (!isUserExist) {
          throw new AppError(status.NOT_FOUND, "User not found");
     }

     if (!isUserExist.emailVerified) {
          throw new AppError(status.BAD_REQUEST, "Email not verified");
     }

     if (isUserExist.isDeleted) {
          throw new AppError(status.NOT_FOUND, "User not found");
     }

     await auth.api.requestPasswordResetEmailOTP({
          body: {
               email,
          },
     });
};

const resetPassword = async (
     email: string,
     otp: string,
     newPassword: string,
) => {
     const isUserExist = await prisma.user.findUnique({
          where: {
               email,
          },
     });

     if (!isUserExist) {
          throw new AppError(status.NOT_FOUND, "User not found");
     }

     if (!isUserExist.emailVerified) {
          throw new AppError(status.BAD_REQUEST, "Email not verified");
     }

     if (isUserExist.isDeleted) {
          throw new AppError(status.NOT_FOUND, "User not found");
     }

     await auth.api.resetPasswordEmailOTP({
          body: {
               email,
               otp,
               password: newPassword,
          },
     });

     if (isUserExist.needPasswordChange) {
          await prisma.user.update({
               where: {
                    id: isUserExist.id,
               },
               data: {
                    needPasswordChange: false,
               },
          });
     }

     await prisma.session.deleteMany({
          where: {
               userId: isUserExist.id,
          },
     });
};

const googleLoginSuccess = async (session: any) => {
     const user = await prisma.user.findUnique({
          where: {
               id: session.user.id,
          },
          include: {
               accounts: {
                    select: {
                         providerId: true,
                    },
               },
          },
     });

     if (!user) {
          throw new AppError(status.NOT_FOUND, "User not found in system");
     }

     // Google sign-UP is disabled — only existing email-registered users may log in via Google.
     // If the user has no 'credential' account it means they were just created fresh by Better Auth
     // through Google OAuth (i.e., they tried to sign up via Google). Roll back and reject.
     const hasCredentialAccount = user.accounts.some(
          (acc) => acc.providerId === "credential",
     );

     if (!hasCredentialAccount) {
          // Clean up the orphan Better Auth records so the email stays available for proper registration
          await prisma.session.deleteMany({ where: { userId: user.id } });
          await prisma.account.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });

          throw new AppError(
               status.FORBIDDEN,
               "No account found for this Google email. Please register with your email and password first, verify your email, then you can sign in with Google.",
          );
     }

     if (user.status === UserStatus.SUSPENDED) {
          throw new AppError(status.FORBIDDEN, "User account is suspended");
     }

     if (user.isDeleted) {
          throw new AppError(status.NOT_FOUND, "User account is deleted");
     }

     await AuditLogService.logAction(
          AuditAction.LOGIN,
          user.role,
          user.id,
          user.id,
          "User logged in via Google"
     );

     const accessToken = tokenUtils.getAccessToken({
          userId: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          status: user.status,
          needPasswordChange: user.needPasswordChange,
          isDeleted: user.isDeleted,
          emailVerified: user.emailVerified,
     });

     const refreshToken = tokenUtils.getRefreshToken({
          userId: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          status: user.status,
          needPasswordChange: user.needPasswordChange,
          isDeleted: user.isDeleted,
          emailVerified: user.emailVerified,
     });

     return {
          accessToken,
          refreshToken,
          user: {
               id: user.id,
               name: user.name,
               email: user.email,
               image: user.image ?? null,
               role: user.role,
               status: user.status,
               needPasswordChange: user.needPasswordChange,
               isDeleted: user.isDeleted,
               emailVerified: user.emailVerified,
               createdAt: user.createdAt,
               updatedAt: user.updatedAt,
          },
     };
};

const resendOTP = async (
     email: string,
     type: "email-verification" | "forget-password",
) => {
     if (type === "email-verification") {
          await auth.api.sendVerificationEmail({
               body: {
                    email,
               },
          });
     } else if (type === "forget-password") {
          await auth.api.requestPasswordResetEmailOTP({
               body: {
                    email,
               },
          });
     }
};

export const AuthService = {
     registerUser,
     loginUser,
     getNewToken,
     changePassword,
     logoutUser,
     verifyEmail,
     forgetPassword,
     resetPassword,
     googleLoginSuccess,
     resendOTP,
};
