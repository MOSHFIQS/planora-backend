import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";

const getMyProfile = async (user: IRequestUser) => {
     const foundUser = await prisma.user.findUnique({
          where: {
               id: user.userId,
          },
          include: {
               accounts: {
                    select: {
                         providerId: true,
                         password: true,
                    },
               },
          },
     });

     if (!foundUser) {
          throw new AppError(status.NOT_FOUND, "User not found");
     }

     const { accounts, ...rest } = foundUser;
     const hasPassword = accounts.some(
          (acc) => acc.password !== null && acc.password !== undefined && acc.password !== ""
     );

     return {
          ...rest,
          hasPassword,
     };
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