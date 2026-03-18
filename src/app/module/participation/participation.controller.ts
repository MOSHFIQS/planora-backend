import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { ParticipationService } from "./participation.service";

const joinEvent = catchAsync(async (req: Request, res: Response) => {
     const user = req.user;
     if (!user) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

     const { eventId } = req.params;

     const result = await ParticipationService.joinEvent(
          user,
          eventId as string,
     );

     sendResponse(res, {
          httpStatusCode: status.CREATED,
          success: true,
          message: "Joined event successfully",
          data: result,
     });
});

const cancelParticipation = catchAsync(async (req: Request, res: Response) => {
     const user = req.user!;
     const { eventId } = req.params;

     const result = await ParticipationService.cancelParticipation(
          user,
          eventId as string,
     );

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Participation canceled",
          data: result,
     });
});

const getMyEvents = catchAsync(async (req, res) => {
     const user = req.user!;

     const result = await ParticipationService.getMyEvents(user);

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "My events fetched",
          data: result,
     });
});

// const getEventParticipants = catchAsync(async (req, res) => {

//   const { eventId } = req.params;

//   const result = await ParticipationService.getEventParticipants(eventId as string);

//   sendResponse(res, {
//     httpStatusCode: status.OK,
//     success: true,
//     message: "Participants fetched",
//     data: result,
//   });
// });

const getEventParticipants = catchAsync(async (req, res) => {
     const user = req.user;
     if (!user) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

     const { eventId } = req.params;

     const result = await ParticipationService.getEventParticipants(
          user,
          eventId as string,
     );

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Participants fetched",
          data: result,
     });
});
export const ParticipationController = {
     joinEvent,
     cancelParticipation,
     getMyEvents,
     getEventParticipants,
};
