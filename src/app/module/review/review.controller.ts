import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ReviewService } from "./review.service";


// Create review
const createReview = catchAsync(async (req:Request, res:Response) => {

  const user = req.user!;
  const result = await ReviewService.createReview(user, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Review created",
    data: result,
  });
});


// Update
const updateReview = catchAsync(async (req:Request, res:Response) => {

  const user = req.user!;
  const { id } = req.params;

  const result = await ReviewService.updateReview(user, id as string, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Review updated",
    data: result,
  });
});


// Delete
const deleteReview = catchAsync(async (req:Request, res:Response) => {

  const user = req.user!;
  const { id } = req.params;

  const result = await ReviewService.deleteReview(user, id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Review deleted",
    data: result,
  });
});


// Event reviews
const getEventReviews = catchAsync(async (req:Request, res:Response) => {

  const { eventId } = req.params;

  const result = await ReviewService.getEventReviews(eventId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event reviews fetched",
    data: result,
  });
});


// My reviews
const getMyReviews = catchAsync(async (req:Request, res:Response) => {

  const user = req.user!;

  const result = await ReviewService.getMyReviews(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "My reviews fetched",
    data: result,
  });
});


export const ReviewController = {
  createReview,
  updateReview,
  deleteReview,
  getEventReviews,
  getMyReviews,
};