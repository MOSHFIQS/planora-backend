/* eslint-disable @typescript-eslint/no-explicit-any */

import Stripe from "stripe";
import status from "http-status";
import { v4 as uuidv4 } from "uuid";

import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../config/stripe.config";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { PaymentStatus } from "../../../generated/prisma/enums";

// create stripe checkout session
const initiatePayment = async (
     user: IRequestUser,
     payload: {
          participationId?: string;
          invitationId?: string;
     },
) => {
     if (!payload.participationId && !payload.invitationId) {
          throw new AppError(status.BAD_REQUEST, "Invalid payment target");
     }

     let amount = 0;

     // handle participation payment
     if (payload.participationId) {
          const participation = await prisma.participation.findUniqueOrThrow({
               where: { id: payload.participationId },
               include: { event: true },
          });

          if (participation.userId !== user.userId) {
               throw new AppError(status.FORBIDDEN, "Not your participation");
          }

          // stop if event already passed
          if (participation.event.dateTime < new Date()) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "This event has already expired",
               );
          }

          // prevent paying twice
          const paid = await prisma.payment.findFirst({
               where: {
                    participationId: payload.participationId,
                    status: PaymentStatus.SUCCESS,
               },
          });

          if (paid) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "Already paid for this event",
               );
          }

          // prevent multiple pending payments
          const pending = await prisma.payment.findFirst({
               where: {
                    participationId: payload.participationId,
                    status: PaymentStatus.PENDING,
               },
          });

          if (pending) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "Payment already in progress",
               );
          }

          amount = participation.event.fee;
     }

     // handle invitation payment
     if (payload.invitationId) {
          const invitation = await prisma.invitation.findUniqueOrThrow({
               where: { id: payload.invitationId },
               include: { event: true },
          });

          if (invitation.userId !== user.userId) {
               throw new AppError(status.FORBIDDEN, "Not your invitation");
          }

          // stop if event already passed
          if (invitation.event.dateTime < new Date()) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "This event has already expired",
               );
          }

          const paid = await prisma.payment.findFirst({
               where: {
                    invitationId: payload.invitationId,
                    status: PaymentStatus.SUCCESS,
               },
          });

          if (paid) {
               throw new AppError(status.BAD_REQUEST, "Already paid");
          }

          const pending = await prisma.payment.findFirst({
               where: {
                    invitationId: payload.invitationId,
                    status: PaymentStatus.PENDING,
               },
          });

          if (pending) {
               throw new AppError(
                    status.BAD_REQUEST,
                    "Payment already in progress",
               );
          }

          amount = invitation.event.fee;
     }

     // create payment record before redirecting to stripe
     const payment = await prisma.payment.create({
          data: {
               amount,
               transactionId: uuidv4(),
               userId: user.userId,
               participationId: payload.participationId,
               invitationId: payload.invitationId,
               status: PaymentStatus.PENDING,
          },
     });

     // create stripe checkout session
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

          metadata: {
               paymentId: payment.id,
          },

          success_url: `${process.env.FRONTEND_URL}/payment-success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
     });

     return {
          paymentId: payment.id,
          paymentUrl: session.url,
     };
};

// handle stripe webhook events
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
                         participation: {
                              include: { event: true },
                         },
                         invitation: {
                              include: { event: true },
                         },
                    },
               });

               if (!payment) return { message: "Payment not found" };

               // get related event (either from participation or invitation)
               const eventData =
                    payment.participation?.event || payment.invitation?.event;

               if (!eventData) return { message: "Event not found" };

               // double check expiry here because stripe can still complete payment later
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

                    // approve participation after successful payment
                    if (payment.participationId) {
                         await tx.participation.update({
                              where: { id: payment.participationId },
                              data: { status: "APPROVED" },
                         });
                    }

                    // accept invitation after successful payment
                    if (payment.invitationId) {
                         await tx.invitation.update({
                              where: { id: payment.invitationId },
                              data: { status: "ACCEPTED" },
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

export const PaymentService = {
     initiatePayment,
     handleStripeWebhookEvent,
};
