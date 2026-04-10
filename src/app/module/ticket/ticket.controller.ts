import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TicketService } from "./ticket.service";
import { IQueryParams } from "../../interfaces/query.interface";

// Get my tickets
const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const query = req.query;

  const result = await TicketService.getUserTickets(user, query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "My tickets fetched",
    data: result,
  });
});

// Get all tickets for event (Organizer/Admin)
const getEventTickets = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const result = await TicketService.getEventTickets(eventId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Event tickets fetched",
    data: result,
  });
});

// Check-in ticket (QR scan)
const checkInTicket = catchAsync(async (req: Request, res: Response) => {
  const { qrCode } = req.body;
  const organizerId = req.user!.userId;

  const result = await TicketService.checkIn(qrCode, organizerId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Ticket checked in",
    data: result,
  });
});

export const TicketController = {
  getMyTickets,
  getEventTickets,
  checkInTicket,
};