import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";

const getMyProfile = async (user: IRequestUser) => {
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

const updateProfile = async (
  user: IRequestUser,
  payload: {
    name?: string;
    image?: string;
  }
) => {
  return prisma.user.update({
    where: { id: user.userId },
    data: payload,
  });
};

export const ProfileService = {
  getMyProfile,
  updateProfile,
};