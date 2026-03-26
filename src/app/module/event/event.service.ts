import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ICreateEventPayload, IUpdateEventPayload } from "./event.interface";
import { EventVisibility, ParticipationStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
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
    select: {
      id: true,
      title: true,
      dateTime: true,
      type: true,
      fee: true,
      images: true,
    },
    orderBy: {
      dateTime: "asc",
    },
  });
};

const getSingleEventPublic = async (
  user: IRequestUser,
  eventId: string
) => {
  // 1. Check participation for this user
  const participation = await prisma.participation.findFirst({
    where: {
      eventId,
      userId: user.userId,
    },
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

  // 2. If user has SUCCESS payment OR approved
  const isUnlocked =
    participation &&
    (participation.status === ParticipationStatus.APPROVED ||
      participation.payment?.some(
        (p) => p.status === PaymentStatus.SUCCESS
      ));

  if (isUnlocked) {
    return {
      type: "FULL",
      data: participation,
    };
  }

  // 3. Otherwise return public event
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
      visibility: EventVisibility.PUBLIC,
    },
    select: {
      id: true,
      title: true,
      venue: true,
      dateTime: true,
      type: true,
      fee: true,
      images: true,
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  return {
    type: "PUBLIC",
    data: event,
  };
};


const organizersSingleEventById = async (id: string) => {
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
  getSingleEventPublic,
  organizersSingleEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  getAllEventsAdmin
};