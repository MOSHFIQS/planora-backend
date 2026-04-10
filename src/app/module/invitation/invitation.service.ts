import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { AuditAction, EventVisibility, NotificationType } from "../../../generated/prisma/enums";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { AuditLogService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";

const sendInvitation = async (
  user: IRequestUser,
  eventId: string,
  targetUserId: string
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  if (event.visibility !== EventVisibility.PRIVATE) {
    throw new AppError(status.BAD_REQUEST, "Invitations only for private events");
  }

  if (event.organizerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  if (event.organizerId === targetUserId) {
    throw new AppError(status.BAD_REQUEST, "Organizer cannot invite self");
  }

  // Already joined?
  const existingParticipation = await prisma.participation.findUnique({
    where: { userId_eventId: { userId: targetUserId, eventId } },
  });
  if (existingParticipation) {
    throw new AppError(status.BAD_REQUEST, "User already joined");
  }

  // Already invited?
  const existingInvitation = await prisma.invitation.findFirst({
    where: { userId: targetUserId, eventId },
  });
  if (existingInvitation) {
    throw new AppError(status.BAD_REQUEST, "User has already been invited");
  }

  const invitation = await prisma.invitation.create({
    data: {
      eventId,
      userId: targetUserId,
    },
  });

  await AuditLogService.logAction(
    AuditAction.CREATE,
    "invitation",
    invitation.id,
    user.userId,
    `Sent invitation to target user`
  );

  await NotificationService.sendNotification(
    targetUserId,
    "New Event Invitation",
    `You have been invited to an event!`,
    NotificationType.INVITATION,
    eventId
  );

  return invitation;
};

const getEventInvitations = async (user: IRequestUser, eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  if (event.organizerId !== user.userId) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  return prisma.invitation.findMany({
    where: { eventId },
    include: { user: true },
  });
};



const getMyInvitations = async (
  user: IRequestUser,
  query: IQueryParams
) => {


  const queryBuilder = new QueryBuilder(
    prisma.invitation,
    query
  );

  const result = await queryBuilder
    .where({
      userId: user.userId,
    })
    .include({
      event: {
        select: {
          id: true,
          title: true,
          dateTime: true,
          type: true,
          fee: true,
          images: true,
        },
      },
    })
    .sort()
    .paginate()
    .execute();

  return result;
};


const cancelInvitation = async (user: IRequestUser, invitationId: string) => {


  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new AppError(status.NOT_FOUND, "Invitation not found");
  }

  if (invitation.userId !== user.userId && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new AppError(status.FORBIDDEN, "You are not allowed to cancel this invitation");
  }

  return prisma.invitation.delete({
    where: { id: invitationId },
  });
};

export const InvitationService = {
  sendInvitation,
  getEventInvitations,
  getMyInvitations,
  cancelInvitation,
};