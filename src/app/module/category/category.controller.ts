import { Request, Response } from "express";
import status from "http-status";
import { CategoryService } from "./category.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

// CREATE
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.createCategory(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Category created",
    data: result,
  });
});

// GET ALL
const getAllCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.getAllCategories();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Categories fetched",
    data: result,
  });
});

// GET SINGLE
const getSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await CategoryService.getSingleCategory(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Category fetched",
    data: result,
  });
});

// UPDATE
const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await CategoryService.updateCategory(id as string, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Category updated",
    data: result,
  });
});

// DELETE
const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await CategoryService.deleteCategory(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Category deleted",
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};