import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ParticipationStatus, EventVisibility } from "../../../generated/prisma/enums";


const joinEvent = async (user: IRequestUser, eventId: string) => {

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  // Prevent organizer joining own event
  if (event.organizerId === user.userId) {
    throw new AppError(status.BAD_REQUEST, "Organizer cannot join own event");
  }

  const existing = await prisma.participation.findUnique({
    where: {
      userId_eventId: {
        userId: user.userId,
        eventId,
      },
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, "Already joined or requested");
  }

  const statusValue =
    event.visibility === EventVisibility.PUBLIC
      ? ParticipationStatus.APPROVED
      : ParticipationStatus.PENDING;

  return prisma.participation.create({
    data: {
      userId: user.userId,
      eventId,
      status: statusValue,
    },
  });
};


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
    where: { userId: user.userId },
    include: {
      event: true,
    },
  });
};


export const ParticipationService = {
  joinEvent,
  cancelParticipation,
  getMyEvents
};