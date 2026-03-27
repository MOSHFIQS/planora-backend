import { Request, Response } from "express";
import status from "http-status";
import { AdminService } from "./admin.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users fetched",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status: statusValue } = req.body;

  const result = await AdminService.updateUserStatus(id as string, statusValue);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User status updated",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await AdminService.deleteUser(id as string, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User deleted",
    data: result,
  });
});

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminStats();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin stats fetched",
    data: result,
  });
});


export const AdminController = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAdminStats,
};