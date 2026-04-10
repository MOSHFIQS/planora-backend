import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { ParticipationStatus } from "../../../generated/prisma/enums";
import { ICreateReviewPayload, IUpdateReviewPayload } from "./review.interface";


// Create review
const createReview = async (
  user: IRequestUser,
  payload: ICreateReviewPayload
) => {

  const event = await prisma.event.findUnique({
    where: { id: payload.eventId },
  });

  if (!event) throw new AppError(status.NOT_FOUND, "Event not found");

  // Organizer cannot review own event
  if (event.organizerId === user.userId) {
    throw new AppError(status.BAD_REQUEST, "Organizer cannot review own event");
  }

  //  Must have approved participation
  const participation = await prisma.participation.findUnique({
    where: {
      userId_eventId: {
        userId: user.userId,
        eventId: payload.eventId,
      },
    },
  });

  if (!participation || participation.status !== ParticipationStatus.APPROVED) {
    throw new AppError(status.FORBIDDEN, "You did not attend this event");
  }

  // Event must be finished
  // if (event.dateTime > new Date()) {
  //   throw new AppError(status.BAD_REQUEST, "Event not finished yet");
  // }

  // Prevent duplicate review
  const existing = await prisma.review.findUnique({
    where: {
      userId_eventId: {
        userId: user.userId,
        eventId: payload.eventId,
      },
    },
  });

  if (existing) {
    throw new AppError(status.BAD_REQUEST, "Already reviewed");
  }

  return prisma.review.create({
    data: {
      userId: user.userId,
      eventId: payload.eventId,
      rating: payload.rating,
      comment: payload.comment,
    },
  });
};


//  Update review
const updateReview = async (
  user: IRequestUser,
  reviewId: string,
  payload: IUpdateReviewPayload
) => {

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new AppError(status.NOT_FOUND, "Review not found");

  if (review.userId !== user.userId) {
    throw new AppError(status.FORBIDDEN, "You are not authorized to update this review");
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: payload,
  });
};


// Delete review
const deleteReview = async (
  user: IRequestUser,
  reviewId: string
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      event: true, // needed to check organizer
    },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  const isOwner = review.userId === user.userId;
  const isOrganizer = review.event.organizerId === user.userId;
  const isAdmin = user.role === "ADMIN";
  const isSuperAdmin = user.role === "SUPERADMIN";

  if (!isOwner && !isOrganizer && !isAdmin && !isSuperAdmin) {
    throw new AppError(status.FORBIDDEN, "You are not authorized to delete this review");
  }

  return prisma.review.delete({
    where: { id: reviewId },
  });
};


// Event reviews
const getEventReviews = async (eventId: string) => {

  return prisma.review.findMany({
    where: { eventId },
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });
};


// My reviews
const getMyReviews = async (user: IRequestUser) => {

  return prisma.review.findMany({
    where: { userId: user.userId },
    include: {
      event: true,
      user: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};


const getOrganizerEventReviewsByEventId = async (
  user: IRequestUser,
  eventId: string
) => {
  try {
    

    // check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(status.NOT_FOUND, "Event not found");
    }

    // check ownership
    if (event.organizerId !== user.userId) {
      throw new AppError(status.FORBIDDEN, "You are not the organizer of this event");
    }

    // fetch reviews
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return reviews;
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to fetch event reviews"
    );
  }
};

export const ReviewService = {
  createReview,
  updateReview,
  deleteReview,
  getEventReviews,
  getMyReviews,
  getOrganizerEventReviewsByEventId
};