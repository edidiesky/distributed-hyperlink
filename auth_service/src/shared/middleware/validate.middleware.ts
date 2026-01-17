
import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { AppError } from "../errors/AppError";

export const validateRequest = (
  schema: Schema,
  source: "body" | "query" | "params" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data =
      source === "body"
        ? req.body
        : source === "query"
          ? req.query
          : req.params;
    const { error } = schema.validate(data, { abortEarly: false });

    if (error) {
      const errorMessages = error.details
        .map((detail) => detail.message)
        .join(", ");
      throw AppError.badRequest("Validation Error:", errorMessages);
    }
    next();
  };
};
