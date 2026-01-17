export const UNAUTHORIZED_STATUS_CODE = 403;
export const BAD_REQUEST_STATUS_CODE = 400;
export const SUCCESSFULLY_CREATED_STATUS_CODE = 201;
export const SUCCESSFULLY_FETCHED_STATUS_CODE = 200;
export const UNAUTHENTICATED_STATUS_CODE = 401;
export const NOT_FOUND_STATUS_CODE = 404;
export const SERVER_ERROR_STATUS_CODE = 500;


export const services: Services = {
  auth: process.env.AUTH_SERVICE_URL || "http://auth:4001",
  urls: process.env.URLS_SERVICE_URL || "http://urls:4002",
  audit: process.env.AUDIT_SERVICE_URL || "http://audit:4003",
  payment: process.env.PAYMENT_SERVICE_URL || "http://payment:4004",
  categories: process.env.CATEGORIES_SERVICE_URL || "http://categories:4005",
  notification:
    process.env.NOTIFICATION_SERVICE_URL || "http://notification:4006",
};

/**
 * @description Interfacing description
 */
export interface Services {
  auth: string;
  audit: string;
  categories: string;
  payment: string;
  urls: string;
  notification: string;
}
