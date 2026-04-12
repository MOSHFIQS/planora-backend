import { prisma } from "../../lib/prisma";
import { AuditAction } from "../../../generated/prisma/enums";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";

export const AuditLogService = {
  logAction: async (
    action: AuditAction,
    entityType: string,
    entityId: string | null = null,
    actorId: string | null = null,
    description: string | null = null,
    metadata: any = null,
    req?: any // optional req for IP and UserAgent
  ) => {
    try {
      const ipAddress = req?.ip || req?.headers?.["x-forwarded-for"] || null;
      const userAgent = req?.headers?.["user-agent"] || null;

      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          description,
          metadata: metadata ? metadata : undefined,
          actorId,
          ipAddress: typeof ipAddress === "string" ? ipAddress : undefined,
          userAgent,
        },
      });
    } catch (error) {
      console.error("Failed to log audit action:", error);
      // We generally do not throw errors here so that critical operations aren't blocked by a failed audit log
    }
  },
};


const getAllLogs = async (query: IQueryParams = {}) => {
  const qb = new QueryBuilder(prisma.auditLog, query, {
    searchableFields: ['entityType', 'entityId', 'description','actor.email'],
    filterableFields: ['entityType', 'entityId', 'actorId', 'action']
  });

  return qb
    .search()
    .filter()
    .include({
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    })
    .sort()
    .paginate()
    .execute();
};

export const AuditService = {
  getAllLogs,
};