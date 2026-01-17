import Joi from "joi";
export const createUrlSchema = Joi.object({
  url: Joi.string().min(4).max(30).required(),
  destination: Joi.string().uri().required(),
  description: Joi.string().max(255).optional(),
  shortCode: Joi.string().alphanum().min(4).max(10).optional(),
  expirationDate: Joi.date().greater('now').optional(),
  
});
