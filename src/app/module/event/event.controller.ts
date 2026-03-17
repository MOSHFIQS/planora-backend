import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { EventService } from "./event.service";
import AppError from "../../errorHelpers/AppError";

const createEvent = catchAsync(async (req: Request, res: Response) => {
     const user = req.user;
     if (!user) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     const result = await EventService.createEvent(user, req.body);

     sendResponse(res, {
          httpStatusCode: status.CREATED,
          success: true,
          message: "Event created successfully",
          data: result,
     });
});
const getAllEvents = catchAsync(async (req, res) => {
     const result = await EventService.getAllEvents();

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Events fetched successfully",
          data: result,
     });
});

const getSingleEvent = catchAsync(async (req, res) => {
     const { id } = req.params;

     const result = await EventService.getSingleEvent(id as string);

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Event fetched successfully",
          data: result,
     });
});

const getMyEvents = catchAsync(async (req, res) => {
     const user = req.user;
     if (!user) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     const result = await EventService.getMyEvents(user);

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "My events fetched successfully",
          data: result,
     });
});

const updateEvent = catchAsync(async (req, res) => {
     const { id } = req.params;
     const user = req.user;

     if (!user) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     const result = await EventService.updateEvent(
          id as string,
          user,
          req.body,
     );

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Event updated successfully",
          data: result,
     });
});

const deleteEvent = catchAsync(async (req, res) => {
     const { id } = req.params;
     const user = req.user;
     if (!user) {
          throw new AppError(status.UNAUTHORIZED, "Unauthorized");
     }

     await EventService.deleteEvent(id as string, user);

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Event deleted successfully",
     });
});

export const EventController = {
     createEvent,
     getAllEvents,
     getSingleEvent,
     getMyEvents,
     updateEvent,
     deleteEvent,
};
