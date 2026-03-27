import { Request, Response } from "express";
import status from "http-status";
import { ProfileService } from "./profile.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;

  const result = await ProfileService.getMyProfile(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile fetched",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await ProfileService.updateProfile(user, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile updated",
    data: result,
  });
});

export const ProfileController = {
  getMyProfile,
  updateProfile,
};