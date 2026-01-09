import express from "express";
import { CreateUrlHandler, GetAllUrlHandler } from "../controllers/urls.controller";
import {
  authenticate,
} from "../middleware/auth.middleware";
import { createUrlSchema } from "../validators/Url.validation";
import { validateRequest } from "../middleware/validate.middleware";
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


