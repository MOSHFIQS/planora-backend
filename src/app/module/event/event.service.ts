import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ICreateEventPayload } from "./event.interface";
import { EventVisibility } from "../../../generated/prisma/enums";
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

export const EventService = {
     createEvent,
     getAllEvents,
     getSingleEvent
};
