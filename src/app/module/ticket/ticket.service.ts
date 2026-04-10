import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IRequestUser } from "../../interfaces/requestUser.interface";

// Get all tickets of a user
// const getUserTickets = async (userId: string) => {
//   return prisma.ticket.findMany({
//     where: { userId },
//     include: { event: true },
//     orderBy: { createdAt: "desc" },
//   });
// };

const getUserTickets = async (
  user: IRequestUser,
  query: IQueryParams
) => {

  const queryBuilder = new QueryBuilder(
    prisma.ticket,
    query
  );

  const result = await queryBuilder
    .where({
      userId: user.userId,
    })
    .include({
      event: true,
    })
    .sort()
    .paginate()
    .execute();

  return result;
};


// Get all tickets for an event
const getEventTickets = async (eventId: string) => {
  return prisma.ticket.findMany({
    where: { eventId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
};

// Check-in ticket (QR scan)
const checkIn = async (qrCode: string, organizerId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: { event: true, user: true },
  });

  if (!ticket) throw new AppError(status.BAD_REQUEST, "Invalid ticket");

  if (ticket.status === "USED") {
    throw new AppError(status.BAD_REQUEST, "Ticket already used");
  }

  // Only the event organizer can check in
  if (ticket.event.organizerId !== organizerId) {
    throw new AppError(status.FORBIDDEN, "Unauthorized");
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "USED", checkedInAt: new Date() },
  });

  return {
    user: {
      id: ticket.user.id,
      name: ticket.user.name,
      email: ticket.user.email,
    },
    event: {
      id: ticket.event.id,
      title: ticket.event.title,
      dateTime: ticket.event.dateTime,
    },
  };
};

export const TicketService = {
  getUserTickets,
  getEventTickets,
  checkIn,
};