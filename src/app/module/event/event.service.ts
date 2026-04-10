import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ICreateEventPayload, IUpdateEventPayload } from "./event.interface";
import { AuditAction, EventVisibility, ParticipationStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Prisma } from "../../../generated/prisma/client";
import { eventFilterableFields, eventSearchableFields } from "./event.constant";
import { AuditLogService } from "../audit/audit.service";

export const createEvent = async (
  user: IRequestUser,
  payload: ICreateEventPayload,
) => {
  // Check if categoryId exists
  const categoryExists = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!categoryExists) {
    throw new Error("Category does not exist");
  }

  // Create event
  const createdEvent = await prisma.event.create({
    data: {
      ...payload,
      organizerId: user.userId,
      dateTime: new Date(payload.dateTime),
    },
  });

  await AuditLogService.logAction(
    AuditAction.CREATE,
    "event",
    createdEvent.id,
    user.userId,
    `Created event: ${createdEvent.title}`
  );

  return createdEvent;
};


const getAllEvents = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Event,
    Prisma.EventWhereInput,
    Prisma.EventInclude
  >(
    prisma.event,
    query,
    {
      searchableFields: eventSearchableFields,
      filterableFields: eventFilterableFields,
    }
  );

  const result = await queryBuilder
    .search()
    .filter()
    .where({
      visibility: EventVisibility.PUBLIC,
    })
    .selectFixed({
      id: true,
      title: true,
      dateTime: true,
      type: true,
      fee: true,
      images: true,
      categoryId: true,
      venue: true,
    })
    .sort()
    .paginate()
    .execute();

  return result;
};

const getOrganizerEvents = async (user: IRequestUser, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Event,
    Prisma.EventWhereInput,
    Prisma.EventInclude
  >(prisma.event, query);

  const result = await queryBuilder
    .where({
      organizerId: user.userId,
    })
    .sort()
    .paginate()
    .execute()

  return result;
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
      id: eventId
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




export const updateEvent = async (
  id: string,
  user: IRequestUser,
  payload: IUpdateEventPayload
) => {
  // Find existing event
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  // Authorization
  if (event.organizerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, "You are not authorized to update this event");
  }

  // If categoryId is being updated, check it exists
  if (payload.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) {
      throw new AppError(status.BAD_REQUEST, "Category does not exist");
    }
  }

  // Convert dateTime to Date if provided
  const dataToUpdate = {
    ...payload,
    dateTime: payload.dateTime ? new Date(payload.dateTime) : undefined,
  };

  return prisma.event.update({
    where: { id },
    data: dataToUpdate,
  });
};


const deleteEventByOrganizer = async (id: string, user: IRequestUser) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      participations: true,
    },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  // Only organizer can delete
  if (event.organizerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, "Only organizer can delete this event");
  }

  // Check if participants exist
  if (event.participations.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete event. Participants already joined."
    );
  }

  // Safe delete
  await prisma.event.delete({
    where: { id },
  });

  await AuditLogService.logAction(
    AuditAction.DELETE,
    "event",
    id,
    user.userId,
    "Deleted event by organizer"
  );

  return null;
};

const getAllEventsAdmin = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(
    prisma.event,
    query
  );

  const result = await queryBuilder
    .include({
      organizer: true,
    })
    .sort()
    .paginate()
    .execute();

  return result;
};


const deleteEventByAdmin = async (id: string, user: IRequestUser) => {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  await prisma.event.delete({
    where: { id },
  });

  await AuditLogService.logAction(
    AuditAction.DELETE,
    "event",
    id,
    user.userId,
    "Deleted event by admin"
  );

  return null;
};


const updateFeaturedStatus = async (id: string, isFeatured: boolean) => {
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      visibility: true,
    },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  // Prevent PRIVATE events
  if (event.visibility !== "PUBLIC") {
    throw new AppError(
      status.BAD_REQUEST,
      "Only public events can be featured"
    );
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: { isFeatured },
  });

  return updatedEvent;
};

const getFeaturedEvents = async () => {
  const events = await prisma.event.findMany({
    where: {
      isFeatured: true,
      visibility: "PUBLIC",
    },
    orderBy: {
      dateTime: "asc", // upcoming first
    },
    include: {
      category: true,
    },
  });

  return events;
};

export const EventService = {
  createEvent,
  getAllEvents,
  getSingleEventPublic,
  organizersSingleEventById,
  getOrganizerEvents,
  updateEvent,
  deleteEventByOrganizer,
  getAllEventsAdmin,
  deleteEventByAdmin,
  updateFeaturedStatus,
  getFeaturedEvents
};