import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import {
  InvitationStatus,
  EventVisibility,
  ParticipationStatus,
} from "../../../generated/prisma/enums";


// 👑 Send invitation
const sendInvitation = async (
  user: IRequestUser,
  eventId: string,
  targetUserId: string
) => {

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  // Only private events
  if (event.visibility !== EventVisibility.PRIVATE) {
    throw new AppError(status.BAD_REQUEST, "Invitations only for private events");
  }

  // Only organizer or admin
  if (event.organizerId !== user.userId && user.role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  // Prevent inviting organizer
  if (event.organizerId === targetUserId) {
    throw new AppError(status.BAD_REQUEST, "Organizer cannot invite self");
  }

  // Already participant?
  const existingParticipation = await prisma.participation.findUnique({
    where: {
      userId_eventId: {
        userId: targetUserId,
        eventId,
      },
    },
  });

  if (existingParticipation) {
    throw new AppError(status.BAD_REQUEST, "User already joined");
  }

  return prisma.invitation.create({
    data: {
      eventId,
      userId: targetUserId,
    },
  });
};


// 👤 Respond to invitation
const respondInvitation = async (
  user: IRequestUser,
  invitationId: string,
  newStatus: InvitationStatus
) => {

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) {
    throw new AppError(status.NOT_FOUND, "Invitation not found");
  }

  // Only invited user can respond
  if (invitation.userId !== user.userId) {
    throw new AppError(status.FORBIDDEN, "Not your invitation");
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new AppError(status.BAD_REQUEST, "Already responded");
  }

  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: newStatus },
  });

  // If accepted → create participation
  if (newStatus === InvitationStatus.ACCEPTED) {
    await prisma.participation.create({
      data: {
        userId: user.userId,
        eventId: invitation.eventId,
        status: ParticipationStatus.APPROVED,
      },
    });
  }

  return updated;
};


//  Get invitations for event
const getEventInvitations = async (
  user: IRequestUser,
  eventId: string
) => {

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  if (event.organizerId !== user.userId && user.role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  return prisma.invitation.findMany({
    where: { eventId },
    include: {
      user: true,
    },
  });
};


//  Get my invitations
const getMyInvitations = async (user: IRequestUser) => {

  return prisma.invitation.findMany({
    where: { userId: user.userId },
    include: {
      event: true,
    },
  });
};


//  Cancel invitation
const cancelInvitation = async (
  user: IRequestUser,
  invitationId: string
) => {

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) {
    throw new AppError(status.NOT_FOUND, "Invitation not found");
  }

  if (
    invitation.event.organizerId !== user.userId &&
    user.role !== "ADMIN"
  ) {
    throw new AppError(status.FORBIDDEN, "Not authorized");
  }

  return prisma.invitation.delete({
    where: { id: invitationId },
  });
};


export const InvitationService = {
  sendInvitation,
  respondInvitation,
  getEventInvitations,
  getMyInvitations,
  cancelInvitation,
};