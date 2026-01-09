import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import {
  BAD_REQUEST_STATUS_CODE,
  NOT_FOUND_STATUS_CODE,
  SUCCESSFULLY_CREATED_STATUS_CODE,
  SUCCESSFULLY_FETCHED_STATUS_CODE,
} from "../constants";
import { IUrl } from "../models/url";
import { AuthenticatedRequest } from "../types";
import { UrlService } from "../services/url.service";
import { buildQuery } from "../utils/buildQuery";

// @description: Create url handler
// @route  POST /api/v1/urls
// @access  Private
const CreateUrlHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = (req as AuthenticatedRequest).user;
    const url = await UrlService.createUrl(userId, {
      ...req.body,
    });
    res.status(SUCCESSFULLY_CREATED_STATUS_CODE).json(url);
  }
);

// @description: Get All Urls Handler
// @route  GET /api/v1/urls
// @access  Private
const GetAllUrlHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10 } = req.query;

    const queryFilter = buildQuery(req);
    const skip = (Number(page) - 1) * Number(limit);

    const urls = await UrlService.getAllUrls(queryFilter, skip, Number(limit));
    res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json(urls);
  }
);

// @description: Get A Single url Handler
// @route  GET /api/v1/urls/:id
// @access  Public
const GetSinglUrlHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const url = await UrlService.getUrlById(id);
    res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json(url);
  }
);

// @description: Update A Single url Handler
// @route  PUT /api/v1/urls/:id
// @access  Private
const UpdateUrlHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const existingUrl = await UrlService.getUrlById(id);

    if (!existingUrl) {
      res.status(BAD_REQUEST_STATUS_CODE);
      throw new Error("This url does not exist");
    }
    const url = await UrlService.updateUrl(id, req.body as Partial<IUrl>);
    res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json(url);
  }
);

// @description: Delete A Single url Handler
// @route  DELETE /api/v1/urls/:id
// @access  Private
const DeleteUrlHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const existingUrl = await UrlService.getUrlById(id);

    if (!existingUrl) {
      res.status(BAD_REQUEST_STATUS_CODE);
      throw new Error("This url does not exist");
    }
    const message = await UrlService.deleteUrl(id);
    res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json(message);
  }
);

export {
  CreateUrlHandler,
  GetAllUrlHandler,
  GetSinglUrlHandler,
  UpdateUrlHandler,
  DeleteUrlHandler,
};
