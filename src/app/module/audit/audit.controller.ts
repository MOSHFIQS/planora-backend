import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { prisma } from "../../lib/prisma";
import { AuditService } from "./audit.service";
import { IQueryParams } from "../../interfaces/query.interface";

const getAllLogs = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  console.log(query);
  const result = await AuditService.getAllLogs(query as IQueryParams);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Audit logs fetched successfully",
    data: result,
  });
});

export const AuditController = {
  getAllLogs,
};
