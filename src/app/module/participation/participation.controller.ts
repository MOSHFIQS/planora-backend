import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { ParticipationService } from "./participation.service";
import { ParticipationStatus } from "../../../generated/prisma/enums";
import { IQueryParams } from "../../interfaces/query.interface";





const getMyEvents = catchAsync(async (req: Request, res: Response) => {
     const user = req.user!;
     const query = req.query;

     const result = await ParticipationService.getMyEvents(user, query as IQueryParams);

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message:
               result.data.length === 0
                    ? "You have not joined any events yet."
                    : "My events fetched",
          data: result,
     });
});


const getEventParticipants = catchAsync(async (req: Request, res: Response) => {
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

const getMyAllEventParticipants = catchAsync(async (req: Request, res: Response) => {
     const user = req.user;
     if (!user) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

     const result = await ParticipationService.getMyAllEventParticipants(user);

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "All participants of your events fetched",
          data: result,
     });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
     const user = req.user;
     if (!user) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

     const { id } = req.params;
     const { status: newStatus } = req.body;

     // Validate status
     if (!Object.values(ParticipationStatus).includes(newStatus)) {
          throw new AppError(status.BAD_REQUEST, "Invalid status value");
     }

     const result = await ParticipationService.updateStatus(
          user,
          id as string,
          newStatus,
     );

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: `Participation ${newStatus.toLowerCase()}`,
          data: result,
     });
});

export const ParticipationController = {
     getMyEvents,
     getMyAllEventParticipants,
     getEventParticipants,
     updateStatus,
};
