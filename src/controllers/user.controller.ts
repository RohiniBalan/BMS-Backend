import { Request, Response } from "express";
import * as userService from "../services/user.service";

export const getUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};