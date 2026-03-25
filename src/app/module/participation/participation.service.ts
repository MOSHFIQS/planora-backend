import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ParticipationStatus, PaymentStatus } from "../../../generated/prisma/enums";



export const getMyEvents = async (user: IRequestUser) => {

     if (!user?.userId) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     const approvedEvents = await prisma.participation.findMany({
          where: {
               userId: user.userId,
               OR: [
                    { status: ParticipationStatus.APPROVED },
                    {
                         payment: {
                              some: {
                                   status: PaymentStatus.SUCCESS,
                              },
                         },
                    },
               ],
          },
          include: {
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
                                   name: true,
                              },
                         },
                    },
               },
               ticket: true,
               payment: {
                    select: {
                         id: true,
                         amount: true,
                         status: true,
                         createdAt: true,
                         invoiceUrl: true,
                         transactionId: true,
                    },
               },
          },
     });

     const pendingEvents = await prisma.participation.findMany({
          where: {
               userId: user.userId,
               status: ParticipationStatus.PENDING,
               payment: {
                    none: {
                         status: PaymentStatus.SUCCESS,
                    },
               },
          },
          include: {
               event: {
                    select: {
                         id: true,
                         title: true,
                         dateTime: true,
                         fee: true,
                         images: true,
                    },
               },
          },
     });


     const result = [...approvedEvents, ...pendingEvents].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
     );

     return result;
};

const getMySingleEvent = async (
     user: IRequestUser,
     participationId: string
) => {
     const participation = await prisma.participation.findUnique({
          where: { id: participationId },
          include: {
               user: {
                    select: {
                         id: true,
                         name: true,
                         email: true,
                         image: true,
                    },
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
                                   name: true,
                              },
                         },
                    },
               },
               ticket: true,
               payment: {
                    select: {
                         id: true,
                         amount: true,
                         status: true,
                         createdAt: true,
                         invoiceUrl: true,
                         transactionId: true,
                    },
               },
          },
     });

     if (!participation) {
          throw new AppError(status.NOT_FOUND, "Participation not found");
     }

     // Only the participant can access their own participation
     if (participation.userId !== user.userId) {
          throw new AppError(
               status.FORBIDDEN,
               "You are not allowed to view this participation"
          );
     }

     return participation;
};



const getEventParticipants = async (user: IRequestUser, eventId: string) => {
     const event = await prisma.event.findUnique({
          where: { id: eventId },
     });

     if (!event) {
          throw new AppError(status.NOT_FOUND, "Event not found");
     }

     // Authorization check
     const isOrganizer = event.organizerId === user.userId;
     const isAdmin = user.role === "ADMIN";

     if (!isOrganizer && !isAdmin) {
          throw new AppError(
               status.FORBIDDEN,
               "You are not allowed to view participants",
          );
     }

     return prisma.participation.findMany({
          where: { eventId },
          include: {
               user: true,
          },
     });
};

const updateStatus = async (
     user: IRequestUser,
     participationId: string,
     newStatus: ParticipationStatus,
) => {
     const participation = await prisma.participation.findUnique({
          where: { id: participationId },
          include: { event: true },
     });

     if (!participation) {
          throw new AppError(status.NOT_FOUND, "Participation not found");
     }

     // Only organizer or admin
     if (
          participation.event.organizerId !== user.userId &&
          user.role !== "ADMIN"
     ) {
          throw new AppError(status.FORBIDDEN, "Not authorized");
     }

     return prisma.participation.update({
          where: { id: participationId },
          data: { status: newStatus },
     });
};

export const ParticipationService = {
     getMyEvents,
     getMySingleEvent,
     getEventParticipants,
     updateStatus,
};
