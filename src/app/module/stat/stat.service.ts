import { prisma } from "../../lib/prisma";
import {
  InvitationStatus,
  ParticipationStatus,
  PaymentStatus,
  Role,
  TicketStatus,
  UserStatus,
} from "../../../generated/prisma/enums";
import { IRequestUser } from "../../interfaces/requestUser.interface";

// ─── Super Admin ──────────────────────────────────────────────────────────────
// Full platform overview — every model, every status breakdown
const getSuperAdminStats = async () => {
  const [
    // Users
    totalUsers,
    totalAdmins,
    totalOrganizers,
    totalNormalUsers,
    activeUsers,
    suspendedUsers,
    deletedUsers,
    // Events
    totalEvents,
    publicEvents,
    privateEvents,
    onlineEvents,
    offlineEvents,
    featuredEvents,
    upcomingEvents,
    pastEvents,
    // Participation
    totalParticipations,
    pendingParticipations,
    approvedParticipations,
    rejectedParticipations,
    bannedParticipations,
    // Invitations
    totalInvitations,
    pendingInvitations,
    acceptedInvitations,
    declinedInvitations,
    // Payments
    totalPayments,
    successfulPayments,
    failedPayments,
    refundedPayments,
    totalRevenue,
    // Tickets
    totalTickets,
    validTickets,
    usedTickets,
    canceledTickets,
    // Reviews
    totalReviews,
    avgRating,
    // Notifications
    totalNotifications,
    unreadNotifications,
    // Audit Logs
    totalAuditLogs,
  ] = await Promise.all([
    // Users
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { role: Role.ADMIN, isDeleted: false } }),
    prisma.user.count({ where: { role: Role.ORGANIZER, isDeleted: false } }),
    prisma.user.count({ where: { role: Role.USER, isDeleted: false } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE, isDeleted: false } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED, isDeleted: false } }),
    prisma.user.count({ where: { isDeleted: true } }),
    // Events
    prisma.event.count(),
    prisma.event.count({ where: { visibility: "PUBLIC" } }),
    prisma.event.count({ where: { visibility: "PRIVATE" } }),
    prisma.event.count({ where: { type: "ONLINE" } }),
    prisma.event.count({ where: { type: "OFFLINE" } }),
    prisma.event.count({ where: { isFeatured: true } }),
    prisma.event.count({ where: { dateTime: { gt: new Date() } } }),
    prisma.event.count({ where: { dateTime: { lt: new Date() } } }),
    // Participation
    prisma.participation.count(),
    prisma.participation.count({ where: { status: ParticipationStatus.PENDING } }),
    prisma.participation.count({ where: { status: ParticipationStatus.APPROVED } }),
    prisma.participation.count({ where: { status: ParticipationStatus.REJECTED } }),
    prisma.participation.count({ where: { status: ParticipationStatus.BANNED } }),
    // Invitations
    prisma.invitation.count(),
    prisma.invitation.count({ where: { status: InvitationStatus.PENDING } }),
    prisma.invitation.count({ where: { status: InvitationStatus.ACCEPTED } }),
    prisma.invitation.count({ where: { status: InvitationStatus.DECLINED } }),
    // Payments
    prisma.payment.count(),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    // Tickets
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: TicketStatus.VALID } }),
    prisma.ticket.count({ where: { status: TicketStatus.USED } }),
    prisma.ticket.count({ where: { status: TicketStatus.CANCELED } }),
    // Reviews
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    // Notifications
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    // Audit Logs
    prisma.auditLog.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      byRole: { admins: totalAdmins, organizers: totalOrganizers, users: totalNormalUsers },
      byStatus: { active: activeUsers, suspended: suspendedUsers, deleted: deletedUsers },
    },
    events: {
      total: totalEvents,
      byVisibility: { public: publicEvents, private: privateEvents },
      byType: { online: onlineEvents, offline: offlineEvents },
      featured: featuredEvents,
      upcoming: upcomingEvents,
      past: pastEvents,
    },
    participations: {
      total: totalParticipations,
      byStatus: {
        pending: pendingParticipations,
        approved: approvedParticipations,
        rejected: rejectedParticipations,
        banned: bannedParticipations,
      },
    },
    invitations: {
      total: totalInvitations,
      byStatus: {
        pending: pendingInvitations,
        accepted: acceptedInvitations,
        declined: declinedInvitations,
      },
    },
    payments: {
      total: totalPayments,
      byStatus: {
        successful: successfulPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      totalRevenue: totalRevenue._sum.amount ?? 0,
    },
    tickets: {
      total: totalTickets,
      byStatus: { valid: validTickets, used: usedTickets, canceled: canceledTickets },
    },
    reviews: {
      total: totalReviews,
      averageRating: avgRating._avg.rating ?? 0,
    },
    notifications: {
      total: totalNotifications,
      unread: unreadNotifications,
    },
    auditLogs: {
      total: totalAuditLogs,
    },
  };
};

// ─── Admin ────────────────────────────────────────────────────────────────────
// Platform health from an admin's perspective — users, events, payments, reviews
// No admin/superadmin management counts (not their concern)
const getAdminStats = async () => {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalOrganizers,
    totalEvents,
    upcomingEvents,
    pastEvents,
    featuredEvents,
    totalParticipations,
    approvedParticipations,
    totalInvitations,
    acceptedInvitations,
    totalPayments,
    successfulPayments,
    failedPayments,
    totalRevenue,
    totalTickets,
    usedTickets,
    totalReviews,
    avgRating,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER, isDeleted: false } }),
    prisma.user.count({ where: { role: Role.USER, status: UserStatus.ACTIVE, isDeleted: false } }),
    prisma.user.count({ where: { role: Role.USER, status: UserStatus.SUSPENDED, isDeleted: false } }),
    prisma.user.count({ where: { role: Role.ORGANIZER, isDeleted: false } }),
    prisma.event.count(),
    prisma.event.count({ where: { dateTime: { gt: new Date() } } }),
    prisma.event.count({ where: { dateTime: { lt: new Date() } } }),
    prisma.event.count({ where: { isFeatured: true } }),
    prisma.participation.count(),
    prisma.participation.count({ where: { status: ParticipationStatus.APPROVED } }),
    prisma.invitation.count(),
    prisma.invitation.count({ where: { status: InvitationStatus.ACCEPTED } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: TicketStatus.USED } }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      organizers: totalOrganizers,
    },
    events: {
      total: totalEvents,
      upcoming: upcomingEvents,
      past: pastEvents,
      featured: featuredEvents,
    },
    participations: {
      total: totalParticipations,
      approved: approvedParticipations,
    },
    invitations: {
      total: totalInvitations,
      accepted: acceptedInvitations,
    },
    payments: {
      total: totalPayments,
      successful: successfulPayments,
      failed: failedPayments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    },
    tickets: {
      total: totalTickets,
      used: usedTickets,
    },
    reviews: {
      total: totalReviews,
      averageRating: avgRating._avg.rating ?? 0,
    },
  };
};

// ─── Organizer ────────────────────────────────────────────────────────────────
// Scoped to only the organizer's own events — no platform-wide counts
const getOrganizerStats = async (actor: IRequestUser) => {
  const organizerId = actor.userId;

  const [
    totalEvents,
    upcomingEvents,
    pastEvents,
    featuredEvents,
    publicEvents,
    privateEvents,
    totalParticipations,
    pendingParticipations,
    approvedParticipations,
    totalInvitations,
    acceptedInvitations,
    totalPayments,
    successfulPayments,
    totalRevenue,
    totalTickets,
    validTickets,
    usedTickets,
    totalReviews,
    avgRating,
  ] = await Promise.all([
    prisma.event.count({ where: { organizerId } }),
    prisma.event.count({ where: { organizerId, dateTime: { gt: new Date() } } }),
    prisma.event.count({ where: { organizerId, dateTime: { lt: new Date() } } }),
    prisma.event.count({ where: { organizerId, isFeatured: true } }),
    prisma.event.count({ where: { organizerId, visibility: "PUBLIC" } }),
    prisma.event.count({ where: { organizerId, visibility: "PRIVATE" } }),
    prisma.participation.count({ where: { event: { organizerId } } }),
    prisma.participation.count({ where: { event: { organizerId }, status: ParticipationStatus.PENDING } }),
    prisma.participation.count({ where: { event: { organizerId }, status: ParticipationStatus.APPROVED } }),
    prisma.invitation.count({ where: { event: { organizerId } } }),
    prisma.invitation.count({ where: { event: { organizerId }, status: InvitationStatus.ACCEPTED } }),
    prisma.payment.count({ where: { participation: { event: { organizerId } } } }),
    prisma.payment.count({ where: { participation: { event: { organizerId } }, status: PaymentStatus.SUCCESS } }),
    prisma.payment.aggregate({
      where: { participation: { event: { organizerId } }, status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    prisma.ticket.count({ where: { event: { organizerId } } }),
    prisma.ticket.count({ where: { event: { organizerId }, status: TicketStatus.VALID } }),
    prisma.ticket.count({ where: { event: { organizerId }, status: TicketStatus.USED } }),
    prisma.review.count({ where: { event: { organizerId } } }),
    prisma.review.aggregate({
      where: { event: { organizerId } },
      _avg: { rating: true },
    }),
  ]);

  return {
    events: {
      total: totalEvents,
      upcoming: upcomingEvents,
      past: pastEvents,
      featured: featuredEvents,
      byVisibility: { public: publicEvents, private: privateEvents },
    },
    participations: {
      total: totalParticipations,
      byStatus: { pending: pendingParticipations, approved: approvedParticipations },
    },
    invitations: {
      total: totalInvitations,
      accepted: acceptedInvitations,
    },
    revenue: {
      totalPayments,
      successfulPayments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    },
    tickets: {
      total: totalTickets,
      valid: validTickets,
      used: usedTickets,
    },
    reviews: {
      total: totalReviews,
      averageRating: avgRating._avg.rating ?? 0,
    },
  };
};

// ─── User ─────────────────────────────────────────────────────────────────────
// Personal activity only — what this user has done/joined/paid
const getUserStats = async (actor: IRequestUser) => {
  const userId = actor.userId;

  const [
    totalParticipations,
    pendingParticipations,
    approvedParticipations,
    rejectedParticipations,
    totalInvitations,
    pendingInvitations,
    acceptedInvitations,
    totalPayments,
    successfulPayments,
    totalSpent,
    totalTickets,
    validTickets,
    usedTickets,
    totalReviews,
    unreadNotifications,
  ] = await Promise.all([
    prisma.participation.count({ where: { userId } }),
    prisma.participation.count({ where: { userId, status: ParticipationStatus.PENDING } }),
    prisma.participation.count({ where: { userId, status: ParticipationStatus.APPROVED } }),
    prisma.participation.count({ where: { userId, status: ParticipationStatus.REJECTED } }),
    prisma.invitation.count({ where: { userId } }),
    prisma.invitation.count({ where: { userId, status: InvitationStatus.PENDING } }),
    prisma.invitation.count({ where: { userId, status: InvitationStatus.ACCEPTED } }),
    prisma.payment.count({ where: { userId } }),
    prisma.payment.count({ where: { userId, status: PaymentStatus.SUCCESS } }),
    prisma.payment.aggregate({
      where: { userId, status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    prisma.ticket.count({ where: { userId } }),
    prisma.ticket.count({ where: { userId, status: TicketStatus.VALID } }),
    prisma.ticket.count({ where: { userId, status: TicketStatus.USED } }),
    prisma.review.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    participations: {
      total: totalParticipations,
      byStatus: {
        pending: pendingParticipations,
        approved: approvedParticipations,
        rejected: rejectedParticipations,
      },
    },
    invitations: {
      total: totalInvitations,
      byStatus: { pending: pendingInvitations, accepted: acceptedInvitations },
    },
    payments: {
      total: totalPayments,
      successful: successfulPayments,
      totalSpent: totalSpent._sum.amount ?? 0,
    },
    tickets: {
      total: totalTickets,
      valid: validTickets,
      used: usedTickets,
    },
    reviews: {
      total: totalReviews,
    },
    notifications: {
      unread: unreadNotifications,
    },
  };
};




const getPublicStats = async () => {
  const now = new Date();

  const [
    totalActiveUsers,
    totalEventsDone,
    totalTicketsCreated,
    totalOrganizers,
    totalParticipants,
  ] = await Promise.all([
    // Active users
    prisma.user.count({
      where: {
        status: "ACTIVE",
        isDeleted: false,
      },
    }),

    // Past events
    prisma.event.count({
      where: {
        dateTime: {
          lt: now,
        },
      },
    }),

    // Tickets
    prisma.ticket.count(),

    prisma.user.count({
      where: {
        events: {
          some: {}, 
        },
        isDeleted: false,
      },
    }),

    // Participants
    prisma.participation.count(),
  ]);

  return {
    totalActiveUsers,
    totalEventsDone,
    totalTicketsCreated,
    totalOrganizers,
    totalParticipants,
  };
};

export const StatService = {
  getSuperAdminStats,
  getAdminStats,
  getOrganizerStats,
  getUserStats,
  getPublicStats,
};