/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ParticipationStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { EventData, UserWithEvents } from "./participation.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";




// export const getMyEvents = async (
//      user: IRequestUser,
//      query: IQueryParams
// ) => {


//      // 🔹 QB instance for approved
//      const approvedQB = new QueryBuilder(
//           prisma.participation,
//           query,{
//                searchableFields: ['event.description','event.title'],
//           }
//      )
//           .where({
//                userId: user.userId,
//                OR: [
//                     { status: ParticipationStatus.APPROVED },
//                     {
//                          payment: {
//                               some: {
//                                    status: PaymentStatus.SUCCESS,
//                               },
//                          },
//                     },
//                ],
//           })
//           .include({
//                event: {
//                     select: {
//                          id: true,
//                          title: true,
//                          description: true,
//                          venue: true,
//                          dateTime: true,
//                          type: true,
//                          fee: true,
//                          images: true,
//                          meetingLink: true,
//                          organizer: {
//                               select: {
//                                    id: true,
//                                    name: true,
//                               },
//                          },
//                          reviews: {
//                               where: {
//                                    userId: user.userId,
//                               },
//                               select: {
//                                    id: true,
//                               },
//                          },
//                     },
//                },
//                ticket: true,
//                payment: {
//                     select: {
//                          id: true,
//                          amount: true,
//                          status: true,
//                          createdAt: true,
//                          invoiceUrl: true,
//                          transactionId: true,
//                     },
//                },
//           })
//           .search()
//           .sort()
//           .paginate();

//      const approvedResult = await approvedQB.execute();

//      // 🔹 QB instance for pending
//      const pendingQB = new QueryBuilder(
//           prisma.participation,
//           query
//      )
//           .where({
//                userId: user.userId,
//                status: ParticipationStatus.PENDING,
//                payment: {
//                     none: {
//                          status: PaymentStatus.SUCCESS,
//                     },
//                },
//           })
//           .include({
//                event: {
//                     select: {
//                          id: true,
//                          title: true,
//                          dateTime: true,
//                          type: true,
//                          venue: true,
//                          fee: true,
//                          images: true,
//                     },
//                },
//           })
//           .sort()
//           .paginate();

//      const pendingResult = await pendingQB.execute();

//      // 🔹 Merge results
//      const mergedData = [
//           ...approvedResult.data,
//           ...pendingResult.data,
//      ].sort(
//           (a: any, b: any) =>
//                new Date(b.createdAt).getTime() -
//                new Date(a.createdAt).getTime()
//      );

//      //  Meta merge (approximation)
//      const total = approvedResult.meta.total + pendingResult.meta.total;

//      const limit = approvedResult.meta.limit;
//      const page = approvedResult.meta.page;

//      return {
//           data: mergedData,
//           meta: {
//                page,
//                limit,
//                total,
//                totalPages: Math.ceil(total / limit),
//           },
//      };
// };

const getMyEvents = async (user: IRequestUser, query: IQueryParams) => {
     const qb = new QueryBuilder(prisma.participation, query, {
          searchableFields: ['event.title', 'event.description'],
     });

     const result = await qb
          .where({
               userId: user.userId,
               OR: [
                    { status: ParticipationStatus.APPROVED },
                    {
                         payment: {
                              some: { status: PaymentStatus.SUCCESS },
                         },
                    },
                    {
                         AND: [
                              { status: ParticipationStatus.PENDING },
                              {
                                   payment: {
                                        none: { status: PaymentStatus.SUCCESS },
                                   },
                              },
                         ],
                    },
               ],
          })
          .include({
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
                         organizer: {
                              select: { id: true, name: true },
                         },
                         reviews: {
                              where: { userId: user.userId },
                              select: { id: true },
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
          })
          .search()
          .sort()
          .paginate()
          .execute();

     return result;
};

const getEventParticipants = async (user: IRequestUser, eventId: string) => {
     const event = await prisma.event.findUnique({
          where: { id: eventId },
     });

     if (!event) {
          throw new AppError(status.NOT_FOUND, "Event not found");
     }

     // Authorization check
     const isOrganizer = event.organizerId === user.userId;

     if (!isOrganizer) {
          throw new AppError(
               status.FORBIDDEN,
               "You are not allowed to view participants",
          );
     }

     return prisma.participation.findMany({
          where: { eventId },
          include: {
               user: true,
          },
     });
};





export const getMyAllEventParticipants = async (user: IRequestUser) => {

     const events: EventData[] = await prisma.event.findMany({
          where: { organizerId: user.userId },
          select: {
               id: true,
               title: true,
               dateTime: true,
               participations: {
                    select: {
                         user: { select: { id: true, name: true, email: true, image: true } },
                         status: true,
                    },
               },
               invitations: {
                    select: {
                         user: { select: { id: true, name: true, email: true, image: true } },
                         status: true,
                    },
               },
          },
     });

     const usersMap = new Map<string, UserWithEvents>();

     events.forEach((event) => {
          // Process participations first
          event.participations.forEach((p) => {
               const existingUser: UserWithEvents =
                    usersMap.get(p.user.id) || { ...p.user, events: [] };

               const eventIndex = existingUser.events.findIndex(
                    (e) => e.eventId === event.id
               );

               // Only handle PENDING or APPROVED
               if (p.status === "APPROVED" || p.status === "PENDING") {
                    const invited = p.status === "PENDING"; // pending = invited, approved = not invited

                    if (eventIndex > -1) {
                         existingUser.events[eventIndex] = {
                              ...existingUser.events[eventIndex],
                              participationStatus: p.status,
                              invited,
                         };
                    } else {
                         existingUser.events.push({
                              eventId: event.id,
                              title: event.title,
                              dateTime: event.dateTime,
                              participationStatus: p.status,
                              invitationStatus: null,
                              invited,
                         });
                    }

                    usersMap.set(p.user.id, existingUser);
               }
          });

          // Then process invitations (only if no participation exists)
          event.invitations.forEach((inv) => {
               const existingUser: UserWithEvents =
                    usersMap.get(inv.user.id) || { ...inv.user, events: [] };

               const eventIndex = existingUser.events.findIndex(
                    (e) => e.eventId === event.id
               );

               if (eventIndex > -1) {
                    // Only mark as invited if no APPROVED participation exists
                    const hasApproved = existingUser.events[eventIndex].participationStatus === "APPROVED";
                    existingUser.events[eventIndex] = {
                         ...existingUser.events[eventIndex],
                         invitationStatus: inv.status,
                         invited: hasApproved ? false : true,
                    };
               } else {
                    existingUser.events.push({
                         eventId: event.id,
                         title: event.title,
                         dateTime: event.dateTime,
                         participationStatus: null,
                         invitationStatus: inv.status,
                         invited: true,
                    });
               }

               usersMap.set(inv.user.id, existingUser);
          });
     });

     return Array.from(usersMap.values());
};


const updateStatus = async (
     user: IRequestUser,
     participationId: string,
     newStatus: ParticipationStatus,
) => {
     const participation = await prisma.participation.findUnique({
          where: { id: participationId },
          include: { event: true },
     });

     if (!participation) {
          throw new AppError(status.NOT_FOUND, "Participation not found");
     }

     // Only organizer or admin
     if (
          participation.event.organizerId !== user.userId
     ) {
          throw new AppError(status.FORBIDDEN, "Not authorized");
     }

     return prisma.participation.update({
          where: { id: participationId },
          data: { status: newStatus },
     });
};

export const ParticipationService = {
     getMyEvents,
     getMyAllEventParticipants,
     getEventParticipants,
     updateStatus,
};
