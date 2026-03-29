import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ICreateEventPayload, IUpdateEventPayload } from "./event.interface";
import { EventVisibility, ParticipationStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Prisma } from "../../../generated/prisma/client";
import { eventFilterableFields, eventSearchableFields } from "./event.constant";

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
  return prisma.event.create({
    data: {
      ...payload,
      organizerId: user.userId,
      dateTime: new Date(payload.dateTime),
    },
  });
};

// const getAllEvents = async (filters: {
//   search?: string;
//   categoryId?: string;
// }) => {
//   const { search, categoryId } = filters;

//   return prisma.event.findMany({
//     where: {
//       visibility: EventVisibility.PUBLIC,


//       ...(search && {
//         title: {
//           contains: search,
//           mode: "insensitive", 
//         },
//       }),


//       ...(categoryId && {
//         categoryId: categoryId,
//       }),
//     },

//     select: {
//       id: true,
//       title: true,
//       dateTime: true,
//       type: true,
//       fee: true,
//       images: true,
//       categoryId: true,
//     },

//     orderBy: {
//       dateTime: "asc",
//     },
//   });
// };

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
    })
    .sort()
    .paginate()
    .execute();

  return result;
};

const getMyEvents = async (user: IRequestUser, query: IQueryParams) => {
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
  if (event.organizerId !== user.userId && user.role !== Role.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
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
const deleteEvent = async (id: string, user: IRequestUser) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      participations: true,
    },
  });

  if (!event) {
    throw new AppError(status.NOT_FOUND, "Event not found");
  }

  //  Authorization check
  if (event.organizerId !== user.userId && user.role !== Role.ADMIN) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  //  Check if participants exist
  if (event.participations.length > 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot delete event. Participants already joined."
    );
  }

  //  Safe delete
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