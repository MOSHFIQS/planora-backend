import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { tokenUtils } from "../../utils/token";
import { IRegisterUserPayload } from "./auth.interface";
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
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
     });

     const refreshToken = tokenUtils.getRefreshToken({
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          status: data.user.status,
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
          isDeleted: data.user.isDeleted,
          emailVerified: data.user.emailVerified,
     });

     const refreshToken = tokenUtils.getRefreshToken({
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          status: data.user.status,
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
     const session = await prisma.session.findUnique({
          where: {
               token: sessionToken,
          },
          include: {
               user: true,
          },
     });

     if (!session) {
          throw new AppError(status.UNAUTHORIZED, "Invalid session token");
     }

     const verifiedRefreshToken = jwtUtils.verifyToken(
          refreshToken,
          envVars.REFRESH_TOKEN_SECRET,
     );

     if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
          throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
     }

     const data = verifiedRefreshToken.data as JwtPayload;

     const newAccessToken = tokenUtils.getAccessToken({
          userId: data.userId,
          role: data.role,
          name: data.name,
          email: data.email,
          status: data.status,
          isDeleted: data.isDeleted,
          emailVerified: data.emailVerified,
     });

     const newRefreshToken = tokenUtils.getRefreshToken({
          userId: data.userId,
          role: data.role,
          name: data.name,
          email: data.email,
          status: data.status,
          isDeleted: data.isDeleted,
          emailVerified: data.emailVerified,
     });

     const { token } = await prisma.session.update({
          where: {
               token: sessionToken,
          },
          data: {
               token: sessionToken,
               expiresAt: new Date(
                    Date.now() +
                    ms(
                         envVars.REFRESH_TOKEN_EXPIRES_IN as unknown as ms.StringValue,
                    ),
               ),
               updatedAt: new Date(),
          },
     });

     return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          sessionToken: token,
     };
};

export const AuthService = {
     registerUser,
     loginUser,
     getNewToken,
};
