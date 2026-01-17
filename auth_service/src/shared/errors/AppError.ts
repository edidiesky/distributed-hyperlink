import {
  BAD_REQUEST_STATUS_CODE,
  CONFLICT_STATUS_CODE,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND_STATUS_CODE,
  UNAUTHENTICATED_STATUS_CODE,
  UNAUTHORIZED_STATUS_CODE,
} from "../constants";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;
  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean,
    details?: any,
  ) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(message, CONFLICT_STATUS_CODE, true, details);
  }

  static internal(message: string = "Internal server Error"): AppError {
    return new AppError(message, INTERNAL_SERVER_ERROR, false);
  }

  static notFound(message: string = "Resource not found"): AppError {
    return new AppError(message, NOT_FOUND_STATUS_CODE, true);
  }

  static unauthorized(message: string, details?: any): AppError {
    return new AppError(message, UNAUTHORIZED_STATUS_CODE, true, details);
  }

  static unauthenticated(message: string, details?: any): AppError {
    return new AppError(message, UNAUTHENTICATED_STATUS_CODE, true, details);
  }

  static badRequest(message: string, details?: any): AppError {
    return new AppError(message, BAD_REQUEST_STATUS_CODE, true, details);
  }
}
