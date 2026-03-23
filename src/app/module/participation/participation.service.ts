import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ParticipationStatus } from "../../../generated/prisma/enums";

const cancelParticipation = async (user: IRequestUser, eventId: string) => {
     const participation = await prisma.participation.findUnique({
          where: {
               userId_eventId: {
                    userId: user.userId,
                    eventId,
               },
          },
     });

     if (!participation) {
          throw new AppError(status.NOT_FOUND, "Participation not found");
     }

     return prisma.participation.delete({
          where: { id: participation.id },
     });
};

const getMyEvents = async (user: IRequestUser) => {
     return prisma.participation.findMany({
          where: {
               userId: user.userId,
               status: {
                    in: [
                         ParticipationStatus.APPROVED,
                         ParticipationStatus.PENDING,
                    ],
               },
          },
          include: {
               event: true,
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
          orderBy: { createdAt: "desc" },
     });
};

// const getEventParticipants = async (eventId: string) => {
//      return prisma.participation.findMany({
//           where: { eventId },
//           include: {
//                user: true,
//           },
//      });
// };

const getEventParticipants = async (user: IRequestUser, eventId: string) => {
     const event = await prisma.event.findUnique({
          where: { id: eventId },
     });

     if (!event) {
          throw new AppError(status.NOT_FOUND, "Event not found");
     }

     // 🔐 Authorization check
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
     cancelParticipation,
     getMyEvents,
     getEventParticipants,
     updateStatus,
};
