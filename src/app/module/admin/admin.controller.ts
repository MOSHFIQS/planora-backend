import { Request, Response } from "express";
import status from "http-status";
import { AdminService } from "./admin.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { IQueryParams } from "../../interfaces/query.interface";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.user!, req.query as IQueryParams);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Users fetched", data: result });
});

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllAdmins(req.user!, req.query as IQueryParams);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Admins fetched", data: result });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getSingleUser(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User fetched", data: result });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(req.params.id as string, req.body.status, req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User status updated", data: result });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.deleteUser(req.params.id as string, req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User deleted", data: result });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserRole(req.params.id as string, req.body.role, req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "User role updated", data: result });
});


const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.createAdmin(req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Admin created", data: result });
});


export const AdminController = {
  getAllUsers,
  getAllAdmins,
  getSingleUser,
  updateUserStatus,
  deleteUser,
  updateUserRole,
  createAdmin,
};