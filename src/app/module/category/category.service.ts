import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateCategory, IUpdateCategory } from "./category.interface";

// CREATE
const createCategory = async (payload: ICreateCategory) => {
  return prisma.category.create({
    data: payload,
  });
};

// GET ALL
const getAllCategories = async () => {
  return prisma.category.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
};

// GET SINGLE
const getSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category || category.isDeleted) {
    throw new AppError(status.NOT_FOUND, "Category not found");
  }

  return category;
};

// UPDATE
const updateCategory = async (id: string, payload: IUpdateCategory) => {
  await getSingleCategory(id);

  return prisma.category.update({
    where: { id },
    data: payload,
  });
};

// DELETE (SOFT)
const deleteCategory = async (id: string) => {
  await getSingleCategory(id);

  return prisma.category.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};