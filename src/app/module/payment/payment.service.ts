/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import status from "http-status";
import { v4 as uuidv4 } from "uuid";

import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../config/stripe.config";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import {
     PaymentStatus,
     ParticipationStatus,
     InvitationStatus,
} from "../../../generated/prisma/enums";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createStripeSession = async (paymentId: string, amount: number) => {
     const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [
               {
                    price_data: {
                         currency: "bdt",
                         product_data: { name: "Event Ticket" },
                         unit_amount: amount * 100,
                    },
                    quantity: 1,
               },
          ],
          metadata: { paymentId },

          // expire after 30 min
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

          success_url: `${process.env.FRONTEND_URL}/dashboard`,
          cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
     });

     return session;
};


const initiatePayment = async (
     user: IRequestUser,
     payload: {
          eventId?: string;
          invitationId?: string;
     },
) => {
     if (!payload.eventId && !payload.invitationId) {
          throw new AppError(status.BAD_REQUEST, "Invalid payment target");
     }

     let amount = 0;
     let participationId: string | undefined;

     if (payload.eventId) {
          const existingParticipation = await prisma.participation.findUnique({
               where: {
                    userId_eventId: {
                         userId: user.userId,
                         eventId: payload.eventId,
                    },
               },
          });

          if (existingParticipation?.status === ParticipationStatus.APPROVED) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "You already joined this event",
               );
          }
     }

     if (payload.invitationId) {
          const invitation = await prisma.invitation.findUnique({
               where: { id: payload.invitationId },
          });

          if (invitation?.status === InvitationStatus.ACCEPTED) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "Invitation already accepted",
               );
          }
     }

     const successPayment = await prisma.payment.findFirst({
          where: {
               userId: user.userId,
               status: PaymentStatus.SUCCESS,
               ...(payload.eventId && {
                    participation: {
                         eventId: payload.eventId,
                    },
               }),
               ...(payload.invitationId && {
                    invitationId: payload.invitationId,
               }),
          },
     });

     if (successPayment) {
          throw new AppError(status.BAD_REQUEST, "Payment already completed");
     }

     const existingPendingPayment = await prisma.payment.findFirst({
          where: {
               userId: user.userId,
               status: PaymentStatus.PENDING,
               ...(payload.eventId && {
                    participation: {
                         eventId: payload.eventId,
                    },
               }),
               ...(payload.invitationId && {
                    invitationId: payload.invitationId,
               }),
          },
          include: {
               participation: true,
          },
     });

     if (existingPendingPayment) {
          const session = await createStripeSession(
               existingPendingPayment.id,
               existingPendingPayment.amount,
          );

          return {
               paymentId: existingPendingPayment.id,
               paymentUrl: session.url,
          };
     }

     if (payload.eventId) {
          const event = await prisma.event.findUniqueOrThrow({
               where: { id: payload.eventId },
          });

          if (event.organizerId === user.userId) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "Organizer cannot join own event",
               );
          }

          let participation = await prisma.participation.findUnique({
               where: {
                    userId_eventId: {
                         userId: user.userId,
                         eventId: event.id,
                    },
               },
          });

          // FREE EVENT
          if (event.fee === 0) {
               if (!participation) {
                    participation = await prisma.participation.create({
                         data: {
                              userId: user.userId,
                              eventId: event.id,
                              status: ParticipationStatus.APPROVED,
                         },
                    });

                    await prisma.ticket.create({
                         data: {
                              userId: user.userId,
                              eventId: event.id,
                              participationId: participation.id,
                              qrCode: uuidv4(),
                         },
                    });
               }

               return { message: "Joined successfully (free event)" };
          }

          // PAID EVENT
          if (!participation) {
               participation = await prisma.participation.create({
                    data: {
                         userId: user.userId,
                         eventId: event.id,
                         status: ParticipationStatus.PENDING,
                    },
               });
          }

          participationId = participation.id;
          amount = event.fee;
     }

     if (payload.invitationId) {
          const invitation = await prisma.invitation.findUniqueOrThrow({
               where: { id: payload.invitationId },
               include: { event: true },
          });

          if (invitation.userId !== user.userId) {
               throw new AppError(status.FORBIDDEN, "Not your invitation");
          }

          // FREE INVITATION
          if (invitation.event.fee === 0) {
               await prisma.$transaction(async (tx) => {
                    await tx.invitation.update({
                         where: { id: invitation.id },
                         data: { status: InvitationStatus.ACCEPTED },
                    });

                    let participation = await tx.participation.findFirst({
                         where: {
                              userId: user.userId,
                              eventId: invitation.eventId,
                         },
                    });

                    if (!participation) {
                         participation = await tx.participation.create({
                              data: {
                                   userId: user.userId,
                                   eventId: invitation.eventId,
                                   status: ParticipationStatus.APPROVED,
                              },
                         });

                         await tx.ticket.create({
                              data: {
                                   userId: user.userId,
                                   eventId: invitation.eventId,
                                   participationId: participation.id,
                                   qrCode: uuidv4(),
                              },
                         });
                    }
               });

               return { message: "Joined successfully (free invitation)" };
          }

          let participation = await prisma.participation.findFirst({
               where: {
                    userId: user.userId,
                    eventId: invitation.eventId,
               },
          });

          if (!participation) {
               participation = await prisma.participation.create({
                    data: {
                         userId: user.userId,
                         eventId: invitation.eventId,
                         status: ParticipationStatus.PENDING,
                    },
               });
          }

          participationId = participation.id;
          amount = invitation.event.fee;
     }

     const payment = await prisma.payment.create({
          data: {
               amount,
               transactionId: uuidv4(),
               userId: user.userId,
               participationId,
               invitationId: payload.invitationId,
               status: PaymentStatus.PENDING,
          },
     });

     const session = await createStripeSession(payment.id, amount);

     return {
          paymentId: payment.id,
          paymentUrl: session.url,
     };
};


const handleStripeWebhookEvent = async (event: Stripe.Event) => {
     const existing = await prisma.payment.findFirst({
          where: { stripeEventId: event.id },
     });

     if (existing) return { message: "Already processed" };

     switch (event.type) {
          case "checkout.session.completed": {
               const session = event.data.object as any;
               const paymentId = session.metadata?.paymentId;
               if (!paymentId) return { message: "Missing paymentId" };

               const payment = await prisma.payment.findUnique({
                    where: { id: paymentId },
                    include: {
                         participation: { include: { event: true } },
                         invitation: { include: { event: true } },
                    },
               });

               if (!payment) return { message: "Payment not found" };

               //  CRITICAL FIX (prevent double payment)
               if (payment.status === PaymentStatus.SUCCESS) {
                    return { message: "Already paid, skipping duplicate" };
               }

               const eventData =
                    payment.participation?.event || payment.invitation?.event;

               if (!eventData) return { message: "Event not found" };

               if (eventData.dateTime < new Date()) {
                    await prisma.payment.update({
                         where: { id: paymentId },
                         data: {
                              status: PaymentStatus.CANCELED,
                              stripeEventId: event.id,
                         },
                    });
                    return { message: "Event expired, payment canceled" };
               }

               await prisma.$transaction(async (tx) => {
                    await tx.payment.update({
                         where: { id: paymentId },
                         data: {
                              status: PaymentStatus.SUCCESS,
                              stripeEventId: event.id,
                              paymentGatewayData: session,
                         },
                    });

                    // PARTICIPATION
                    if (payment.participationId) {
                         await tx.participation.update({
                              where: { id: payment.participationId },
                              data: { status: ParticipationStatus.APPROVED },
                         });

                         const existingTicket = await tx.ticket.findFirst({
                              where: {
                                   participationId: payment.participationId,
                              },
                         });

                         if (!existingTicket) {
                              await tx.ticket.create({
                                   data: {
                                        userId: payment.userId,
                                        eventId: payment.participation!.eventId,
                                        participationId: payment.participationId,
                                        qrCode: uuidv4(),
                                   },
                              });
                         }
                    }

                    // INVITATION
                    if (payment.invitationId && payment.invitation) {
                         let participation = await tx.participation.findFirst({
                              where: {
                                   userId: payment.userId,
                                   eventId: payment.invitation.eventId,
                              },
                         });

                         if (!participation) {
                              participation = await tx.participation.create({
                                   data: {
                                        userId: payment.userId,
                                        eventId: payment.invitation.eventId,
                                        status: ParticipationStatus.APPROVED,
                                   },
                              });
                         }

                         const existingTicket = await tx.ticket.findFirst({
                              where: {
                                   participationId: participation.id,
                              },
                         });

                         if (!existingTicket) {
                              await tx.ticket.create({
                                   data: {
                                        userId: payment.userId,
                                        eventId: payment.invitation.eventId,
                                        participationId: participation.id,
                                        qrCode: uuidv4(),
                                   },
                              });
                         }

                         await tx.invitation.update({
                              where: { id: payment.invitationId },
                              data: { status: InvitationStatus.ACCEPTED },
                         });
                    }
               });

               break;
          }

          case "payment_intent.payment_failed":
          case "checkout.session.expired": {
               const session = event.data.object as any;
               const paymentId = session.metadata?.paymentId;
               if (!paymentId) return;

               await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                         status: PaymentStatus.FAILED,
                         stripeEventId: event.id,
                    },
               });

               break;
          }

          default:
               break;
     }

     return { message: "Webhook processed" };
};



// const getMyPayments = async (user: IRequestUser) => {
//      const payments = await prisma.payment.findMany({
//           where: {
//                userId: user.userId,
//           },
//           include: {
//                participation: {
//                     include: {
//                          event: true,
//                     },
//                },
//                invitation: {
//                     include: {
//                          event: true,
//                     },
//                },
//           },
//           orderBy: {
//                createdAt: "desc",
//           },
//      });

//      return payments;
// };

const getMyPayments = async (
     user: IRequestUser,
     query: IQueryParams
) => {
     if (!user?.userId) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     const queryBuilder = new QueryBuilder(
          prisma.payment,
          query
     );

     const result = await queryBuilder
          .where({
               userId: user.userId,
          })
          .include({
               participation: {
                    include: {
                         event: true,
                    },
               },
               invitation: {
                    include: {
                         event: true,
                    },
               },
          })
          .sort()
          .paginate()
          .execute();

     return result;
};

// 🔹 2. Organizer → participants payments
// const getOrganizerPayments = async (user: IRequestUser, query: IQueryParams) => {
//      const payments = await prisma.payment.findMany({
//           where: {
//                OR: [
//                     {
//                          participation: {
//                               event: {
//                                    organizerId: user.userId,
//                               },
//                          },
//                     },
//                     {
//                          invitation: {
//                               event: {
//                                    organizerId: user.userId,
//                               },
//                          },
//                     },
//                ],
//           },
//           include: {
//                user: true,
//                participation: {
//                     include: {
//                          event: true,
//                     },
//                },
//                invitation: {
//                     include: {
//                          event: true,
//                     },
//                },
//           },
//           orderBy: {
//                createdAt: "desc",
//           },
//      });

//      return payments;
// };

const getOrganizerPayments = async (
     user: IRequestUser,
     query: IQueryParams
) => {
     if (!user?.userId) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     const queryBuilder = new QueryBuilder(
          prisma.payment,
          query
     );

     const result = await queryBuilder
          .where({
               OR: [
                    {
                         participation: {
                              event: {
                                   organizerId: user.userId,
                              },
                         },
                    },
                    {
                         invitation: {
                              event: {
                                   organizerId: user.userId,
                              },
                         },
                    },
               ],
          })
          .include({
               user: true,
               participation: {
                    include: {
                         event: true,
                    },
               },
               invitation: {
                    include: {
                         event: true,
                    },
               },
          })
          .sort()
          .paginate()
          .execute();

     return result;
};

// 🔹 3. Admin → all payments
// const getAllPayments = async (user: IRequestUser) => {
//      // Only admin allowed
//      if (user.role !== "ADMIN") {
//           throw new Error("Unauthorized access");
//      }

//      const payments = await prisma.payment.findMany({
//           include: {
//                user: true,
//                participation: {
//                     include: {
//                          event: true,
//                     },
//                },
//                invitation: {
//                     include: {
//                          event: true,
//                     },
//                },
//           },
//           orderBy: {
//                createdAt: "desc",
//           },
//      });

//      return payments;
// };


const getAllPayments = async (
  user: IRequestUser,
  query: IQueryParams
) => {
  // Only admin allowed
  if (user.role !== "ADMIN") {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const queryBuilder = new QueryBuilder(
    prisma.payment,
    query
  );

  const result = await queryBuilder
    .include({
      user: true,
      participation: {
        include: {
          event: true,
        },
      },
      invitation: {
        include: {
          event: true,
        },
      },
    })
    .sort()
    .paginate()
    .execute();

  return result;
};


export const PaymentService = {
     initiatePayment,
     handleStripeWebhookEvent,
     getMyPayments,
     getOrganizerPayments,
     getAllPayments,
};
