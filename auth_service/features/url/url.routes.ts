import express from "express";
import { CreateUrlHandler, GetAllUrlHandler } from "../controllers/urls.controller";
import {
  authenticate,
} from "../../shared/middleware/auth.middleware";
import { createUrlSchema } from "../../shared/validators/url.validation";
import { validateRequest } from "../../shared/middleware/validate.middleware";
const router = express.Router();

router
  .route("/")
  .post(
    authenticate,
    validateRequest(createUrlSchema),
    CreateUrlHandler
  )
  .get(authenticate, GetAllUrlHandler);
export default router;


