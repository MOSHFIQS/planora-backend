import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ICreateEventPayload, IUpdateEventPayload } from "./event.interface";
import { EventVisibility, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

const createEvent = async (
     user: IRequestUser,
     payload: ICreateEventPayload,
) => {
     return prisma.event.create({
          data: {
               ...payload,
               organizerId: user.userId,
          },
     });
};

const getAllEvents = async () => {
     return prisma.event.findMany({
          where: {
               visibility: EventVisibility.PUBLIC,
          },
          include: {
               organizer: true,
          },
          orderBy: {
               dateTime: "asc",
          },
     });
};

const getSingleEvent = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      participations: true,
      invitations: true,
      reviews: true,
    },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  return event;
};

const getMyEvents = async (user: IRequestUser) => {
  return prisma.event.findMany({
    where: {
      organizerId: user.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateEvent = async (
  id: string,
  user: IRequestUser,
  payload: IUpdateEventPayload
) => {
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  // Only organizer or admin
  if (event.organizerId !== user.userId && user.role !== Role.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  return prisma.event.update({
    where: { id },
    data: payload,
  });
};

const deleteEvent = async (id: string, user: IRequestUser) => {
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  if (event.organizerId !== user.userId && user.role !== Role.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  await prisma.event.delete({
    where: { id },
  });
};

const getAllEventsAdmin = async () => {
  return prisma.event.findMany({
    include: {
      organizer: true,
    },
  });
};

export const EventService = {
     createEvent,
     getAllEvents,
     getSingleEvent,
     getMyEvents,
     updateEvent,
     deleteEvent,
     getAllEventsAdmin
};
