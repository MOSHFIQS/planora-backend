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
const getAllEvents = catchAsync(async (req:Request, res:Response) => {
     const result = await EventService.getAllEvents();

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "Events fetched successfully",
          data: result,
     });
});
export const getSingleEventPublic = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
  const user = req.user!;

  const result = await EventService.getSingleEventPublic(user, id as string);


    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Event fetched successfully",
        data: result,
    });
});

export const organizersSingleEventById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId; 
    const userRole = req.user?.role;

    const event = await EventService.organizersSingleEventById(id as string);

    // Only organizer or admin can access
    if (event.organizerId !== userId && userRole !== "ADMIN") {
        throw new AppError(status.UNAUTHORIZED, "You are not authorized to view this event");
    }

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Event fetched successfully",
        data: event,
    });
});

const getMyEvents = catchAsync(async (req:Request, res:Response) => {
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

const updateEvent = catchAsync(async (req:Request, res:Response) => {
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

const deleteEvent = catchAsync(async (req:Request, res:Response) => {
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

const getAllEventsAdmin = catchAsync(async (req:Request, res:Response) => {
     const result = await EventService.getAllEventsAdmin();

     sendResponse(res, {
          httpStatusCode: status.OK,
          success: true,
          message: "All events fetched (Admin)",
          data: result,
     });
});

export const EventController = {
     createEvent,
     getAllEvents,
     getSingleEventPublic,
     organizersSingleEventById,
     getMyEvents,
     updateEvent,
     deleteEvent,
     getAllEventsAdmin,
};
