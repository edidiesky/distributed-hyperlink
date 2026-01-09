import { AuthenticatedRequest, IURL } from "../types";
import { Request } from "express";
import logger from "./logger";

export const buildQuery = (req: Request): Partial<IURL> => {
  const { userId, role } = (req as AuthenticatedRequest).user;
  const {
  } = req.query;

  let queryFilter: Partial<IURL> = {
  };
  return queryFilter;
};
