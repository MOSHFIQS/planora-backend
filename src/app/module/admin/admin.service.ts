import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import {
  AuditAction,
  InvitationStatus,
  NotificationType,
  ParticipationStatus,
  PaymentStatus,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";
import { auth } from "../../lib/auth";
import { AuditLogService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";

const roleHierarchy: Record<Role, number> = {
  [Role.SUPERADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.ORGANIZER]: 2,
  [Role.USER]: 1,
};

const assertHigherRole = (actorRole: Role, targetRole: Role) => {
  if (roleHierarchy[actorRole] <= roleHierarchy[targetRole]) {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have permission to perform this action on this user"
    );
  }
};

// ── Queries ──────────────────────────────────────────────────────────────────

const getAllUsers = async (user: IRequestUser, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.user, query);
  return queryBuilder
    .where({
      role: {
        in: [Role.USER, Role.ORGANIZER],
      },
    })
    .sort()
    .paginate()
    .execute();
};

const getAllAdmins = async (user: IRequestUser, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.user, query);
  return queryBuilder
    .where({ role: Role.ADMIN })
    .sort()
    .paginate()
    .execute();
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  return user;
};



// ── Mutations ─────────────────────────────────────────────────────────────────

type AllowedAdminRole = "ADMIN" | "SUPERADMIN";

const createAdmin = async (payload: {
  name: string;
  email: string;
  password: string;
  role: AllowedAdminRole;
}) => {
  if (!["ADMIN", "SUPERADMIN"].includes(payload.role)) {
    throw new AppError(status.BAD_REQUEST, "Invalid role");
  }

  const data = await auth.api.signUpEmail({
    body: payload,
  });

  if (!data?.user) {
    throw new AppError(status.BAD_REQUEST, "Failed to create user");
  }

  return data.user;
};


/**
 * Single, unified status-update function.
 * - SUPERADMIN can change ADMIN or USER status.
 * - ADMIN can only change USER status.
 * Role-hierarchy check enforces this automatically.
 */
const updateUserStatus = async (
  targetId: string,
  newStatus: UserStatus,
  actor: IRequestUser
) => {
  if (actor.userId === targetId) {
    throw new AppError(status.BAD_REQUEST, "You cannot change your own status");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
  if (!targetUser || targetUser.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  assertHigherRole(actor.role, targetUser.role);

  const updatedUser = await prisma.user.update({
    where: { id: targetId },
    data: { status: newStatus },
  });

  await AuditLogService.logAction(
    AuditAction.SUSPEND,
    "user",
    targetId,
    actor.userId,
    `Status changed to ${newStatus}`
  );

  await NotificationService.sendNotification(
    targetId,
    "Account Status Update",
    `Your account status has been changed to ${newStatus}.`,
    newStatus === UserStatus.SUSPENDED ? NotificationType.WARNING : NotificationType.INFO
  );

  return updatedUser;
};

const deleteUser = async (targetId: string, actor: IRequestUser) => {
  if (actor.userId === targetId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
  if (!targetUser || targetUser.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  assertHigherRole(actor.role, targetUser.role);

  return prisma.user.update({
    where: { id: targetId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const updateUserRole = async (
  targetId: string,
  newRole: Role,
  actor: IRequestUser
) => {
  if (actor.userId === targetId) {
    throw new AppError(status.BAD_REQUEST, "You cannot change your own role")
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
  });

  if (!targetUser || targetUser.isDeleted) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  assertHigherRole(actor.role, targetUser.role);

  if (targetUser.role === newRole) {
    throw new AppError(status.BAD_REQUEST, "User already has this role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetId },
    data: { role: newRole },
  });

  await AuditLogService.logAction(
    AuditAction.UPDATE,
    "user",
    targetId,
    actor.userId,
    `Role changed from ${targetUser.role} to ${newRole}`
  );

  // Notification
  await NotificationService.sendNotification(
    targetId,
    "Role Updated",
    `Your role has been updated from ${targetUser.role} to ${newRole}.`,
    NotificationType.INFO
  );

  return updatedUser;
};

export const AdminService = {
  getAllUsers,
  getAllAdmins,
  getSingleUser,
  updateUserStatus,
  deleteUser,
  updateUserRole,
  createAdmin,
};