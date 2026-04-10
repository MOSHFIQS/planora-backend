import { Request, Response } from "express";
import status from "http-status";
import { StatService } from "./stat.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

const getSuperAdminStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await StatService.getSuperAdminStats();
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Super admin stats fetched", data: result });
});

const getAdminStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await StatService.getAdminStats();
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Admin stats fetched", data: result });
});

const getOrganizerStats = catchAsync(async (req: Request, res: Response) => {
  const result = await StatService.getOrganizerStats(req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Organizer stats fetched", data: result });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const result = await StatService.getUserStats(req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User stats fetched", data: result });
});

const getPublicStats = catchAsync(async (req: Request, res: Response) => {
  
  const result = await StatService.getPublicStats();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User stats fetched",
    data: result,
  });
});

export const StatController = {
  getSuperAdminStats,
  getAdminStats,
  getOrganizerStats,
  getUserStats,
  getPublicStats,
};