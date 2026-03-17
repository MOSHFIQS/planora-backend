import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { tokenUtils } from "../../utils/token";
import { IRegisterUserPayload } from "./auth.interface";
import { UserStatus } from "../../../generated/prisma/enums";
import { ILoginUserPayload, IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";

const registerUser = async (payload: IRegisterUserPayload) => {
     const { name, email, password, image } = payload;

     const data = await auth.api.signUpEmail({
          body: {
               name,
               email,
               password,
               image,
          },
     });

     if (!data.user) {
          throw new AppError(status.BAD_REQUEST, "Failed to register user");
     }

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

const getMe = async (user: IRequestUser) => {
  const foundUser = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
  });

  if (!foundUser) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return foundUser;
};

export const AuthService = {
     registerUser,
     loginUser,
     getMe
};
