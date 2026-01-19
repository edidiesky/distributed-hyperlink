import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import logger from "../shared/logger";
import { AuthenticatedRequest } from "../shared/types";
import { BAD_REQUEST_STATUS_CODE, SUCCESSFULLY_CREATED_STATUS_CODE, SUCCESSFULLY_FETCHED_STATUS_CODE } from "../shared/constants";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, first_name, last_name } = req.body;
    try {
      const result = await this.authService.register({
        email,
        password,
        first_name,
        last_name,
      });

      res.status(SUCCESSFULLY_CREATED_STATUS_CODE).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error("Registration of client has failed", {
          error: error.message,
          email,
          first_name,
          event: "registration_error",
        });
      }

      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
      const result = await this.authService.login({ email, password });

      res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error("login of client has failed", {
          error: error.message,
          email,
          event: "login_error",
        });
      }

      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(BAD_REQUEST_STATUS_CODE).json({
          success: false,
          error: "Refresh token is required",
        });
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json({
        success: true,
        data: { tokens },
      });
    } catch (error: any) {
      logger.error("Token refresh failed", { error: error.message });
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId; // Set by auth middleware
      const { refreshToken } = req.body;
      const accessToken = req.headers.authorization?.split(" ")[1];

      if (!accessToken || !refreshToken) {
        return res.status(BAD_REQUEST_STATUS_CODE).json({
          success: false,
          error: "Tokens are required",
        });
      }

      await this.authService.logout(userId, accessToken, refreshToken);

      res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      logger.error("Logout failed", { error: error.message });
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;

      await this.authService.logoutAll(userId!);

      res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json({
        success: true,
        message: "Logged out from all devices",
      });
    } catch (error: any) {
      logger.error("Logout all failed", { error: error.message });
      next(error);
    }
  };

  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(BAD_REQUEST_STATUS_CODE).json({
          success: false,
          error: "Token is required",
        });
      }

      const payload = await this.authService.verifyToken(token);

      res.status(SUCCESSFULLY_FETCHED_STATUS_CODE).json({
        success: true,
        data: payload,
      });
    } catch (error: any) {
      logger.error("Token verification failed", { error: error.message });
      next(error);
    }
  };
}
